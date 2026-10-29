from datetime import timedelta
from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from authentication.models import AdminUser, CustomerUser
from messaging.models import EmailMessage, EmailQueue, MessageTemplate
from messaging.services import EmailService


def run_queue_inline(queue_id):
	# Tests must not depend on a Celery broker; run the task body synchronously.
	EmailService.process_email_queue(queue_id)


@override_settings(
	EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
	DEFAULT_FROM_EMAIL='Parcel App <no-reply@parcel.app>',
)
@patch('messaging.tasks.process_email_queue_task.delay', side_effect=run_queue_inline)
class BulkEmailTests(TestCase):
	def setUp(self):
		admin = AdminUser.objects.create(email='bulk-admin@example.com', first_name='B', last_name='A', role='admin')
		self.client = APIClient()
		self.client.force_authenticate(admin)
		self.template = MessageTemplate.objects.create(
			name='Promo', template_type='promotional', subject='Hello {name}', body_html='<p>Deals for {name}</p>',
		)
		self.url = reverse('v1:messaging:bulk_email')

	def test_sends_one_real_email_per_recipient(self, _delay):
		response = self.client.post(self.url, {
			'template_id': self.template.id,
			'name': 'Launch',
			'recipient_emails': ['a@example.com', 'b@example.com', 'A@example.com'],
		}, format='json')

		self.assertEqual(response.status_code, 201)
		self.assertEqual(response.data['data']['status'], 'completed')
		self.assertEqual(response.data['data']['success_count'], 2)
		queue = EmailQueue.objects.get(name='Launch')
		self.assertEqual(queue.status, 'completed')
		self.assertEqual((queue.total_recipients, queue.success_count, queue.failure_count), (2, 2, 0))

		self.assertEqual(len(mail.outbox), 2)
		self.assertEqual(sorted(m.to[0] for m in mail.outbox), ['a@example.com', 'b@example.com'])
		message = mail.outbox[0]
		self.assertEqual(message.from_email, 'Parcel App <no-reply@parcel.app>')
		self.assertEqual(message.alternatives[0][1], 'text/html')
		self.assertEqual(message.subject, 'Hello ')
		self.assertEqual(EmailMessage.objects.filter(status='sent').count(), 2)

	def test_group_filter_and_explicit_emails_are_merged(self, _delay):
		CustomerUser.objects.create(email='member@example.com', first_name='M', last_name='C', role='customer', is_email_verified=True)

		response = self.client.post(self.url, {
			'template_id': self.template.id,
			'name': 'Customers',
			'recipient_filter': {'user_type': 'all_customers'},
			'recipient_emails': ['member@example.com', 'extra@example.com'],
		}, format='json')

		self.assertEqual(response.status_code, 201)
		self.assertEqual(sorted(m.to[0] for m in mail.outbox), ['extra@example.com', 'member@example.com'])

	def test_inactive_template_is_rejected(self, _delay):
		self.template.is_active = False
		self.template.save()

		response = self.client.post(self.url, {'template_id': self.template.id, 'name': 'X', 'recipient_emails': ['a@example.com']}, format='json')

		self.assertEqual(response.status_code, 400)
		self.assertIn('template_id', response.data['errors'])
		self.assertFalse(EmailQueue.objects.exists())

	def test_delivery_failures_are_recorded_not_raised(self, _delay):
		with patch('messaging.services.EmailMultiAlternatives.send', side_effect=ConnectionRefusedError('smtp down')):
			with self.assertLogs('messaging.services', level='ERROR'):
				response = self.client.post(self.url, {
					'template_id': self.template.id, 'name': 'Down', 'recipient_emails': ['a@example.com'],
				}, format='json')

		self.assertEqual(response.status_code, 201)
		queue = EmailQueue.objects.get(name='Down')
		self.assertEqual((queue.success_count, queue.failure_count), (0, 1))
		self.assertEqual(EmailMessage.objects.get().status, 'failed')


class EmailStatsTests(TestCase):
	def setUp(self):
		self.admin = AdminUser.objects.create(email='stats-admin@example.com', first_name='S', last_name='A', role='admin')
		self.client = APIClient()
		self.client.force_authenticate(self.admin)
		self.url = reverse('v1:messaging:email_stats')

	def _message(self, **fields):
		return EmailMessage.objects.create(sender=self.admin, sender_email='no-reply@parcel.app', recipients=[{'email': 'x@example.com'}],
										   subject='S', body_html='<p>x</p>', **fields)

	def test_empty_database_returns_zeros(self):
		response = self.client.get(self.url)

		self.assertEqual(response.status_code, 200)
		data = response.data['data']
		for key in ('total_sent', 'total_delivered', 'total_opened', 'total_clicked'):
			self.assertEqual(data[key], 0)
		for key in ('open_rate', 'click_rate', 'bounce_rate'):
			self.assertEqual(data[key], 0.0)

	def test_counts_each_stage_from_timestamps(self):
		now = timezone.now()
		self._message(status='sent', sent_at=now)
		self._message(status='opened', sent_at=now, delivered_at=now, opened_at=now, open_count=1)
		self._message(status='clicked', sent_at=now, delivered_at=now, opened_at=now, click_count=2)
		self._message(status='bounced', sent_at=now)
		self._message(status='failed')

		data = self.client.get(self.url).data['data']

		self.assertEqual(data['total_sent'], 4)
		self.assertEqual(data['total_delivered'], 2)
		self.assertEqual(data['total_opened'], 2)
		self.assertEqual(data['total_clicked'], 1)
		self.assertEqual(data['open_rate'], 50.0)
		self.assertEqual(data['click_rate'], 25.0)
		self.assertEqual(data['bounce_rate'], 25.0)
		self.assertEqual(len(data['recent_activity']), 5)
		self.assertTrue(all('id' in row for row in data['recent_activity']))

	def test_date_range_and_invalid_dates(self):
		old = self._message(status='sent', sent_at=timezone.now())
		EmailMessage.objects.filter(pk=old.pk).update(created_at=timezone.now() - timedelta(days=60))

		self.assertEqual(self.client.get(self.url).data['data']['total_sent'], 0)
		start = (timezone.now() - timedelta(days=90)).date().isoformat()
		self.assertEqual(self.client.get(self.url, {'start_date': start}).data['data']['total_sent'], 1)

		response = self.client.get(self.url, {'start_date': 'last tuesday'})
		self.assertEqual(response.status_code, 400)
		self.assertEqual(response.data['status'], 'error')
