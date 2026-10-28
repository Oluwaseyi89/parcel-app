from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from authentication.models import UserSession, VendorUser
from order.models import Order
from order.test_status_transitions import _make_fixtures


class OrderStatusUpdateOwnershipTests(TestCase):
	def setUp(self):
		self.customer, self.vendor, self.product, self.order, self.admin = _make_fixtures()

		self.other_vendor = VendorUser.objects.create(
			email='other-vendor@example.com',
			first_name='Other',
			last_name='Vendor',
			phone='08300000099',
			business_name='Other Shop',
			role='vendor',
			is_approved=True,
			is_email_verified=True,
		)
		self.url = reverse('v1:order:order_status_update', kwargs={'order_id': self.order.id})

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

	def test_vendor_cannot_update_order_without_their_products(self):
		client = self._client_for(self.other_vendor, 'other-vendor-token')
		response = client.post(self.url, {'status': 'confirmed'}, format='json')

		self.assertEqual(response.status_code, 403)
		self.order.refresh_from_db()
		self.assertEqual(self.order.status, 'pending')

	def test_vendor_can_update_order_containing_their_products(self):
		client = self._client_for(self.vendor, 'owner-vendor-token')
		response = client.post(self.url, {'status': 'confirmed'}, format='json')

		self.assertNotEqual(response.status_code, 403)

	def test_admin_can_update_any_order(self):
		client = self._client_for(self.admin, 'admin-token')
		response = client.post(self.url, {'status': 'confirmed'}, format='json')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(Order.objects.get(id=self.order.id).status, 'confirmed')
