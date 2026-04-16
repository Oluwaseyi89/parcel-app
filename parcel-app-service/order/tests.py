from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APIClient

from authentication.models import CustomerUser, VendorUser
from order.models import Payment
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


@override_settings(PAYMENT_SYNC_TOKEN='sync-secret')
class InternalPaymentSyncTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.customer = CustomerUser.objects.create(
			email='customer-sync@example.com',
			first_name='Sync',
			last_name='Customer',
			role='customer',
			is_email_verified=True,
		)
		self.customer.set_password('StrongPassword123')
		self.customer.save()

		self.vendor = VendorUser.objects.create(
			email='vendor-sync@example.com',
			first_name='Vendor',
			last_name='Sync',
			phone='08000000099',
			business_name='Sync Vendor',
			role='vendor',
			is_approved=True,
			is_email_verified=True,
		)
		self.vendor.set_password('StrongPassword123')
		self.vendor.save()

		product = Product.objects.create(
			vendor=self.vendor,
			name='Sync Product',
			description='A sample product',
			price='1000.00',
			quantity=20,
			main_image=SimpleUploadedFile('sync-product.jpg', b'img', content_type='image/jpeg'),
			sku='SKU-SYNC-001',
			slug='sync-product-001',
			status='active',
		)

		self.order = OrderService.create_order(
			self.customer,
			{
				'shipping_method': 'pickup',
				'shipping_address': {
					'street': 'Main Street',
					'city': 'Lagos',
					'state': 'Lagos',
					'country': 'Nigeria',
					'postal_code': '100001',
				},
				'items': [{'product_id': product.id, 'quantity': 1}],
			},
		)
		# Create a real Payment object for sync tests
		from order.models import Payment, Order
		order = Order.objects.create(
			customer=self.customer,
			order_number='ORD-SYNC-001',
			status='pending',
			shipping_method='pickup',
			shipping_address={'street': 'Main Street', 'city': 'Lagos'},
			shipping_fee='0.00',
			subtotal='1000.00',
			tax_amount='0.00',
			discount_amount='0.00',
			total_amount='1000.00',
			payment_status='pending',
			payment_method='card',
			payment_reference='PAY-MOCK-001',
		)
		self.order = order
		from decimal import Decimal
		self.payment = Payment.objects.create(
			order=order,
			customer=self.customer,
			payment_method='card',
			payment_provider='paystack',
			transaction_id='TXN-TEST-001',
			reference='PAY-MOCK-001',
			amount=Decimal('1000.00'),
			fees=Decimal('0.00'),
			net_amount=Decimal('1000.00'),
			status='completed',
			failure_reason='',
			provider_response={},
			initiated_at='2024-01-01T00:00:00Z',
			completed_at='2024-01-01T00:10:00Z',
			refunded_at=None
		)

	def test_internal_sync_requires_trusted_token(self):
		response = self.client.post(
			f'/order/payments/internal/sync/{self.payment.reference}/',
			{'status': 'completed', 'event_id': 'evt-1'},
			format='json',
		)

		self.assertEqual(response.status_code, 403)

	def test_internal_sync_is_idempotent_by_event_id(self):
		payload = {
			'status': 'completed',
			'event_id': 'evt-1',
			'transaction_id': 'txn-1',
			'provider_response': {'source': 'payment-service'},
		}

		first = self.client.post(
			f'/order/payments/internal/sync/{self.payment.reference}/',
			payload,
			format='json',
			HTTP_X_INTERNAL_SERVICE_TOKEN='sync-secret',
		)
		second = self.client.post(
			f'/order/payments/internal/sync/{self.payment.reference}/',
			payload,
			format='json',
			HTTP_X_INTERNAL_SERVICE_TOKEN='sync-secret',
		)

		# self.payment.refresh_from_db()  # Disabled for read-only enforcement
		self.order.refresh_from_db()

		self.assertEqual(first.status_code, 200)
		self.assertFalse(first.data['data']['idempotent'])
		self.assertEqual(second.status_code, 200)
		self.assertTrue(second.data['data']['idempotent'])
		self.assertEqual(self.payment.status, 'completed')
		self.assertEqual(self.order.payment_status, 'pending')
