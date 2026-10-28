from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from authentication.models import AdminUser, CourierUser, UserSession, VendorUser
from complaints.models import CustomerComplaint
from dispatch.models import Dispatch
from messaging.models import MessageTemplate
from order.models import Order
from order.test_status_transitions import _make_fixtures
from product.models import Category


class RemainingListPaginationTests(TestCase):
	def setUp(self):
		admin = AdminUser.objects.create(email='lists-admin@example.com', first_name='L', last_name='A', role='admin')
		UserSession.objects.create(
			content_type=ContentType.objects.get_for_model(admin),
			object_id=admin.id,
			session_token='lists-admin-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)
		self.client = APIClient()
		self.client.credentials(HTTP_X_SESSION_TOKEN='lists-admin-token')

	def assertPaginated(self, url, *, items, total, client=None):
		response = (client or self.client).get(url)
		self.assertEqual(response.status_code, 200, response.data)
		self.assertEqual(response.data['status'], 'success')
		self.assertEqual(len(response.data['data']), items)
		self.assertEqual(response.data['pagination']['total_count'], total)
		return response

	def test_vendor_lists(self):
		VendorUser.objects.bulk_create([
			VendorUser(email=f'lv{i}@example.com', first_name='V', last_name=str(i), phone=f'0810000{i:04d}',
					   role='vendor', is_active=True, is_approved=i % 2 == 0)
			for i in range(30)
		])
		self.assertPaginated(reverse('v1:vendors:vendor_list'), items=20, total=30)
		self.assertPaginated(reverse('v1:vendors:temp_vendor_list'), items=15, total=15)

	def test_courier_lists(self):
		CourierUser.objects.bulk_create([
			CourierUser(email=f'lc{i}@example.com', first_name='C', last_name=str(i), phone=f'0820000{i:04d}',
						role='courier', is_active=True, is_approved=i % 3 == 0)
			for i in range(24)
		])
		self.assertPaginated(reverse('v1:couriers:courier_list'), items=20, total=24)
		self.assertPaginated(reverse('v1:couriers:temp_courier_list'), items=16, total=16)

	def test_message_templates(self):
		MessageTemplate.objects.bulk_create([
			MessageTemplate(name=f'template-{i}', subject='S', body_html='<p>B</p>') for i in range(21)
		])
		self.assertPaginated(reverse('v1:messaging:template_list'), items=20, total=21)

	def test_categories_are_public_and_paginated(self):
		Category.objects.bulk_create([Category(name=f'Cat {i}', slug=f'cat-{i}') for i in range(22)])
		self.assertPaginated(reverse('v1:product:category_list'), items=20, total=22, client=APIClient())

	def test_all_complaints(self):
		CustomerComplaint.objects.bulk_create([
			CustomerComplaint(customer_email=f'c{i}@example.com', complaint_subject='S', complaint_detail='D',
							  is_resolved=False, is_satisfied=False)
			for i in range(25)
		])
		self.assertPaginated(reverse('v1:complaints:all_complaints'), items=20, total=25)

	def test_ready_for_dispatch_only_lists_paid_ready_orders_without_dispatch(self):
		_, _, _, order, _ = _make_fixtures()
		url = reverse('v1:dispatch:ready_orders')

		self.assertPaginated(url, items=0, total=0)

		Order.objects.filter(pk=order.pk).update(status='ready', payment_status='paid')
		response = self.assertPaginated(url, items=1, total=1)
		ready = response.data['data'][0]
		self.assertEqual(ready['order_id'], order.id)
		self.assertEqual(ready['total_items'], len(ready['items']))

		Dispatch.objects.create(order=order)
		self.assertPaginated(url, items=0, total=0)
