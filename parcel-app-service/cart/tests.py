from django.test import TestCase

from authentication.models import CustomerUser
from cart.services import CartService


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
			product_name='Test Product',
			quantity=1,
			unit_price='100.00',
		)

		self.assertIsNone(cart_item)
		self.assertEqual(error, 'Cart not found')

	def test_get_cart_contents_returns_only_owner_cart(self):
		cart_data, error = CartService.get_cart_contents(self.cart.id, self.other_customer)

		self.assertIsNone(cart_data)
		self.assertEqual(error, 'Cart not found')
