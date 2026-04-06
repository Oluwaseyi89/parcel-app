from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from authentication.drf_auth import SessionTokenAuthentication
from authentication.models import AdminUser, CustomerUser, UserSession


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
