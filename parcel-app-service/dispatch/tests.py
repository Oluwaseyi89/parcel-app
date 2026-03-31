from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile

from authentication.models import CustomerUser, VendorUser
from dispatch.services import DispatchService
from order.models import Order, OrderItem
from product.models import Product


class DispatchServiceSmokeTests(TestCase):
	def setUp(self):
		self.customer = CustomerUser.objects.create(
			email='dispatch-customer@example.com',
			first_name='Dispatch',
			last_name='Customer',
			role='customer',
			is_email_verified=True,
		)
		self.customer.set_password('StrongPassword123')
		self.customer.save()

		self.vendor = VendorUser.objects.create(
			email='dispatch-vendor@example.com',
			first_name='Dispatch',
			last_name='Vendor',
			phone='08000000001',
			business_name='Dispatch Vendor',
			role='vendor',
			is_approved=True,
			is_email_verified=True,
		)
		self.vendor.set_password('StrongPassword123')
		self.vendor.save()

		self.product = Product.objects.create(
			vendor=self.vendor,
			name='Dispatch Product',
			description='Dispatchable product',
			price='500.00',
			quantity=10,
			main_image=SimpleUploadedFile('dispatch.jpg', b'img', content_type='image/jpeg'),
			sku='SKU-DISPATCH-001',
			slug='dispatch-product-001',
			status='active',
		)

		self.order = Order.objects.create(
			customer=self.customer,
			status='ready',
			payment_status='paid',
			shipping_address={'street': 'Ready Street'}
		)

		OrderItem.objects.create(
			order=self.order,
			product=self.product,
			product_name=self.product.name,
			product_sku=self.product.sku,
			unit_price=self.product.price,
			quantity=1,
			vendor=self.vendor,
		)

	def test_create_dispatch_creates_dispatch_and_updates_order_status(self):
		dispatch = DispatchService.create_dispatch(self.order.id)

		self.order.refresh_from_db()
		self.assertEqual(dispatch.order_id, self.order.id)
		self.assertEqual(dispatch.items.count(), 1)
		self.assertEqual(self.order.status, 'dispatched')
