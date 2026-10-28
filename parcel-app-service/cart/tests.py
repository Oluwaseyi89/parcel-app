from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from authentication.models import CustomerUser, VendorUser
from cart.serializers import CartItemAddSerializer
from cart.services import CartService
from product.models import Product


class CartServiceOwnershipTests(TestCase):
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

		self.other_customer = CustomerUser.objects.create(
			email='other@example.com',
			first_name='Other',
			last_name='User',
			role='customer',
			is_email_verified=True,
		)
		self.other_customer.set_password('StrongPassword123')
		self.other_customer.save()

		self.cart = CartService.get_or_create_cart(self.customer)

	def test_add_to_cart_requires_cart_owner(self):
		cart_item, error = CartService.add_to_cart(
			self.cart.id,
			self.other_customer,
			product_id=1,
			quantity=1,
		)

		self.assertIsNone(cart_item)
		self.assertEqual(error, 'Cart not found')

	def test_get_cart_contents_returns_only_owner_cart(self):
		cart_data, error = CartService.get_cart_contents(self.cart.id, self.other_customer)

		self.assertIsNone(cart_data)
		self.assertEqual(error, 'Cart not found')


class CartServicePricingTests(TestCase):
	def setUp(self):
		self.customer = CustomerUser.objects.create(
			email='pricing-customer@example.com',
			first_name='Pricing',
			last_name='Customer',
			role='customer',
			is_email_verified=True,
		)
		vendor = VendorUser.objects.create(
			email='pricing-vendor@example.com',
			first_name='Pricing',
			last_name='Vendor',
			phone='08400000001',
			business_name='Pricing Shop',
			role='vendor',
			is_approved=True,
			is_email_verified=True,
		)
		self.product = Product.objects.create(
			vendor=vendor,
			name='Catalogue Product',
			description='Product for cart pricing tests',
			price='2500.00',
			quantity=5,
			main_image=SimpleUploadedFile('pricing.jpg', b'img', content_type='image/jpeg'),
			sku='SKU-CART-PRICE-001',
			slug='cart-pricing-product',
			status='active',
		)
		self.cart = CartService.get_or_create_cart(self.customer)

	def test_price_and_name_come_from_product(self):
		cart_item, error = CartService.add_to_cart(self.cart.id, self.customer, self.product.id, 2)

		self.assertIsNone(error)
		self.assertEqual(cart_item.unit_price, Decimal('2500.00'))
		self.assertEqual(cart_item.product_name, 'Catalogue Product')
		self.cart.refresh_from_db()
		self.assertEqual(self.cart.total_price, Decimal('5000.00'))

	def test_updating_existing_item_reprices_from_product(self):
		CartService.add_to_cart(self.cart.id, self.customer, self.product.id, 1)
		self.product.price = Decimal('3000.00')
		self.product.save()

		cart_item, error = CartService.add_to_cart(self.cart.id, self.customer, self.product.id, 2)

		self.assertIsNone(error)
		self.assertEqual(cart_item.unit_price, Decimal('3000.00'))

	def test_inactive_or_missing_product_is_rejected(self):
		self.product.status = 'discontinued'
		self.product.save()

		cart_item, error = CartService.add_to_cart(self.cart.id, self.customer, self.product.id, 1)
		self.assertIsNone(cart_item)
		self.assertEqual(error, 'Product not found')

		cart_item, error = CartService.add_to_cart(self.cart.id, self.customer, 999999, 1)
		self.assertIsNone(cart_item)
		self.assertEqual(error, 'Product not found')

	def test_quantity_above_stock_is_rejected(self):
		cart_item, error = CartService.add_to_cart(self.cart.id, self.customer, self.product.id, 6)

		self.assertIsNone(cart_item)
		self.assertIn('available', error)


class CartItemAddSerializerTests(TestCase):
	def test_client_price_and_name_are_ignored(self):
		serializer = CartItemAddSerializer(data={
			'product_id': 1,
			'quantity': 2,
			'unit_price': '0.01',
			'product_name': 'Spoofed',
		})

		self.assertTrue(serializer.is_valid())
		self.assertEqual(serializer.validated_data, {'product_id': 1, 'quantity': 2})

	def test_non_positive_quantity_is_rejected(self):
		for quantity in (0, -1):
			with self.subTest(quantity=quantity):
				serializer = CartItemAddSerializer(data={'product_id': 1, 'quantity': quantity})
				self.assertFalse(serializer.is_valid())
				self.assertIn('quantity', serializer.errors)
