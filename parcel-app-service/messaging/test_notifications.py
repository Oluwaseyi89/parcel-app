from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from authentication.models import CustomerUser, UserSession, VendorUser
from messaging.models import Notification
from messaging.services import NotificationService


class NotificationTests(TestCase):
	def setUp(self):
		self.customer = CustomerUser.objects.create(
			email='notify-customer@example.com', first_name='N', last_name='C', role='customer',
		)
		self.vendor = VendorUser.objects.create(
			email='notify-vendor@example.com', first_name='N', last_name='V', phone='08800000001', role='vendor',
		)
		UserSession.objects.create(
			content_type=ContentType.objects.get_for_model(self.customer),
			object_id=self.customer.id,
			session_token='notify-customer-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)
		self.client = APIClient()
		self.client.credentials(HTTP_X_SESSION_TOKEN='notify-customer-token')

	def test_create_notification_targets_role_specific_recipient(self):
		notification = NotificationService.create_notification(self.vendor, 'Hi', 'Body')

		self.assertEqual(notification.recipient_type, 'vendor')
		self.assertEqual(notification.vendor_recipient, self.vendor)
		self.assertIsNone(notification.customer_recipient)

	def test_list_is_paginated_scoped_to_user_and_reports_unread_count(self):
		for i in range(23):
			NotificationService.create_notification(self.customer, f'Title {i}', 'Body')
		NotificationService.create_notification(self.vendor, 'Vendor only', 'Body')
		Notification.for_recipient(self.customer).filter(title='Title 0').update(is_read=True)

		response = self.client.get(reverse('v1:messaging:notification_list'))

		self.assertEqual(response.status_code, 200)
		self.assertEqual(len(response.data['data']), 20)
		self.assertEqual(response.data['pagination']['total_count'], 23)
		self.assertEqual(response.data['unread_count'], 22)
		self.assertNotIn('Vendor only', [n['title'] for n in response.data['data']])
		self.assertEqual(response.data['data'][0]['recipient_email'], self.customer.email)

	def test_mark_all_read_and_detail_update_only_touch_own_notifications(self):
		own = NotificationService.create_notification(self.customer, 'Mine', 'Body')
		other = NotificationService.create_notification(self.vendor, 'Theirs', 'Body')

		response = self.client.post(reverse('v1:messaging:notification_list'), {'action': 'mark_all_read'}, format='json')
		self.assertEqual(response.status_code, 200)
		own.refresh_from_db()
		other.refresh_from_db()
		self.assertTrue(own.is_read)
		self.assertFalse(other.is_read)

		response = self.client.patch(
			reverse('v1:messaging:notification_detail', kwargs={'notification_id': other.id}),
			{'action': 'mark_read'}, format='json',
		)
		self.assertEqual(response.status_code, 404)
