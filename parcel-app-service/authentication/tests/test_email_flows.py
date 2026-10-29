import re
from unittest.mock import patch

from django.core import mail
from django.core.cache import cache
from django.test import RequestFactory, TestCase, override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

from authentication.models import CourierUser, CustomerUser, PasswordResetToken, VendorUser
from authentication.services import PASSWORD_RESET_REQUESTED_MESSAGE
from core.tokens import account_activation_token
from email_service.services import EmailService

FRONTEND = 'https://parcel-app-web.vercel.app'


@override_settings(FRONTEND_URL=FRONTEND, EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class CustomerPasswordResetEmailTests(TestCase):
	def setUp(self):
		cache.clear()
		self.client = APIClient()
		self.customer = CustomerUser.objects.create(
			email='reset-me@example.com', first_name='Reset', last_name='Me', role='customer', is_email_verified=True,
		)
		self.customer.set_password('OldPassword123')
		self.customer.save()

	def _request_reset(self, email):
		return self.client.post('/api/v1/auth/customer/password/reset/', {'email': email}, format='json')

	def test_request_emails_a_frontend_link_with_a_working_token(self):
		response = self._request_reset('Reset-Me@example.com')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['data'], PASSWORD_RESET_REQUESTED_MESSAGE)
		self.assertEqual(len(mail.outbox), 1)
		message = mail.outbox[0]
		self.assertEqual(message.to, ['reset-me@example.com'])
		self.assertEqual(message.content_subtype, 'html')

		link = re.search(rf'{re.escape(FRONTEND)}/reset-password\?token=([\w-]+)', message.body)
		self.assertIsNotNone(link, 'reset email should link to the web app reset page')
		token = link.group(1)
		self.assertTrue(PasswordResetToken.objects.filter(token=token, is_used=False).exists())

		save = self.client.post('/api/v1/auth/customer/password/save/', {
			'token': token, 'new_password': 'NewPassword456', 'confirm_password': 'NewPassword456',
		}, format='json')
		self.assertEqual(save.status_code, 200)
		self.customer.refresh_from_db()
		self.assertTrue(self.customer.check_password('NewPassword456'))

	def test_unknown_email_gets_the_same_response_and_no_email(self):
		response = self._request_reset('nobody@example.com')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['data'], PASSWORD_RESET_REQUESTED_MESSAGE)
		self.assertEqual(len(mail.outbox), 0)

	def test_delivery_failure_is_logged_not_raised(self):
		with patch('email_service.services.EmailMessage.send', side_effect=ConnectionRefusedError('smtp down')):
			with self.assertLogs('email_service.services', level='ERROR'):
				response = self._request_reset('reset-me@example.com')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['data'], PASSWORD_RESET_REQUESTED_MESSAGE)
		self.assertTrue(PasswordResetToken.objects.filter(object_id=self.customer.id).exists())


@override_settings(FRONTEND_URL=FRONTEND)
class ActivationLinkTests(TestCase):
	def _link(self, prefix, user, token=None):
		uid = urlsafe_base64_encode(force_bytes(user.pk))
		return f'/api/v1/{prefix}/{uid}/{token or account_activation_token.make_token(user)}/'

	def assertRedirectsToResult(self, response, status, role):
		self.assertEqual(response.status_code, 302)
		self.assertEqual(response['Location'], f'{FRONTEND}/verify-email?status={status}&role={role}')

	def test_customer_link_verifies_once_then_reports_already_verified(self):
		customer = CustomerUser.objects.create(email='activate-c@example.com', first_name='A', last_name='C', role='customer')
		link = self._link('auth/customer/activate', customer)

		self.assertRedirectsToResult(self.client.get(link), 'success', 'customer')
		customer.refresh_from_db()
		self.assertTrue(customer.is_email_verified)

		self.assertRedirectsToResult(self.client.get(link), 'already-verified', 'customer')

	def test_bad_token_or_uid_is_invalid_and_does_not_verify(self):
		customer = CustomerUser.objects.create(email='activate-bad@example.com', first_name='A', last_name='B', role='customer')

		self.assertRedirectsToResult(self.client.get(self._link('auth/customer/activate', customer, token='bad-token')), 'invalid', 'customer')
		self.assertRedirectsToResult(self.client.get('/api/v1/auth/customer/activate/not-a-uid/whatever/'), 'invalid', 'customer')
		customer.refresh_from_db()
		self.assertFalse(customer.is_email_verified)

	def test_vendor_and_courier_links_verify_and_queue_for_approval(self):
		vendor = VendorUser.objects.create(email='activate-v@example.com', first_name='A', last_name='V', phone='0870000001',
										   role='vendor', approval_status='changes_requested')
		courier = CourierUser.objects.create(email='activate-k@example.com', first_name='A', last_name='K', phone='0870000002',
											 role='courier', approval_status='changes_requested')

		self.assertRedirectsToResult(self.client.get(self._link('vendors/activate', vendor)), 'success', 'vendor')
		self.assertRedirectsToResult(self.client.get(self._link('couriers/activate', courier)), 'success', 'courier')
		for user in (vendor, courier):
			user.refresh_from_db()
			self.assertTrue(user.is_email_verified)
			self.assertEqual(user.approval_status, 'pending')


@override_settings(
	EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
	ALLOWED_HOSTS=['parcel-app-service.onrender.com'],
)
class ActivationEmailTests(TestCase):
	def test_activation_email_is_html_with_an_https_link_behind_the_proxy(self):
		customer = CustomerUser.objects.create(email='html@example.com', first_name='H', last_name='T', role='customer')
		request = RequestFactory().get('/', HTTP_HOST='parcel-app-service.onrender.com', secure=True)

		sent, _ = EmailService.send_activation_email(customer, request, email_type='customer')

		self.assertTrue(sent)
		message = mail.outbox[0]
		self.assertEqual(message.content_subtype, 'html')
		self.assertIn('https://parcel-app-service.onrender.com/api/v1/auth/customer/activate/', message.body)
