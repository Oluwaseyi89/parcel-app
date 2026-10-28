from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from authentication.models import CourierUser, UserSession
from order.test_status_transitions import _make_fixtures


def _make_courier(email, phone):
	return CourierUser.objects.create(
		email=email,
		first_name='Detail',
		last_name='Courier',
		phone=phone,
		role='courier',
		is_email_verified=True,
		is_approved=True,
		approval_status='approved',
		status='active',
	)


class OrderDetailCourierAccessTests(TestCase):
	def setUp(self):
		self.customer, self.vendor, self.product, self.order, self.admin = _make_fixtures()
		self.assigned_courier = _make_courier('assigned-courier@example.com', '08500000001')
		self.other_courier = _make_courier('other-courier@example.com', '08500000002')
		self.order.courier = self.assigned_courier
		self.order.save(update_fields=['courier'])
		self.url = reverse('v1:order:order_detail', kwargs={'order_id': self.order.id})

	def _client_for(self, user, token):
		UserSession.objects.create(
			content_type=ContentType.objects.get_for_model(user),
			object_id=user.id,
			session_token=token,
			expires_at=timezone.now() + timedelta(hours=1),
		)
		client = APIClient()
		client.credentials(HTTP_X_SESSION_TOKEN=token)
		return client

	def test_unassigned_courier_cannot_view_order(self):
		response = self._client_for(self.other_courier, 'other-courier-token').get(self.url)

		self.assertEqual(response.status_code, 403)

	def test_courier_cannot_view_order_with_no_courier_assigned(self):
		self.order.courier = None
		self.order.save(update_fields=['courier'])

		response = self._client_for(self.other_courier, 'other-courier-token').get(self.url)

		self.assertEqual(response.status_code, 403)

	def test_assigned_courier_can_view_order(self):
		response = self._client_for(self.assigned_courier, 'assigned-courier-token').get(self.url)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['data']['id'], self.order.id)

	def test_admin_can_view_any_order(self):
		response = self._client_for(self.admin, 'detail-admin-token').get(self.url)

		self.assertEqual(response.status_code, 200)
