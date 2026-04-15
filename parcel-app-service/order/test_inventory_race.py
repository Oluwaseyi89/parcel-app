import threading
from django.test import TestCase
from django.core.exceptions import ValidationError
from authentication.models import CustomerUser, VendorUser
from product.models import Product
from order.services import OrderService

class InventoryRaceConditionTests(TestCase):
    def setUp(self):
        self.customer1 = CustomerUser.objects.create(
            email='race1@example.com', first_name='A', last_name='B', role='customer', is_email_verified=True)
        self.customer2 = CustomerUser.objects.create(
            email='race2@example.com', first_name='C', last_name='D', role='customer', is_email_verified=True)
        self.vendor = VendorUser.objects.create(
            email='racevendor@example.com', first_name='V', last_name='E', phone='08000000002',
            business_name='Race Vendor', role='vendor', is_approved=True, is_email_verified=True)
        self.product = Product.objects.create(
            vendor=self.vendor, name='Race Widget', description='Race test', price='100.00', quantity=2,
            sku='SKU-RACE-001', slug='race-widget-001', status='active')

    def _order_payload(self, qty):
        return {
            'shipping_method': 'pickup',
            'shipping_address': {'street': 'Main', 'city': 'Lagos'},
            'items': [{
                'product_id': self.product.id,
                'quantity': qty,
            }],
        }

    def test_sequential_oversell_attempts(self):
        """First order for all stock should succeed, second should fail with 'Insufficient stock'."""
        # First customer buys all stock
        OrderService.create_order(self.customer1, self._order_payload(2))
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, 0)
        # Second customer tries to buy same amount
        with self.assertRaises(ValidationError) as ctx:
            OrderService.create_order(self.customer2, self._order_payload(2))
        self.assertIn('Insufficient stock', str(ctx.exception))

    def test_cancelled_order_restores_stock(self):
        order = OrderService.create_order(self.customer1, self._order_payload(2))
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, 0)
        OrderService.update_order_status(order.id, 'cancelled', self.customer1)
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, 2)

    def test_refunded_order_restores_stock(self):
        order = OrderService.create_order(self.customer1, self._order_payload(2))
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, 0)
        OrderService.update_order_status(order.id, 'confirmed', self.customer1)
        OrderService.update_order_status(order.id, 'processing', self.customer1)
        OrderService.update_order_status(order.id, 'ready', self.customer1)
        OrderService.update_order_status(order.id, 'dispatched', self.customer1)
        OrderService.update_order_status(order.id, 'in_transit', self.customer1)
        OrderService.update_order_status(order.id, 'delivered', self.customer1)
        OrderService.update_order_status(order.id, 'refunded', self.customer1)
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, 2)
