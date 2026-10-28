from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from authentication.models import CustomerUser, UserSession


class CalculateDistanceAPITests(TestCase):
	def setUp(self):
		customer = CustomerUser.objects.create(
			email='distance@example.com',
			first_name='Distance',
			last_name='Customer',
			role='customer',
		)
		UserSession.objects.create(
			content_type=ContentType.objects.get_for_model(customer),
			object_id=customer.id,
			session_token='distance-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)
		self.client = APIClient()
		self.client.credentials(HTTP_X_SESSION_TOKEN='distance-token')
		self.url = reverse('v1:geolocation:api_calculate_distance')

	def test_returns_distance_between_lagos_and_abuja(self):
		response = self.client.post(self.url, {
			'origin_lat': 6.5244, 'origin_lng': 3.3792,
			'destination_lat': 9.0765, 'destination_lng': 7.3986,
		}, format='json')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['status'], 'success')
		# Lagos to Abuja is roughly 525 km as the crow flies.
		self.assertAlmostEqual(response.data['data']['distance_km'], 525, delta=15)

	def test_same_point_is_zero(self):
		response = self.client.post(self.url, {
			'origin_lat': 6.5, 'origin_lng': 3.3, 'destination_lat': 6.5, 'destination_lng': 3.3,
		}, format='json')

		self.assertEqual(response.data['data']['distance_km'], 0)

	def test_out_of_range_and_missing_coordinates_are_rejected(self):
		response = self.client.post(self.url, {
			'origin_lat': 91, 'origin_lng': 3.3, 'destination_lat': 6.5,
		}, format='json')

		self.assertEqual(response.status_code, 400)
		self.assertEqual(response.data['status'], 'error')
		self.assertIn('origin_lat', response.data['errors'])
		self.assertIn('destination_lng', response.data['errors'])

	def test_requires_authentication(self):
		response = APIClient().post(self.url, {}, format='json')

		self.assertIn(response.status_code, {401, 403})
