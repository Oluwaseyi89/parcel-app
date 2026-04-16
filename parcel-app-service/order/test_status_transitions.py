from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from authentication.models import AdminUser, CustomerUser, VendorUser
from order.models import Order, OrderStatusHistory
from order.services import OrderService


def _make_fixtures():
	"""Shared fixture builder: customer, vendor, product, and a pending order."""
	customer = CustomerUser.objects.create(
		email='transition-customer@example.com',
		first_name='Transition',
		last_name='Customer',
		phone='08300000001',
		role='customer',
		is_email_verified=True,
	)
	customer.set_password('StrongPassword123')
	customer.save()

	vendor = VendorUser.objects.create(
		email='transition-vendor@example.com',
		first_name='Transition',
		last_name='Vendor',
		phone='08300000002',
		business_name='Transition Shop',
		role='vendor',
		is_approved=True,
		is_email_verified=True,
	)
	vendor.set_password('StrongPassword123')
	vendor.save()

	from product.models import Product
	product = Product.objects.create(
		vendor=vendor,
		name='Transition Product',
		description='Product for transition tests',
		price='5000.00',
		quantity=50,
		main_image=SimpleUploadedFile('transition.jpg', b'img', content_type='image/jpeg'),
		sku='SKU-TRANS-001',
		slug='transition-product-001',
		status='active',
	)

	order = OrderService.create_order(
		customer,
		{
			'shipping_method': 'pickup',
			'shipping_address': {'street': '1 Transition St', 'city': 'Lagos'},
			'items': [{'product_id': product.id, 'quantity': 2}],
		},
	)

	admin = AdminUser.objects.create(
		email='transition-admin@example.com',
		first_name='Transition',
		last_name='Admin',
		role='admin',
		is_email_verified=True,
	)
	admin.set_password('StrongPassword123')
	admin.save()

	return customer, vendor, product, order, admin


# ── Valid transition map (mirrors services.py) ────────────────────────

VALID_TRANSITIONS = {
	'pending': ['confirmed', 'cancelled'],
	'confirmed': ['processing', 'cancelled'],
	'processing': ['ready', 'cancelled'],
	'ready': ['dispatched'],
	'dispatched': ['in_transit'],
	'in_transit': ['delivered'],
	'delivered': ['refunded'],
	'cancelled': [],
	'refunded': [],
	'failed': [],
}

ALL_STATUSES = list(VALID_TRANSITIONS.keys())


class AllowedTransitionTests(TestCase):
	"""Every valid transition in the map succeeds via OrderService."""

	def setUp(self):
		self.customer, self.vendor, self.product, _, self.admin = _make_fixtures()

	def _fresh_order(self):
		from product.models import Product
		product = Product.objects.create(
			vendor=self.vendor,
			name=f'Fresh-{Product.objects.count()}',
			description='Fresh order product',
			price='1000.00',
			quantity=100,
			main_image=SimpleUploadedFile('fresh.jpg', b'img', content_type='image/jpeg'),
			sku=f'SKU-FRESH-{Product.objects.count():04d}',
			slug=f'fresh-product-{Product.objects.count():04d}',
			status='active',
		)
		return OrderService.create_order(
			self.customer,
			{
				'shipping_method': 'pickup',
				'shipping_address': {'street': '1 Test St', 'city': 'Lagos'},
				'items': [{'product_id': product.id, 'quantity': 1}],
			},
		)

	def _advance_order_to(self, order, target_status):
		"""Walk the order through the happy-path chain up to target_status."""
		chain = ['pending', 'confirmed', 'processing', 'ready', 'dispatched', 'in_transit', 'delivered']
		start = chain.index(order.status)
		end = chain.index(target_status)
		for next_status in chain[start + 1 : end + 1]:
			kwargs = {}
			if next_status == 'dispatched':
					from authentication.models import CourierUser
					courier = CourierUser.objects.create(
						email=f'courier-{Order.objects.count()}@example.com',
						first_name='Courier',
						last_name='Test',
						phone=f'0830000{Order.objects.count():04d}',
						role='courier',
						is_email_verified=True,
						is_approved=True,
						is_active=True,
						status='active',
					)
					courier.set_password('StrongPassword123')
					courier.save()
					kwargs = {'tracking_number': f'TRK-{order.id}', 'courier_id': courier.id}
			OrderService.update_order_status(order.id, next_status, self.admin, '', **kwargs)
			order.refresh_from_db()

	def test_pending_to_confirmed(self):
		order = self._fresh_order()
		OrderService.update_order_status(order.id, 'confirmed', self.admin)
		order.refresh_from_db()
		self.assertEqual(order.status, 'confirmed')

	def test_pending_to_cancelled(self):
		order = self._fresh_order()
		OrderService.update_order_status(order.id, 'cancelled', self.admin, 'No longer needed')
		order.refresh_from_db()
		self.assertEqual(order.status, 'cancelled')

	def test_confirmed_to_processing(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'confirmed')
		OrderService.update_order_status(order.id, 'processing', self.admin)
		order.refresh_from_db()
		self.assertEqual(order.status, 'processing')

	def test_confirmed_to_cancelled(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'confirmed')
		OrderService.update_order_status(order.id, 'cancelled', self.admin)
		order.refresh_from_db()
		self.assertEqual(order.status, 'cancelled')

	def test_processing_to_ready(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'processing')
		OrderService.update_order_status(order.id, 'ready', self.admin)
		order.refresh_from_db()
		self.assertEqual(order.status, 'ready')

	def test_processing_to_cancelled(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'processing')
		OrderService.update_order_status(order.id, 'cancelled', self.admin)
		order.refresh_from_db()
		self.assertEqual(order.status, 'cancelled')

	def test_ready_to_dispatched(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'ready')
		from authentication.models import CourierUser
		courier = CourierUser.objects.create(
			email='dispatch-courier@example.com',
			first_name='Dispatch',
			last_name='Courier',
			phone='08300009001',
			role='courier',
			is_email_verified=True,
			is_approved=True,
			is_active=True,
			status='active',
		)
		courier.set_password('StrongPassword123')
		courier.save()
		OrderService.update_order_status(
			order.id, 'dispatched', self.admin, '',
			tracking_number='TRK-DISPATCH-001', courier_id=courier.id,
		)
		order.refresh_from_db()
		self.assertEqual(order.status, 'dispatched')
		self.assertEqual(order.tracking_number, 'TRK-DISPATCH-001')

	def test_dispatched_to_in_transit(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'dispatched')
		OrderService.update_order_status(order.id, 'in_transit', self.admin)
		order.refresh_from_db()
		self.assertEqual(order.status, 'in_transit')

	def test_in_transit_to_delivered(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'in_transit')
		OrderService.update_order_status(order.id, 'delivered', self.admin)
		order.refresh_from_db()
		self.assertEqual(order.status, 'delivered')
		self.assertIsNotNone(order.delivered_at)

	def test_delivered_to_refunded(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'delivered')
		OrderService.update_order_status(order.id, 'refunded', self.admin)
		order.refresh_from_db()
		self.assertEqual(order.status, 'refunded')

	def test_full_happy_path_pending_through_delivered(self):
		"""Walk the entire order lifecycle: pending → confirmed → … → delivered."""
		order = self._fresh_order()
		self._advance_order_to(order, 'delivered')
		self.assertEqual(order.status, 'delivered')
		self.assertIsNotNone(order.confirmed_at)
		self.assertIsNotNone(order.delivered_at)


class ForbiddenTransitionTests(TestCase):
	"""Every invalid transition raises ValidationError with a stable message."""

	def setUp(self):
		self.customer, self.vendor, self.product, _, self.admin = _make_fixtures()
		self._counter = 0

	def _fresh_order(self):
		from product.models import Product
		self._counter += 1
		product = Product.objects.create(
			vendor=self.vendor,
			name=f'Forbidden-{self._counter}',
			description='Forbidden transition product',
			price='1000.00',
			quantity=100,
			main_image=SimpleUploadedFile('forbidden.jpg', b'img', content_type='image/jpeg'),
			sku=f'SKU-FORBID-{self._counter:04d}',
			slug=f'forbidden-product-{self._counter:04d}',
			status='active',
		)
		return OrderService.create_order(
			self.customer,
			{
				'shipping_method': 'pickup',
				'shipping_address': {'street': '1 Test St', 'city': 'Lagos'},
				'items': [{'product_id': product.id, 'quantity': 1}],
			},
		)

	def _advance_order_to(self, order, target_status):
		chain = ['pending', 'confirmed', 'processing', 'ready', 'dispatched', 'in_transit', 'delivered']
		start = chain.index(order.status)
		end = chain.index(target_status)
		courier = None
		for next_status in chain[start + 1 : end + 1]:
			kwargs = {}
			if next_status == 'dispatched':
				from authentication.models import CourierUser
				self._counter += 1
				courier = CourierUser.objects.create(
					email=f'forbid-courier-{self._counter}@example.com',
					first_name='Courier',
					last_name='Forbid',
					phone=f'0840000{self._counter:04d}',
					role='courier',
					is_email_verified=True,
					is_approved=True,
					is_active=True,
					status='active',
				)
				courier.set_password('StrongPassword123')
				courier.save()
				kwargs = {'tracking_number': f'TRK-F-{order.id}', 'courier_id': courier.id}
			elif next_status in ['in_transit', 'delivered']:
				# Ensure courier is always present for these transitions
				if not courier:
					from authentication.models import CourierUser
					self._counter += 1
					courier = CourierUser.objects.create(
						email=f'forbid-courier-{self._counter}@example.com',
						first_name='Courier',
						last_name='Forbid',
						phone=f'0840000{self._counter:04d}',
						role='courier',
						is_email_verified=True,
						is_approved=True,
						is_active=True,
						status='active',
					)
					courier.set_password('StrongPassword123')
					courier.save()
				kwargs = {'courier_id': courier.id}
			OrderService.update_order_status(order.id, next_status, self.admin, '', **kwargs)
			order.refresh_from_db()

	def _assert_forbidden(self, order, target_status):
		"""Assert transition raises ValidationError with the expected message."""
		original_status = order.status
		with self.assertRaises(ValidationError) as ctx:
			OrderService.update_order_status(order.id, target_status, self.admin)
		self.assertIn('Cannot transition from', str(ctx.exception))
		self.assertIn(original_status, str(ctx.exception))
		self.assertIn(target_status, str(ctx.exception))

		# Status must be unchanged from original
		order.refresh_from_db()
		self.assertEqual(order.status, original_status)

	# ── Terminal states: no outbound transitions ──────────────────────

	def test_cancelled_to_any_is_forbidden(self):
		order = self._fresh_order()
		OrderService.update_order_status(order.id, 'cancelled', self.admin)
		order.refresh_from_db()
		for target in ALL_STATUSES:
			if target == 'cancelled':
				continue
			with self.subTest(transition=f'cancelled→{target}'):
				self._assert_forbidden(order, target)

	def test_refunded_to_any_is_forbidden(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'delivered')
		OrderService.update_order_status(order.id, 'refunded', self.admin)
		order.refresh_from_db()
		for target in ALL_STATUSES:
			if target == 'refunded':
				continue
			with self.subTest(transition=f'refunded→{target}'):
				self._assert_forbidden(order, target)

	def test_failed_to_any_is_forbidden(self):
		order = self._fresh_order()
		# Force into 'failed' state directly (no valid transition leads here)
		Order.objects.filter(id=order.id).update(status='failed')
		order.refresh_from_db()
		for target in ALL_STATUSES:
			if target == 'failed':
				continue
			with self.subTest(transition=f'failed→{target}'):
				self._assert_forbidden(order, target)

	# ── Backward / skip transitions ───────────────────────────────────

	def test_confirmed_cannot_go_back_to_pending(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'confirmed')
		self._assert_forbidden(order, 'pending')

	def test_processing_cannot_go_back_to_confirmed(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'processing')
		self._assert_forbidden(order, 'confirmed')

	def test_processing_cannot_go_back_to_pending(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'processing')
		self._assert_forbidden(order, 'pending')

	def test_ready_cannot_go_back_to_processing(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'ready')
		self._assert_forbidden(order, 'processing')

	def test_dispatched_cannot_go_back_to_ready(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'dispatched')
		self._assert_forbidden(order, 'ready')

	def test_in_transit_cannot_go_back_to_dispatched(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'in_transit')
		self._assert_forbidden(order, 'dispatched')

	def test_delivered_cannot_go_back_to_in_transit(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'delivered')
		self._assert_forbidden(order, 'in_transit')

	# ── Skip-ahead transitions ────────────────────────────────────────

	def test_pending_cannot_skip_to_processing(self):
		order = self._fresh_order()
		self._assert_forbidden(order, 'processing')

	def test_pending_cannot_skip_to_delivered(self):
		order = self._fresh_order()
		self._assert_forbidden(order, 'delivered')

	def test_confirmed_cannot_skip_to_ready(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'confirmed')
		self._assert_forbidden(order, 'ready')

	def test_confirmed_cannot_skip_to_dispatched(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'confirmed')
		self._assert_forbidden(order, 'dispatched')

	def test_ready_cannot_cancel(self):
		"""ready has no cancellation path — only dispatched is allowed."""
		order = self._fresh_order()
		self._advance_order_to(order, 'ready')
		self._assert_forbidden(order, 'cancelled')

	def test_dispatched_cannot_cancel(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'dispatched')
		self._assert_forbidden(order, 'cancelled')

	def test_in_transit_cannot_cancel(self):
		order = self._fresh_order()
		self._advance_order_to(order, 'in_transit')
		self._assert_forbidden(order, 'cancelled')

	# ── Self-transition (same status) ─────────────────────────────────

	def test_same_status_transition_is_forbidden(self):
		"""Transitioning to the current status is not in the allowed list."""
		order = self._fresh_order()
		self._assert_forbidden(order, 'pending')

	# ── Bogus status ──────────────────────────────────────────────────

	def test_unknown_status_is_forbidden(self):
		order = self._fresh_order()
		self._assert_forbidden(order, 'shipped')

	def test_empty_status_is_forbidden(self):
		order = self._fresh_order()
		self._assert_forbidden(order, '')


class StatusHistoryTrackingTests(TestCase):
	"""Status changes create OrderStatusHistory entries."""

	def setUp(self):
		self.customer, self.vendor, self.product, self.order, self.admin = _make_fixtures()

	def test_transition_creates_history_entry(self):
		OrderService.update_order_status(self.order.id, 'confirmed', self.admin, 'Vendor confirmed')
		history = OrderStatusHistory.objects.filter(order=self.order)
		self.assertEqual(history.count(), 1)
		entry = history.first()
		self.assertEqual(entry.old_status, 'pending')
		self.assertEqual(entry.new_status, 'confirmed')
		self.assertEqual(entry.notes, 'Vendor confirmed')

	def test_multiple_transitions_create_ordered_history(self):
		OrderService.update_order_status(self.order.id, 'confirmed', self.admin)
		OrderService.update_order_status(self.order.id, 'processing', self.admin)
		OrderService.update_order_status(self.order.id, 'cancelled', self.admin, 'Out of stock')

		entries = list(OrderStatusHistory.objects.filter(order=self.order).order_by('created_at'))
		self.assertEqual(len(entries), 3)
		self.assertEqual(entries[0].old_status, 'pending')
		self.assertEqual(entries[0].new_status, 'confirmed')
		self.assertEqual(entries[1].old_status, 'confirmed')
		self.assertEqual(entries[1].new_status, 'processing')
		self.assertEqual(entries[2].old_status, 'processing')
		self.assertEqual(entries[2].new_status, 'cancelled')
		self.assertEqual(entries[2].notes, 'Out of stock')

	def test_forbidden_transition_does_not_create_history(self):
		with self.assertRaises(ValidationError):
			OrderService.update_order_status(self.order.id, 'delivered', self.admin)
		self.assertEqual(OrderStatusHistory.objects.filter(order=self.order).count(), 0)


class TimestampTests(TestCase):
	"""Status transitions set the expected timestamp fields."""

	def setUp(self):
		self.customer, self.vendor, self.product, self.order, self.admin = _make_fixtures()

	def test_confirmed_sets_confirmed_at(self):
		self.assertIsNone(self.order.confirmed_at)
		OrderService.update_order_status(self.order.id, 'confirmed', self.admin)
		self.order.refresh_from_db()
		self.assertIsNotNone(self.order.confirmed_at)

	def test_cancelled_sets_cancelled_at(self):
		self.assertIsNone(self.order.cancelled_at)
		OrderService.update_order_status(self.order.id, 'cancelled', self.admin)
		self.order.refresh_from_db()
		self.assertIsNotNone(self.order.cancelled_at)

	def test_delivered_sets_delivered_at(self):
		# Walk to in_transit first
		OrderService.update_order_status(self.order.id, 'confirmed', self.admin)
		OrderService.update_order_status(self.order.id, 'processing', self.admin)
		OrderService.update_order_status(self.order.id, 'ready', self.admin)
		from authentication.models import CourierUser
		courier = CourierUser.objects.create(
			email='ts-courier@example.com',
			first_name='TS',
			last_name='Courier',
			phone='08300008001',
			role='courier',
			is_email_verified=True,
			is_approved=True,
			is_active=True,
			status='active',
		)
		courier.set_password('StrongPassword123')
		courier.save()
		OrderService.update_order_status(
			self.order.id, 'dispatched', self.admin, '',
			tracking_number='TRK-TS-001', courier_id=courier.id,
		)
		OrderService.update_order_status(self.order.id, 'in_transit', self.admin, '', courier_id=courier.id)

		self.assertIsNone(self.order.delivered_at)
		OrderService.update_order_status(self.order.id, 'delivered', self.admin, '', courier_id=courier.id)
		self.order.refresh_from_db()
		self.assertIsNotNone(self.order.delivered_at)


class CanBeCancelledPropertyTests(TestCase):
	"""Order.can_be_cancelled reflects the cancellation window."""

	def setUp(self):
		self.customer, self.vendor, self.product, self.order, self.admin = _make_fixtures()

	def test_pending_can_be_cancelled(self):
		self.assertTrue(self.order.can_be_cancelled)

	def test_confirmed_can_be_cancelled(self):
		OrderService.update_order_status(self.order.id, 'confirmed', self.admin)
		self.order.refresh_from_db()
		self.assertTrue(self.order.can_be_cancelled)

	def test_processing_can_be_cancelled(self):
		OrderService.update_order_status(self.order.id, 'confirmed', self.admin)
		OrderService.update_order_status(self.order.id, 'processing', self.admin)
		self.order.refresh_from_db()
		self.assertTrue(self.order.can_be_cancelled)

	def test_ready_cannot_be_cancelled(self):
		OrderService.update_order_status(self.order.id, 'confirmed', self.admin)
		OrderService.update_order_status(self.order.id, 'processing', self.admin)
		OrderService.update_order_status(self.order.id, 'ready', self.admin)
		self.order.refresh_from_db()
		self.assertFalse(self.order.can_be_cancelled)

	def test_dispatched_cannot_be_cancelled(self):
		Order.objects.filter(id=self.order.id).update(status='dispatched')
		self.order.refresh_from_db()
		self.assertFalse(self.order.can_be_cancelled)

	def test_delivered_cannot_be_cancelled(self):
		Order.objects.filter(id=self.order.id).update(status='delivered')
		self.order.refresh_from_db()
		self.assertFalse(self.order.can_be_cancelled)

	def test_cancelled_cannot_be_cancelled(self):
		Order.objects.filter(id=self.order.id).update(status='cancelled')
		self.order.refresh_from_db()
		self.assertFalse(self.order.can_be_cancelled)
