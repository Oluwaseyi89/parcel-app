from django.test import TestCase
from django.core.exceptions import ValidationError
from authentication.models import CustomerUser, VendorUser
from product.models import Product
from order.services import OrderService

class OrderCreationValidationTests(TestCase):
    def setUp(self):
        self.customer = CustomerUser.objects.create(
            email='customer2@example.com',
            first_name='Jane',
            last_name='Doe',
            role='customer',
            is_email_verified=True,
        )
        self.vendor = VendorUser.objects.create(
            email='vendor2@example.com',
            first_name='Vendor',
            last_name='Owner',
            phone='08000000001',
            business_name='Vendor Shop 2',
            role='vendor',
            is_approved=True,
            is_email_verified=True,
        )
        self.product = Product.objects.create(
            vendor=self.vendor,
            name='Edge Product',
            description='Edge case product',
            price='500.00',
            quantity=5,
            sku='SKU-EDGE-001',
            slug='edge-product-001',
            status='active',
        )

    def test_rejects_zero_quantity(self):
        with self.assertRaises(ValidationError) as ctx:
            OrderService.create_order(self.customer, {
                'shipping_method': 'pickup',
                'shipping_address': {'street': 'Main', 'city': 'Lagos'},
                'items': [{
                    'product_id': self.product.id,
                    'quantity': 0,
                }],
            })
        self.assertIn('Quantity must be greater than zero', str(ctx.exception))

    def test_rejects_negative_quantity(self):
        with self.assertRaises(ValidationError) as ctx:
            OrderService.create_order(self.customer, {
                'shipping_method': 'pickup',
                'shipping_address': {'street': 'Main', 'city': 'Lagos'},
                'items': [{
                    'product_id': self.product.id,
                    'quantity': -3,
                }],
            })
        self.assertIn('Quantity must be greater than zero', str(ctx.exception))

    def test_rejects_missing_items(self):
        with self.assertRaises(ValidationError) as ctx:
            OrderService.create_order(self.customer, {
                'shipping_method': 'pickup',
                'shipping_address': {'street': 'Main', 'city': 'Lagos'},
                'items': [],
            })
        self.assertIn('at least one item', str(ctx.exception))

    def test_rejects_unknown_product(self):
        with self.assertRaises(ValidationError) as ctx:
            OrderService.create_order(self.customer, {
                'shipping_method': 'pickup',
                'shipping_address': {'street': 'Main', 'city': 'Lagos'},
                'items': [{
                    'product_id': 999999,
                    'quantity': 1,
                }],
            })
        self.assertIn('not found', str(ctx.exception))

    def test_rejects_inactive_product(self):
        self.product.status = 'inactive'
        self.product.save()
        with self.assertRaises(ValidationError) as ctx:
            OrderService.create_order(self.customer, {
                'shipping_method': 'pickup',
                'shipping_address': {'street': 'Main', 'city': 'Lagos'},
                'items': [{
                    'product_id': self.product.id,
                    'quantity': 1,
                }],
            })
        self.assertIn('not found', str(ctx.exception))

    def test_rejects_insufficient_stock(self):
        with self.assertRaises(ValidationError) as ctx:
            OrderService.create_order(self.customer, {
                'shipping_method': 'pickup',
                'shipping_address': {'street': 'Main', 'city': 'Lagos'},
                'items': [{
                    'product_id': self.product.id,
                    'quantity': 10,
                }],
            })
        self.assertIn('Insufficient stock', str(ctx.exception))
