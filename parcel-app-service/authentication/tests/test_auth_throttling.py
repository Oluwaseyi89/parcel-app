from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


class AuthThrottlingTests(TestCase):
	"""Login, registration and password-reset endpoints share the 'auth' throttle scope."""

	def setUp(self):
		cache.clear()
		self.client = APIClient()

	def _exhaust(self, url):
		# Default DJANGO_AUTH_THROTTLE_RATE is 10/minute.
		for _ in range(10):
			response = self.client.post(url, {}, format='json')
			self.assertNotEqual(response.status_code, 429)
		return self.client.post(url, {}, format='json')

	def test_customer_login_is_throttled(self):
		response = self._exhaust(reverse('v1:auth:customer_login'))
		self.assertEqual(response.status_code, 429)

	def test_admin_login_is_throttled(self):
		response = self._exhaust(reverse('v1:auth:admin_login'))
		self.assertEqual(response.status_code, 429)

	def test_throttle_is_shared_across_auth_endpoints(self):
		self._exhaust(reverse('v1:vendors:vendor_login'))
		response = self.client.post(reverse('v1:couriers:courier_login'), {}, format='json')
		self.assertEqual(response.status_code, 429)

	def test_basic_auth_is_not_accepted(self):
		self.client.credentials(HTTP_AUTHORIZATION='Basic dXNlckBleGFtcGxlLmNvbTpwYXNzd29yZA==')
		response = self.client.get(reverse('v1:auth:session_me'))
		self.assertIn(response.status_code, {401, 403})
