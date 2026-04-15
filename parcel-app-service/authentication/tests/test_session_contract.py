from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from authentication.models import CourierUser, CustomerUser, UserSession, VendorUser


class SessionContractTests(TestCase):
	def setUp(self):
		self.client = APIClient()

	def test_customer_login_sets_cookie_session_contract(self):
		customer = CustomerUser.objects.create(
			email='customer-login@example.com',
			first_name='Customer',
			last_name='Login',
			phone='08000000001',
			role='customer',
			is_email_verified=True,
		)
		customer.set_password('StrongPassword123')
		customer.save()

		response = self.client.post(
			'/auth/customer/login/',
			{'email': customer.email, 'password': 'StrongPassword123'},
			format='json',
		)

		self.assertEqual(response.status_code, 200)
		self.assertIn('auth_session', response.cookies)
		self.assertIn('logcus', response.cookies)
		self.assertEqual(response.cookies['logcus'].value, '1')

	def test_vendor_login_sets_cookie_session_contract(self):
		vendor = VendorUser.objects.create(
			email='vendor-login@example.com',
			first_name='Vendor',
			last_name='Login',
			phone='08000000002',
			role='vendor',
			is_email_verified=True,
			is_approved=True,
		)
		vendor.set_password('StrongPassword123')
		vendor.save()

		response = self.client.post(
			'/vendors/login/',
			{'email': vendor.email, 'password': 'StrongPassword123'},
			format='json',
		)

		self.assertEqual(response.status_code, 200)
		self.assertIn('auth_session', response.cookies)
		self.assertIn('logvend', response.cookies)
		self.assertEqual(response.cookies['logvend'].value, '1')

	def test_courier_login_sets_cookie_session_contract(self):
		courier = CourierUser.objects.create(
			email='courier-login@example.com',
			first_name='Courier',
			last_name='Login',
			phone='08000000003',
			role='courier',
			is_email_verified=True,
			is_approved=True,
		)
		courier.set_password('StrongPassword123')
		courier.save()

		response = self.client.post(
			'/couriers/login/',
			{'email': courier.email, 'password': 'StrongPassword123'},
			format='json',
		)

		self.assertEqual(response.status_code, 200)
		self.assertIn('auth_session', response.cookies)
		self.assertIn('logcour', response.cookies)
		self.assertEqual(response.cookies['logcour'].value, '1')

	def test_me_endpoint_returns_identity_from_cookie_session(self):
		customer = CustomerUser.objects.create(
			email='me-customer@example.com',
			first_name='Me',
			last_name='Customer',
			phone='08000000004',
			role='customer',
			is_email_verified=True,
		)
		customer.set_password('StrongPassword123')
		customer.save()

		content_type = ContentType.objects.get_for_model(customer)
		UserSession.objects.create(
			content_type=content_type,
			object_id=customer.id,
			session_token='cookie-session-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)

		self.client.cookies['auth_session'] = 'cookie-session-token'
		response = self.client.get('/auth/me/')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['status'], 'success')
		self.assertEqual(response.data['data']['active_role'], 'customer')
		self.assertEqual(response.data['data']['allowed_roles'], ['customer'])
		self.assertEqual(response.data['data']['user']['email'], customer.email)
