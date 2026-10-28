from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from authentication.models import AdminUser, CourierUser, CustomerUser, UserSession, VendorUser
from banking.models import VendorBankDetail
from complaints.models import CustomerComplaint
from dispatch.models import Dispatch
from order.models import Order
from order.test_status_transitions import _make_fixtures


class AdminPaginationTests(TestCase):
	def setUp(self):
		self.super_admin = AdminUser.objects.create(
			email='pagination-super@example.com',
			first_name='Page',
			last_name='Admin',
			role='super_admin',
		)
		UserSession.objects.create(
			content_type=ContentType.objects.get_for_model(self.super_admin),
			object_id=self.super_admin.id,
			session_token='pagination-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)
		self.client = APIClient()
		self.client.credentials(HTTP_X_SESSION_TOKEN='pagination-token')

	def _make_customers(self, count):
		CustomerUser.objects.bulk_create([
			CustomerUser(email=f'page-customer-{i}@example.com', first_name='C', last_name=str(i), role='customer')
			for i in range(count)
		])

	def assertPaginated(self, response, *, items, total, pages, page=1):
		self.assertEqual(response.status_code, 200, response.data)
		self.assertEqual(response.data['status'], 'success')
		self.assertEqual(len(response.data['data']), items)
		meta = response.data['pagination']
		self.assertEqual(meta['total_count'], total)
		self.assertEqual(meta['total_pages'], pages)
		self.assertEqual(meta['page'], page)

	def test_default_page_size_is_20(self):
		self._make_customers(25)
		url = reverse('v1:auth:customer_list')

		self.assertPaginated(self.client.get(url), items=20, total=25, pages=2)
		page_two = self.client.get(url, {'page': 2})
		self.assertPaginated(page_two, items=5, total=25, pages=2, page=2)
		self.assertIsNone(page_two.data['pagination']['next'])
		self.assertIsNotNone(page_two.data['pagination']['previous'])

	def test_page_size_param_is_honoured_and_capped(self):
		self._make_customers(105)
		url = reverse('v1:auth:customer_list')

		self.assertPaginated(self.client.get(url, {'page_size': 5}), items=5, total=105, pages=21)
		self.assertPaginated(self.client.get(url, {'page_size': 500}), items=100, total=105, pages=2)

	def test_out_of_range_page_is_404_in_standard_envelope(self):
		response = self.client.get(reverse('v1:auth:customer_list'), {'page': 99})

		self.assertEqual(response.status_code, 404)
		self.assertEqual(response.data['status'], 'error')

	def test_filters_apply_before_pagination(self):
		self._make_customers(25)
		response = self.client.get(reverse('v1:auth:customer_list'), {'search': 'page-customer-1'})

		# page-customer-1 and page-customer-10..19
		self.assertPaginated(response, items=11, total=11, pages=1)

	def test_flat_admin_lists_are_paginated(self):
		_make_fixtures()
		CustomerComplaint.objects.create(
			customer_email='x@example.com', complaint_subject='S', complaint_detail='D',
			is_resolved=False, is_satisfied=False,
		)
		CourierUser.objects.create(email='page-courier@example.com', first_name='C', last_name='C', role='courier')

		for name in ['admin_list', 'admin_orders', 'admin_dispatches', 'admin_dispatch_ready_orders',
					 'admin_courier_list', 'admin_complaints']:
			with self.subTest(endpoint=name):
				response = self.client.get(reverse(f'v1:auth:{name}'))
				self.assertEqual(response.status_code, 200)
				self.assertIsInstance(response.data['data'], list)
				self.assertIn('total_count', response.data['pagination'])

	def test_ready_orders_exclude_orders_with_dispatch(self):
		_, _, _, order, _ = _make_fixtures()
		Order.objects.filter(pk=order.pk).update(status='ready')

		response = self.client.get(reverse('v1:auth:admin_dispatch_ready_orders'))
		self.assertEqual(response.data['pagination']['total_count'], 1)

		Dispatch.objects.create(order=order)
		response = self.client.get(reverse('v1:auth:admin_dispatch_ready_orders'))
		self.assertEqual(response.data['pagination']['total_count'], 0)

	def test_moderation_queue_paginates_each_group_and_tolerates_short_groups(self):
		VendorUser.objects.bulk_create([
			VendorUser(email=f'page-vendor-{i}@example.com', first_name='V', last_name=str(i),
					   phone=f'0890000{i:04d}', role='vendor', approval_status='pending')
			for i in range(25)
		])
		CourierUser.objects.create(email='page-courier@example.com', first_name='C', last_name='C',
								   role='courier', approval_status='pending')
		url = reverse('v1:auth:admin_moderation_queue')

		first = self.client.get(url, {'type': 'all', 'status': 'pending'})
		self.assertEqual(first.status_code, 200)
		self.assertEqual(len(first.data['data']['vendors']), 20)
		self.assertEqual(first.data['data']['summary']['vendors'], 25)
		self.assertEqual(first.data['data']['summary']['couriers'], 1)

		second = self.client.get(url, {'type': 'all', 'status': 'pending', 'page': 2})
		self.assertEqual(second.status_code, 200)
		self.assertEqual(len(second.data['data']['vendors']), 5)
		self.assertEqual(second.data['data']['couriers'], [])
		self.assertEqual(second.data['pagination']['couriers']['total_count'], 1)

	def test_moderation_queue_only_paginates_requested_group(self):
		response = self.client.get(reverse('v1:auth:admin_moderation_queue'), {'type': 'products'})

		self.assertEqual(set(response.data['pagination']), {'products'})
		self.assertEqual(response.data['data']['vendors'], [])

	def test_banking_list_is_grouped_and_paginated(self):
		VendorBankDetail.objects.bulk_create([
			VendorBankDetail(bank_name='B', account_type='Savings', account_name=f'A{i}',
							 vendor_email=f'v{i}@example.com', account_no=str(i), added_at='x', updated_at='x')
			for i in range(22)
		])

		response = self.client.get(reverse('v1:auth:admin_banking_list'))

		self.assertEqual(response.status_code, 200)
		self.assertEqual(len(response.data['data']['vendors']), 20)
		self.assertEqual(response.data['data']['couriers'], [])
		self.assertEqual(response.data['pagination']['vendors']['total_pages'], 2)
		self.assertEqual(response.data['pagination']['couriers']['total_count'], 0)
