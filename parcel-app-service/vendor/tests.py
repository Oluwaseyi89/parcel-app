from django.test import TestCase
from authentication.models import AdminUser, VendorUser
from vendor.services import VendorService


class VendorModerationServiceTests(TestCase):
	def setUp(self):
		self.admin = AdminUser.objects.create(
			email='admin@example.com',
			first_name='Admin',
			last_name='User',
			role='admin',
			is_email_verified=True,
		)
		self.admin.set_password('StrongPassword123')
		self.admin.save()

		self.vendor = VendorUser.objects.create(
			email='vendor@example.com',
			first_name='Vendor',
			last_name='Owner',
			phone='08000000000',
			role='vendor',
			is_email_verified=True,
			status='inactive',
		)

	def test_reject_sets_status_and_reason(self):
		vendor = VendorService.moderate_vendor(
			temp_vendor_id=self.vendor.id,
			action='reject',
			admin_user=self.admin,
			comments='Missing documents',
		)

		self.assertEqual(vendor.approval_status, 'rejected')
		self.assertEqual(vendor.rejection_reason, 'Missing documents')
		self.assertEqual(vendor.status, 'inactive')

	def test_reactivate_restores_active_approved_state(self):
		self.vendor.approval_status = 'rejected'
		self.vendor.status = 'suspended'
		self.vendor.save(update_fields=['approval_status', 'status'])

		vendor = VendorService.moderate_vendor(
			temp_vendor_id=self.vendor.id,
			action='reactivate',
			admin_user=self.admin,
		)

		self.assertEqual(vendor.approval_status, 'approved')
		self.assertTrue(vendor.is_approved)
		self.assertEqual(vendor.status, 'active')
