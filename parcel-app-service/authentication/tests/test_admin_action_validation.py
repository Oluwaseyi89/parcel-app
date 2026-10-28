from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from authentication.models import CourierUser, UserSession
from complaints.models import CustomerComplaint
from dispatch.models import Dispatch
from order.test_status_transitions import _make_fixtures


class AdminActionValidationTests(TestCase):
	"""Admin write endpoints validate input via serializers and use the standard error envelope."""

	def setUp(self):
		self.customer, self.vendor, self.product, self.order, self.admin = _make_fixtures()
		UserSession.objects.create(
			content_type=ContentType.objects.get_for_model(self.admin),
			object_id=self.admin.id,
			session_token='admin-validation-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)
		self.client = APIClient()
		self.client.credentials(HTTP_X_SESSION_TOKEN='admin-validation-token')

		self.courier = CourierUser.objects.create(
			email='validation-courier@example.com',
			first_name='Validation',
			last_name='Courier',
			phone='08700000001',
			role='courier',
		)
		self.dispatch = Dispatch.objects.create(order=self.order)
		self.complaint = CustomerComplaint.objects.create(
			customer_email=self.customer.email,
			complaint_subject='Late delivery',
			complaint_detail='Arrived two days late.',
			is_resolved=False,
			is_satisfied=False,
		)

	def assertValidationError(self, response, field):
		self.assertEqual(response.status_code, 400)
		self.assertEqual(response.data['status'], 'error')
		self.assertTrue(response.data['message'])
		self.assertIn(field, response.data['errors'])

	# moderation
	def test_moderation_rejects_unknown_action(self):
		url = reverse('v1:auth:admin_moderation_action', kwargs={'queue_type': 'vendors', 'pk': self.vendor.id})
		self.assertValidationError(self.client.patch(url, {'action': 'delete'}, format='json'), 'action')

	def test_moderation_reject_stores_reason(self):
		url = reverse('v1:auth:admin_moderation_action', kwargs={'queue_type': 'vendors', 'pk': self.vendor.id})
		response = self.client.patch(url, {'action': 'reject', 'reason': '  Missing documents  '}, format='json')

		self.assertEqual(response.status_code, 200)
		self.vendor.refresh_from_db()
		self.assertEqual(self.vendor.approval_status, 'rejected')
		self.assertEqual(self.vendor.rejection_reason, 'Missing documents')

	# order status
	def test_order_status_rejects_unknown_status(self):
		url = reverse('v1:auth:admin_order_status_update', kwargs={'pk': self.order.id})
		self.assertValidationError(self.client.patch(url, {'status': 'teleported'}, format='json'), 'status')

	def test_order_status_requires_status(self):
		url = reverse('v1:auth:admin_order_status_update', kwargs={'pk': self.order.id})
		self.assertValidationError(self.client.patch(url, {'notes': 'hi'}, format='json'), 'status')

	def test_order_status_valid_update(self):
		url = reverse('v1:auth:admin_order_status_update', kwargs={'pk': self.order.id})
		response = self.client.patch(url, {'status': 'confirmed', 'notes': 'Checked stock'}, format='json')

		self.assertEqual(response.status_code, 200)
		self.order.refresh_from_db()
		self.assertEqual(self.order.status, 'confirmed')
		self.assertIn('Checked stock', self.order.internal_notes)

	# dispatch create
	def test_dispatch_create_requires_integer_order_id(self):
		url = reverse('v1:auth:admin_dispatches')
		self.assertValidationError(self.client.post(url, {}, format='json'), 'order_id')
		self.assertValidationError(self.client.post(url, {'order_id': 'abc'}, format='json'), 'order_id')
		self.assertValidationError(self.client.post(url, {'order_id': 0}, format='json'), 'order_id')

	def test_dispatch_create_unknown_order_is_404(self):
		response = self.client.post(reverse('v1:auth:admin_dispatches'), {'order_id': 999999}, format='json')

		self.assertEqual(response.status_code, 404)
		self.assertEqual(response.data['status'], 'error')

	# dispatch status / assign
	def test_dispatch_status_rejects_unknown_status(self):
		url = reverse('v1:auth:admin_dispatch_status_update', kwargs={'pk': self.dispatch.id})
		self.assertValidationError(self.client.patch(url, {'status': 'lost'}, format='json'), 'status')

	def test_dispatch_assign_requires_courier_id(self):
		url = reverse('v1:auth:admin_dispatch_assign', kwargs={'pk': self.dispatch.id})
		self.assertValidationError(self.client.patch(url, {'notes': 'asap'}, format='json'), 'courier_id')

	def test_dispatch_assign_valid(self):
		url = reverse('v1:auth:admin_dispatch_assign', kwargs={'pk': self.dispatch.id})
		response = self.client.patch(url, {'courier_id': self.courier.id}, format='json')

		self.assertEqual(response.status_code, 200)
		self.dispatch.refresh_from_db()
		self.assertEqual(self.dispatch.courier_id, self.courier.id)

	# complaint update
	def test_complaint_update_rejects_non_boolean(self):
		url = reverse('v1:auth:admin_complaint_update', kwargs={'pk': self.complaint.id})
		self.assertValidationError(self.client.patch(url, {'is_resolved': 'maybe'}, format='json'), 'is_resolved')

	def test_complaint_update_requires_a_field(self):
		url = reverse('v1:auth:admin_complaint_update', kwargs={'pk': self.complaint.id})
		self.assertValidationError(self.client.patch(url, {'unknown': True}, format='json'), 'non_field_errors')

	def test_complaint_update_rejects_overlong_subject(self):
		url = reverse('v1:auth:admin_complaint_update', kwargs={'pk': self.complaint.id})
		self.assertValidationError(self.client.patch(url, {'complaint_subject': 'x' * 126}, format='json'), 'complaint_subject')

	def test_complaint_update_valid(self):
		url = reverse('v1:auth:admin_complaint_update', kwargs={'pk': self.complaint.id})
		response = self.client.patch(url, {'is_resolved': True, 'is_satisfied': False}, format='json')

		self.assertEqual(response.status_code, 200)
		self.complaint.refresh_from_db()
		self.assertTrue(self.complaint.is_resolved)
		self.assertFalse(self.complaint.is_satisfied)
