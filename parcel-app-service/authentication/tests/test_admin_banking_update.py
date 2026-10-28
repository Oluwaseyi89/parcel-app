from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from authentication.models import AdminUser, UserSession
from banking.models import CourierBankDetail, VendorBankDetail


class AdminBankingUpdateTests(TestCase):
	def setUp(self):
		admin = AdminUser.objects.create(
			email='banking-admin@example.com',
			first_name='Banking',
			last_name='Admin',
			role='admin',
		)
		UserSession.objects.create(
			content_type=ContentType.objects.get_for_model(admin),
			object_id=admin.id,
			session_token='banking-admin-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)
		self.client = APIClient()
		self.client.credentials(HTTP_X_SESSION_TOKEN='banking-admin-token')

		self.vendor_bank = VendorBankDetail.objects.create(
			bank_name='Old Bank',
			account_type='Savings',
			account_name='Vendor Account',
			vendor_email='bank-vendor@example.com',
			account_no='0123456789',
			added_at='2026-01-01',
			updated_at='2026-01-01',
		)
		self.courier_bank = CourierBankDetail.objects.create(
			bank_name='Old Bank',
			account_type='Current',
			account_name='Courier Account',
			courier_email='bank-courier@example.com',
			account_no='9876543210',
			added_at='2026-01-01',
			updated_at='2026-01-01',
		)

	def _url(self, kind, pk):
		return reverse('v1:auth:admin_banking_update', kwargs={'account_kind': kind, 'pk': pk})

	def test_valid_update_saves_fields_and_sets_updated_at_server_side(self):
		response = self.client.patch(self._url('vendor', self.vendor_bank.id), {
			'bank_name': 'New Bank',
			'account_type': 'Current',
			'updated_at': 'client-supplied-value',
		}, format='json')

		self.assertEqual(response.status_code, 200)
		self.vendor_bank.refresh_from_db()
		self.assertEqual(self.vendor_bank.bank_name, 'New Bank')
		self.assertEqual(self.vendor_bank.account_type, 'Current')
		self.assertNotEqual(self.vendor_bank.updated_at, 'client-supplied-value')
		self.assertNotEqual(self.vendor_bank.updated_at, '2026-01-01')

	def test_null_value_is_rejected_instead_of_stored_as_string(self):
		response = self.client.patch(self._url('vendor', self.vendor_bank.id), {
			'bank_name': None,
		}, format='json')

		self.assertEqual(response.status_code, 400)
		self.vendor_bank.refresh_from_db()
		self.assertEqual(self.vendor_bank.bank_name, 'Old Bank')

	def test_invalid_account_type_is_rejected(self):
		response = self.client.patch(self._url('courier', self.courier_bank.id), {
			'account_type': 'Offshore',
		}, format='json')

		self.assertEqual(response.status_code, 400)
		self.assertIn('account_type', response.data['errors'])

	def test_invalid_email_and_overlong_account_no_are_rejected(self):
		response = self.client.patch(self._url('courier', self.courier_bank.id), {
			'courier_email': 'not-an-email',
			'account_no': '1' * 16,
		}, format='json')

		self.assertEqual(response.status_code, 400)
		self.assertIn('courier_email', response.data['errors'])
		self.assertIn('account_no', response.data['errors'])

	def test_request_with_only_unknown_or_read_only_fields_is_rejected(self):
		response = self.client.patch(self._url('vendor', self.vendor_bank.id), {
			'updated_at': '2030-01-01',
			'added_at': '2030-01-01',
		}, format='json')

		self.assertEqual(response.status_code, 400)
		self.vendor_bank.refresh_from_db()
		self.assertEqual(self.vendor_bank.updated_at, '2026-01-01')
