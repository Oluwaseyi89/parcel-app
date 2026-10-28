from unittest.mock import patch

from django.db import OperationalError
from django.test import TestCase, override_settings
from django.urls import reverse


class HealthCheckTests(TestCase):
	def test_healthz_returns_ok_without_authentication(self):
		response = self.client.get(reverse('healthz'))

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json(), {'status': 'ok'})
		self.assertIn('no-cache', response['Cache-Control'])

	def test_healthz_supports_head_and_rejects_post(self):
		self.assertEqual(self.client.head(reverse('healthz')).status_code, 200)
		self.assertEqual(self.client.post(reverse('healthz')).status_code, 405)

	def test_readyz_reports_database_ok(self):
		response = self.client.get(reverse('readyz'))

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json(), {'status': 'ok', 'checks': {'database': 'ok'}})

	def test_readyz_returns_503_without_leaking_error_details(self):
		with patch('core.views.connection.cursor', side_effect=OperationalError('password authentication failed for user x')):
			with self.assertLogs('core.views', level='ERROR'):
				response = self.client.get(reverse('readyz'))

		self.assertEqual(response.status_code, 503)
		self.assertEqual(response.json(), {'status': 'unavailable', 'checks': {'database': 'error'}})
		self.assertNotIn(b'password', response.content)

	@override_settings(READINESS_CHECK_REDIS=True)
	def test_readyz_includes_redis_when_enabled(self):
		with patch('redis.Redis.from_url') as from_url:
			from_url.return_value.ping.return_value = True
			response = self.client.get(reverse('readyz'))

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()['checks'], {'database': 'ok', 'redis': 'ok'})

	@override_settings(READINESS_CHECK_REDIS=True)
	def test_readyz_returns_503_when_redis_unreachable(self):
		with patch('redis.Redis.from_url', side_effect=ConnectionError('refused')):
			with self.assertLogs('core.views', level='ERROR'):
				response = self.client.get(reverse('readyz'))

		self.assertEqual(response.status_code, 503)
		self.assertEqual(response.json()['checks']['redis'], 'error')

	def test_probes_live_outside_versioned_api(self):
		self.assertEqual(reverse('healthz'), '/healthz')
		self.assertEqual(reverse('readyz'), '/readyz')
