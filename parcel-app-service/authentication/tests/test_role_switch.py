from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from authentication.models import CourierUser, UserSession, VendorUser


class ActiveRoleSwitchTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.shared_email = 'multi-role@example.com'

		self.vendor = VendorUser.objects.create(
			email=self.shared_email,
			first_name='Multi',
			last_name='Vendor',
			phone='08000000991',
			role='vendor',
			is_active=True,
			is_email_verified=True,
			is_approved=True,
		)
		self.vendor.set_password('StrongPassword123')
		self.vendor.save()

		self.courier = CourierUser.objects.create(
			email=self.shared_email,
			first_name='Multi',
			last_name='Courier',
			phone='08000000992',
			role='courier',
			is_active=True,
			is_email_verified=True,
			is_approved=True,
		)
		self.courier.set_password('StrongPassword123')
		self.courier.save()

		content_type = ContentType.objects.get_for_model(self.vendor)
		self.session = UserSession.objects.create(
			content_type=content_type,
			object_id=self.vendor.id,
			session_token='multi-role-session-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)

		self.client.credentials(HTTP_X_SESSION_TOKEN='multi-role-session-token')

	def test_me_returns_all_available_roles_for_same_email(self):
		response = self.client.get('/auth/me/')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['data']['active_role'], 'vendor')
		self.assertIn('vendor', response.data['data']['allowed_roles'])
		self.assertIn('courier', response.data['data']['allowed_roles'])

	def test_switch_role_updates_active_session_user(self):
		response = self.client.post('/auth/switch-role/', {'role': 'courier'}, format='json')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['data']['active_role'], 'courier')
		self.assertIn('courier', response.data['data']['allowed_roles'])
		self.assertIn('vendor', response.data['data']['allowed_roles'])
		self.assertIn('logcour', response.cookies)

		self.session.refresh_from_db()
		self.assertEqual(self.session.object_id, self.courier.id)

		me_response = self.client.get('/auth/me/')
		self.assertEqual(me_response.status_code, 200)
		self.assertEqual(me_response.data['data']['active_role'], 'courier')

	def test_switch_role_rejects_unavailable_role(self):
		response = self.client.post('/auth/switch-role/', {'role': 'customer'}, format='json')

		self.assertEqual(response.status_code, 403)
