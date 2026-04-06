from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile

from authentication.models import AdminUser, VendorUser
from product.models import Product
from product.services import ProductService


class ProductModerationServiceTests(TestCase):
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
			business_name='Vendor Shop',
			role='vendor',
			is_email_verified=True,
			is_approved=True,
		)
		self.vendor.set_password('StrongPassword123')
		self.vendor.save()

		self.product = Product.objects.create(
			vendor=self.vendor,
			name='Test Product',
			description='A sample product',
			price='1000.00',
			quantity=20,
			main_image=SimpleUploadedFile('product.jpg', b'img', content_type='image/jpeg'),
			sku='SKU-MOD-001',
			slug='test-product-mod-001',
			status='active',
			approval_status='pending',
		)

	def test_suspend_marks_product_suspended(self):
		product = ProductService.moderate_product(
			temp_product_id=self.product.id,
			action='suspend',
			admin_user=self.admin,
		)

		self.assertEqual(product.status, 'suspended')

	def test_reactivate_restores_approved_state(self):
		self.product.status = 'archived'
		self.product.approval_status = 'changes_requested'
		self.product.save(update_fields=['status', 'approval_status'])

		product = ProductService.moderate_product(
			temp_product_id=self.product.id,
			action='reactivate',
			admin_user=self.admin,
		)

		self.assertEqual(product.status, 'active')
		self.assertEqual(product.approval_status, 'approved')
