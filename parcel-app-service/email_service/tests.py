from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from django.test import override_settings
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from authentication.models import AdminUser, CustomerUser, UserSession


class EmailServiceRestrictionTests(TestCase):
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

	def test_admin_can_list_email_templates(self):
		self._authenticate(self.admin, 'admin-email-token')
		response = self.client.get('/email/api/templates/')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['status'], 'success')

	def test_customer_cannot_list_email_templates(self):
		self._authenticate(self.customer, 'customer-email-token')
		response = self.client.get('/email/api/templates/')

		self.assertEqual(response.status_code, 403)

	@override_settings(DEBUG=False)
	def test_preview_is_hidden_outside_debug(self):
		response = self.client.get('/email/preview/')

		self.assertEqual(response.status_code, 404)
