from django.test import TestCase
from authentication.models import AdminUser, CourierUser
from courier.services import CourierService


class CourierModerationServiceTests(TestCase):
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

		self.courier = CourierUser.objects.create(
			email='courier@example.com',
			first_name='Courier',
			last_name='Rider',
			phone='08000000002',
			role='courier',
			is_email_verified=True,
			status='inactive',
		)

	def test_request_changes_sets_pending_revision_state(self):
		courier = CourierService.moderate_courier(
			temp_courier_id=self.courier.id,
			action='request_changes',
			admin_user=self.admin,
			comments='Upload clearer license image',
		)

		self.assertEqual(courier.approval_status, 'changes_requested')
		self.assertEqual(courier.rejection_reason, 'Upload clearer license image')
		self.assertEqual(courier.status, 'inactive')

	def test_suspend_updates_status_without_losing_record(self):
		self.courier.is_approved = True
		self.courier.approval_status = 'approved'
		self.courier.status = 'active'
		self.courier.save(update_fields=['is_approved', 'approval_status', 'status'])

		courier = CourierService.moderate_courier(
			temp_courier_id=self.courier.id,
			action='suspend',
			admin_user=self.admin,
		)

		self.assertEqual(courier.status, 'suspended')
		self.assertEqual(courier.approval_status, 'approved')
