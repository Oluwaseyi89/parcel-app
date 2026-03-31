from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile

from authentication.models import CustomerUser, VendorUser
from order.services import OrderService
from product.models import Product


class OrderServiceSmokeTests(TestCase):
	def setUp(self):
		self.customer = CustomerUser.objects.create(
			email='customer@example.com',
			first_name='Jane',
			last_name='Doe',
			role='customer',
			is_email_verified=True,
		)
		self.customer.set_password('StrongPassword123')
		self.customer.save()

		self.vendor = VendorUser.objects.create(
			email='vendor@example.com',
			first_name='Vendor',
			last_name='Owner',
			phone='08000000000',
			business_name='Vendor Shop',
			role='vendor',
			is_approved=True,
			is_email_verified=True,
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
			sku='SKU-ORDER-001',
			slug='test-product-order-001',
			status='active',
		)

	def test_create_order_creates_items_and_totals(self):
		order = OrderService.create_order(
			self.customer,
			{
				'shipping_method': 'pickup',
				'shipping_address': {'street': 'Main Street', 'city': 'Lagos'},
				'items': [
					{
						'product_id': self.product.id,
						'quantity': 2,
					}
				],
			},
		)

		self.assertEqual(order.customer_id, self.customer.id)
		self.assertEqual(order.items.count(), 1)
		self.assertGreater(order.total_amount, 0)
