from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from authentication.models import CustomerUser, UserSession
from complaints.models import CustomerComplaint


class ComplaintOwnershipTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.customer = CustomerUser.objects.create(
			email='customer@example.com',
			first_name='Jane',
			last_name='Doe',
			role='customer',
			is_email_verified=True,
		)
		self.customer.set_password('StrongPassword123')
		self.customer.save()

		self.other_customer = CustomerUser.objects.create(
			email='other@example.com',
			first_name='Other',
			last_name='User',
			role='customer',
			is_email_verified=True,
		)
		self.other_customer.set_password('StrongPassword123')
		self.other_customer.save()

		CustomerComplaint.objects.create(
			customer_email=self.other_customer.email,
			complaint_subject='Late delivery',
			complaint_detail='Package was late',
			is_resolved=False,
			is_satisfied=False,
		)

		content_type = ContentType.objects.get_for_model(self.customer)
		UserSession.objects.create(
			content_type=content_type,
			object_id=self.customer.id,
			session_token='customer-token',
			expires_at=timezone.now() + timedelta(hours=1)
		)
		self.client.credentials(HTTP_X_SESSION_TOKEN='customer-token')

	def test_customer_cannot_view_other_customer_complaints(self):
		response = self.client.get(f'/api/v1/complaints/customer/{self.other_customer.email}/')

		self.assertEqual(response.status_code, 403)
		self.assertEqual(response.data['status'], 'error')

	def _submit_payload(self, **overrides):
		payload = {
			'customer_email': self.customer.email,
			'complaint_subject': 'Damaged parcel',
			'courier_involved': 'Unknown',
			'complaint_detail': 'Box arrived crushed.',
			'is_resolved': False,
			'is_satisfied': False,
			'created_at': '2026-10-28',
			'updated_at': '2026-10-28',
		}
		payload.update(overrides)
		return payload

	def test_submit_returns_201(self):
		response = self.client.post('/api/v1/complaints/submit/', self._submit_payload(), format='json')

		self.assertEqual(response.status_code, 201)
		self.assertTrue(CustomerComplaint.objects.filter(customer_email=self.customer.email).exists())

	def test_duplicate_submit_returns_409(self):
		self.client.post('/api/v1/complaints/submit/', self._submit_payload(), format='json')
		response = self.client.post('/api/v1/complaints/submit/', self._submit_payload(), format='json')

		self.assertEqual(response.status_code, 409)
		self.assertEqual(response.data['status'], 'error')

	def test_invalid_submit_returns_400_with_errors(self):
		response = self.client.post('/api/v1/complaints/submit/', self._submit_payload(complaint_subject=''), format='json')

		self.assertEqual(response.status_code, 400)
		self.assertIn('complaint_subject', response.data['errors'])

	def test_form_encoded_submit_stores_scalar_values(self):
		response = self.client.post('/api/v1/complaints/submit/', self._submit_payload(), format='multipart')

		self.assertEqual(response.status_code, 201)
		complaint = CustomerComplaint.objects.get(customer_email=self.customer.email)
		self.assertEqual(complaint.complaint_subject, 'Damaged parcel')

	def test_submit_forces_own_email_for_customers(self):
		response = self.client.post(
			'/api/v1/complaints/submit/',
			self._submit_payload(customer_email=self.other_customer.email, complaint_subject='Spoofed'),
			format='json',
		)

		self.assertEqual(response.status_code, 201)
		self.assertEqual(CustomerComplaint.objects.get(complaint_subject='Spoofed').customer_email, self.customer.email)

	def test_update_missing_complaint_returns_404(self):
		response = self.client.patch('/api/v1/complaints/update/999999/', {'is_satisfied': True}, format='json')

		self.assertEqual(response.status_code, 404)

	def test_update_other_customers_complaint_returns_403(self):
		other = CustomerComplaint.objects.get(customer_email=self.other_customer.email)
		response = self.client.patch(f'/api/v1/complaints/update/{other.id}/', {'is_satisfied': True}, format='json')

		self.assertEqual(response.status_code, 403)

	def test_customer_cannot_move_complaint_to_another_account(self):
		own = CustomerComplaint.objects.create(
			customer_email=self.customer.email,
			complaint_subject='Mine',
			complaint_detail='Detail',
			is_resolved=False,
			is_satisfied=False,
		)
		response = self.client.patch(
			f'/api/v1/complaints/update/{own.id}/',
			{'customer_email': self.other_customer.email, 'is_satisfied': True},
			format='json',
		)

		self.assertEqual(response.status_code, 200)
		own.refresh_from_db()
		self.assertEqual(own.customer_email, self.customer.email)
		self.assertTrue(own.is_satisfied)

	def test_invalid_update_returns_400(self):
		own = CustomerComplaint.objects.create(
			customer_email=self.customer.email,
			complaint_subject='Mine',
			complaint_detail='Detail',
			is_resolved=False,
			is_satisfied=False,
		)
		response = self.client.patch(f'/api/v1/complaints/update/{own.id}/', {'is_satisfied': 'perhaps'}, format='json')

		self.assertEqual(response.status_code, 400)
		self.assertIn('is_satisfied', response.data['errors'])
