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
		response = self.client.get(f'/complaints/customer/{self.other_customer.email}/')

		self.assertEqual(response.status_code, 403)
		self.assertEqual(response.data['status'], 'error')
