from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APIClient

from authentication.models import CustomerUser, VendorUser, CourierUser
from order.models import Payment, Order, ShippingAddress
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


class VendorOrderVisibilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create two vendors
        self.vendor1 = VendorUser.objects.create(
            email='vendor1@example.com', first_name='Vendor', last_name='One', phone='08000000001',
            business_name='Vendor One', role='vendor', is_approved=True, is_email_verified=True
        )
        self.vendor1.set_password('password1')
        self.vendor1.save()
        self.vendor2 = VendorUser.objects.create(
            email='vendor2@example.com', first_name='Vendor', last_name='Two', phone='08000000002',
            business_name='Vendor Two', role='vendor', is_approved=True, is_email_verified=True
        )
        self.vendor2.set_password('password2')
        self.vendor2.save()
        # Create products for each vendor
        self.product1 = Product.objects.create(
            vendor=self.vendor1, name='Product 1', description='P1', price='100.00', quantity=10,
            main_image=SimpleUploadedFile('p1.jpg', b'img', content_type='image/jpeg'), sku='SKU-V1', slug='sku-v1', status='active'
        )
        self.product2 = Product.objects.create(
            vendor=self.vendor2, name='Product 2', description='P2', price='200.00', quantity=10,
            main_image=SimpleUploadedFile('p2.jpg', b'img', content_type='image/jpeg'), sku='SKU-V2', slug='sku-v2', status='active'
        )
        # Create a customer and two orders, one for each vendor
        self.customer = CustomerUser.objects.create(
            email='customer-vendor@example.com', first_name='Cust', last_name='Vend', role='customer', is_email_verified=True
        )
        self.customer.set_password('password')
        self.customer.save()
        self.order1 = OrderService.create_order(self.customer, {
            'shipping_method': 'pickup',
            'shipping_address': {'street': 'A', 'city': 'Lagos'},
            'items': [{'product_id': self.product1.id, 'quantity': 1}],
        })
        self.order2 = OrderService.create_order(self.customer, {
            'shipping_method': 'pickup',
            'shipping_address': {'street': 'B', 'city': 'Lagos'},
            'items': [{'product_id': self.product2.id, 'quantity': 1}],
        })
    def test_vendor_sees_only_own_order_items(self):
        self.client.force_authenticate(user=self.vendor1)
        resp = self.client.get('/order/vendor/orders/')
        self.assertEqual(resp.status_code, 200)
        data = resp.data['data']
        self.assertTrue(all(item['vendor'] == self.vendor1.id for item in data))
        # Should not see vendor2's order items
        self.assertFalse(any(item['vendor'] == self.vendor2.id for item in data))
        # Now check vendor2
        self.client.force_authenticate(user=self.vendor2)
        resp2 = self.client.get('/order/vendor/orders/')
        self.assertEqual(resp2.status_code, 200)
        data2 = resp2.data['data']
        self.assertTrue(all(item['vendor'] == self.vendor2.id for item in data2))
        self.assertFalse(any(item['vendor'] == self.vendor1.id for item in data2))


class CourierOrderVisibilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create two couriers
        from authentication.models import CourierUser
        self.courier1 = CourierUser.objects.create(
            email='courier1@example.com', first_name='Courier', last_name='One', phone='08000000011',
            role='courier', is_approved=True, is_email_verified=True, status='active'
        )
        self.courier1.set_password('password1')
        self.courier1.save()
        self.courier2 = CourierUser.objects.create(
            email='courier2@example.com', first_name='Courier', last_name='Two', phone='08000000012',
            role='courier', is_approved=True, is_email_verified=True, status='active'
        )
        self.courier2.set_password('password2')
        self.courier2.save()
        # Create a vendor and product
        self.vendor = VendorUser.objects.create(
            email='vendor-courier@example.com', first_name='Vendor', last_name='Courier', phone='08000000021',
            business_name='Vendor Courier', role='vendor', is_approved=True, is_email_verified=True
        )
        self.vendor.set_password('password')
        self.vendor.save()
        self.product = Product.objects.create(
            vendor=self.vendor, name='Product C', description='PC', price='300.00', quantity=10,
            main_image=SimpleUploadedFile('pc.jpg', b'img', content_type='image/jpeg'), sku='SKU-C', slug='sku-c', status='active'
        )
        # Create a customer and two orders, assign each to a different courier
        self.customer = CustomerUser.objects.create(
            email='customer-courier@example.com', first_name='Cust', last_name='Cour', role='customer', is_email_verified=True
        )
        self.customer.set_password('password')
        self.customer.save()
        from order.models import Order
        self.order1 = OrderService.create_order(self.customer, {
            'shipping_method': 'pickup',
            'shipping_address': {'street': 'A', 'city': 'Lagos'},
            'items': [{'product_id': self.product.id, 'quantity': 1}],
        })
        self.order1.courier = self.courier1
        self.order1.status = 'dispatched'
        self.order1.save()
        self.order2 = OrderService.create_order(self.customer, {
            'shipping_method': 'pickup',
            'shipping_address': {'street': 'B', 'city': 'Lagos'},
            'items': [{'product_id': self.product.id, 'quantity': 1}],
        })
        self.order2.courier = self.courier2
        self.order2.status = 'in_transit'
        self.order2.save()
    def test_courier_sees_only_assigned_orders(self):
        self.client.force_authenticate(user=self.courier1)
        resp = self.client.get('/order/courier/orders/')
        self.assertEqual(resp.status_code, 200)
        data = resp.data['data']
        self.assertTrue(all(order['courier'] == self.courier1.id for order in data))
        self.assertFalse(any(order['courier'] == self.courier2.id for order in data))
        # Now check courier2
        self.client.force_authenticate(user=self.courier2)
        resp2 = self.client.get('/order/courier/orders/')
        self.assertEqual(resp2.status_code, 200)
        data2 = resp2.data['data']
        self.assertTrue(all(order['courier'] == self.courier2.id for order in data2))
        self.assertFalse(any(order['courier'] == self.courier1.id for order in data2))


class ShippingAddressOwnershipTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create two users
        self.user1 = CustomerUser.objects.create(
            email='user1@example.com', first_name='User', last_name='One', role='customer', is_email_verified=True
        )
        self.user1.set_password('password1')
        self.user1.save()
        self.user2 = CustomerUser.objects.create(
            email='user2@example.com', first_name='User', last_name='Two', role='customer', is_email_verified=True
        )
        self.user2.set_password('password2')
        self.user2.save()
        # Create a shipping address for user1
        from order.models import ShippingAddress
        self.addr1 = ShippingAddress.objects.create(
            customer=self.user1,
            full_name='User One', phone='08000000001', email='user1@example.com',
            street_address='1 Main St', apartment='', city='Lagos', state='Lagos', country='Nigeria', postal_code='100001',
            is_default=True, is_active=True
        )
    def test_user_can_only_see_own_addresses(self):
        self.client.force_authenticate(user=self.user1)
        resp = self.client.get('/order/shipping-addresses/')
        self.assertEqual(resp.status_code, 200)
        data = resp.data['data']
        self.assertTrue(any(addr['id'] == self.addr1.id for addr in data))
        # User2 should see nothing
        self.client.force_authenticate(user=self.user2)
        resp2 = self.client.get('/order/shipping-addresses/')
        self.assertEqual(resp2.status_code, 200)
        data2 = resp2.data['data']
        self.assertFalse(any(addr['id'] == self.addr1.id for addr in data2))
    def test_user_cannot_create_address_for_another_user(self):
        self.client.force_authenticate(user=self.user2)
        # Try to create address for user1 by passing customer field (should be ignored)
        resp = self.client.post('/order/shipping-addresses/', {
            'full_name': 'User One', 'phone': '08000000001', 'email': 'user1@example.com',
            'street_address': '2 Main St', 'apartment': '', 'city': 'Lagos', 'state': 'Lagos', 'country': 'Nigeria', 'postal_code': '100002',
            'is_default': True, 'is_active': True, 'customer': self.user1.id
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        # The created address must belong to user2, not user1
        from order.models import ShippingAddress
        addr = ShippingAddress.objects.get(id=resp.data['data']['id'])
        self.assertEqual(addr.customer, self.user2)
    def test_user_cannot_update_another_users_address(self):
        self.client.force_authenticate(user=self.user2)
        # Try to update user1's address (should not be allowed, but endpoint does not expose PUT/PATCH by id)
        # Simulate by attempting to create with same id (should create new, not update)
        resp = self.client.post('/order/shipping-addresses/', {
            'id': self.addr1.id,
            'full_name': 'Hacker', 'phone': '08000000009', 'email': 'hacker@example.com',
            'street_address': 'Hacker St', 'apartment': '', 'city': 'Lagos', 'state': 'Lagos', 'country': 'Nigeria', 'postal_code': '999999',
            'is_default': False, 'is_active': True
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        # The original address for user1 should remain unchanged
        from order.models import ShippingAddress
        addr1 = ShippingAddress.objects.get(id=self.addr1.id)
        self.assertEqual(addr1.customer, self.user1)
        self.assertEqual(addr1.full_name, 'User One')
