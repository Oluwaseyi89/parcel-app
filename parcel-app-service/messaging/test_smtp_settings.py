from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from authentication.models import AdminUser, UserSession
from messaging.models import SMTPSettings


class SMTPSettingsPasswordExposureTests(TestCase):
	def setUp(self):
		self.admin = AdminUser.objects.create(
			email='smtp-admin@example.com',
			first_name='Smtp',
			last_name='Admin',
			role='admin',
		)
		UserSession.objects.create(
			content_type=ContentType.objects.get_for_model(self.admin),
			object_id=self.admin.id,
			session_token='smtp-admin-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)
		self.client = APIClient()
		self.client.credentials(HTTP_X_SESSION_TOKEN='smtp-admin-token')
		self.url = reverse('v1:messaging:smtp_settings')

	def test_create_stores_password_but_does_not_return_it(self):
		response = self.client.post(self.url, {
			'name': 'primary',
			'host': 'smtp.example.com',
			'port': 587,
			'username': 'mailer@example.com',
			'password': 'smtp-secret-value',
			'default_from_email': 'no-reply@example.com',
		}, format='json')

		self.assertEqual(response.status_code, 201)
		self.assertNotIn('password', response.data['data'])
		self.assertEqual(SMTPSettings.objects.get(name='primary').password, 'smtp-secret-value')

	def test_list_does_not_return_password(self):
		SMTPSettings.objects.create(
			name='existing',
			host='smtp.example.com',
			username='mailer@example.com',
			password='smtp-secret-value',
			default_from_email='no-reply@example.com',
		)

		response = self.client.get(self.url)

		self.assertEqual(response.status_code, 200)
		self.assertTrue(response.data['data'])
		for item in response.data['data']:
			self.assertNotIn('password', item)
