from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from authentication.models import VendorUser, UserSession
from banking.models import VendorBankDetail


class BankingOwnershipTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.vendor = VendorUser.objects.create(
			email='vendor@example.com',
			first_name='Vendor',
			last_name='Owner',
			phone='08000000000',
			role='vendor',
			is_email_verified=True,
			is_approved=True,
		)
		self.vendor.set_password('StrongPassword123')
		self.vendor.save()

		self.other_vendor = VendorUser.objects.create(
			email='other-vendor@example.com',
			first_name='Other',
			last_name='Vendor',
			phone='08000000001',
			role='vendor',
			is_email_verified=True,
			is_approved=True,
		)
		self.other_vendor.set_password('StrongPassword123')
		self.other_vendor.save()

		VendorBankDetail.objects.create(
			bank_name='Test Bank',
			account_type='Savings',
			account_name='Other Vendor',
			vendor_email=self.other_vendor.email,
			account_no='1234567890',
			added_at='2026-01-01',
			updated_at='2026-01-01',
		)

		content_type = ContentType.objects.get_for_model(self.vendor)
		UserSession.objects.create(
			content_type=content_type,
			object_id=self.vendor.id,
			session_token='vendor-token',
			expires_at=timezone.now() + timedelta(hours=1)
		)
		self.client.credentials(HTTP_X_SESSION_TOKEN='vendor-token')

	def test_vendor_cannot_view_other_vendor_bank_record(self):
		response = self.client.get(f'/banking/vendor/get/{self.other_vendor.email}/')

		self.assertEqual(response.status_code, 403)
		self.assertEqual(response.data['status'], 'error')
