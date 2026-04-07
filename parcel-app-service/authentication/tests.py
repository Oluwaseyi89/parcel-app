from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from authentication.drf_auth import SessionTokenAuthentication
from authentication.models import AdminUser, CourierUser, CustomerUser, UserSession, VendorUser


class SessionTokenAuthenticationTests(TestCase):
	def test_authenticates_admin_with_session_token_header(self):
		admin = AdminUser.objects.create(
			email='admin@example.com',
			first_name='System',
			last_name='Admin',
			role='admin'
		)
		admin.set_password('StrongPassword123')
		admin.save()

		content_type = ContentType.objects.get_for_model(admin)
		session = UserSession.objects.create(
			content_type=content_type,
			object_id=admin.id,
			session_token='session-token-123',
			expires_at=timezone.now() + timedelta(hours=1)
		)

		class RequestStub:
			def __init__(self):
				self.headers = {'X-Session-Token': session.session_token}
				self.COOKIES = {}
				self.META = {}

		request = RequestStub()
		auth = SessionTokenAuthentication()
		user, auth_session = auth.authenticate(request)

		self.assertEqual(user.id, admin.id)
		self.assertEqual(auth_session.id, session.id)


class AdminCustomerEndpointTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.admin = AdminUser.objects.create(
			email='admin@example.com',
			first_name='Admin',
			last_name='User',
			role='admin',
			is_email_verified=True,
		)
		self.admin.set_password('StrongPassword123')
		self.admin.save()

		self.customer = CustomerUser.objects.create(
			email='customer@example.com',
			first_name='Jane',
			last_name='Doe',
			role='customer',
			is_email_verified=True,
		)
		self.customer.set_password('StrongPassword123')
		self.customer.save()

	def _authenticate(self, user, token):
		content_type = ContentType.objects.get_for_model(user)
		UserSession.objects.create(
			content_type=content_type,
			object_id=user.id,
			session_token=token,
			expires_at=timezone.now() + timedelta(hours=1)
		)
		self.client.credentials(HTTP_X_SESSION_TOKEN=token)

	def test_admin_can_list_customers(self):
		self._authenticate(self.admin, 'admin-token')
		response = self.client.get('/auth/api/customers/')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['status'], 'success')
		self.assertEqual(len(response.data['data']), 1)

	def test_customer_cannot_list_customers(self):
		self._authenticate(self.customer, 'customer-token')
		response = self.client.get('/auth/api/customers/')

		self.assertEqual(response.status_code, 403)


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


class CsrfEnforcementTests(TestCase):
	def setUp(self):
		self.client = APIClient(enforce_csrf_checks=True)
		self.admin = AdminUser.objects.create(
			email='csrf-admin@example.com',
			first_name='Csrf',
			last_name='Admin',
			role='admin',
			is_email_verified=True,
		)
		self.admin.set_password('StrongPassword123')
		self.admin.save()

		self.customer = CustomerUser.objects.create(
			email='csrf-customer@example.com',
			first_name='Csrf',
			last_name='Customer',
			role='customer',
			is_email_verified=True,
		)
		self.customer.set_password('StrongPassword123')
		self.customer.save()

		content_type = ContentType.objects.get_for_model(self.admin)
		UserSession.objects.create(
			content_type=content_type,
			object_id=self.admin.id,
			session_token='csrf-session-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)

		self.client.cookies['auth_session'] = 'csrf-session-token'

	def _issue_csrf_token(self):
		response = self.client.get('/auth/csrf/')
		self.assertEqual(response.status_code, 200)
		return response.data['data']['csrf_token']

	def test_patch_requires_csrf_with_cookie_auth(self):
		without_csrf = self.client.patch('/auth/api/profile/', {'first_name': 'NoCsrf'}, format='json')
		self.assertEqual(without_csrf.status_code, 403)

		csrf_token = self._issue_csrf_token()
		with_csrf = self.client.patch(
			'/auth/api/profile/',
			{'first_name': 'WithCsrf'},
			format='json',
			HTTP_X_CSRFTOKEN=csrf_token,
		)
		self.assertEqual(with_csrf.status_code, 200)

	def test_post_requires_csrf_with_cookie_auth(self):
		without_csrf = self.client.post('/auth/api/logout/', {}, format='json')
		self.assertEqual(without_csrf.status_code, 403)

		csrf_token = self._issue_csrf_token()
		with_csrf = self.client.post('/auth/api/logout/', {}, format='json', HTTP_X_CSRFTOKEN=csrf_token)
		self.assertEqual(with_csrf.status_code, 200)

	def test_delete_requires_csrf_with_cookie_auth(self):
		without_csrf = self.client.delete(f'/auth/api/customers/{self.customer.id}/')
		self.assertEqual(without_csrf.status_code, 403)

		csrf_token = self._issue_csrf_token()
		with_csrf = self.client.delete(
			f'/auth/api/customers/{self.customer.id}/',
			HTTP_X_CSRFTOKEN=csrf_token,
		)
		self.assertEqual(with_csrf.status_code, 200)
