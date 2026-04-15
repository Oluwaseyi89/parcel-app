from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import inspect
from datetime import timedelta
from rest_framework.test import APIClient

from authentication.models import AdminUser, CustomerUser, UserSession, VendorUser


class CsrfEnforcementTests(TestCase):
	def setUp(self):
		self.client = APIClient(enforce_csrf_checks=True)
		self.admin = AdminUser.objects.create(
			email='csrf-admin@example.com',
			first_name='Csrf',
			last_name='Admin',
			role='admin',
			is_email_verified=True,
		)
		self.admin.set_password('StrongPassword123')
		self.admin.save()

		self.customer = CustomerUser.objects.create(
			email='csrf-customer@example.com',
			first_name='Csrf',
			last_name='Customer',
			role='customer',
			is_email_verified=True,
		)
		self.customer.set_password('StrongPassword123')
		self.customer.save()

		content_type = ContentType.objects.get_for_model(self.admin)
		UserSession.objects.create(
			content_type=content_type,
			object_id=self.admin.id,
			session_token='csrf-session-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)

		self.client.cookies['auth_session'] = 'csrf-session-token'

	def _issue_csrf_token(self):
		response = self.client.get('/auth/csrf/')
		self.assertEqual(response.status_code, 200)
		return response.data['data']['csrf_token']

	def test_patch_requires_csrf_with_cookie_auth(self):
		without_csrf = self.client.patch('/auth/api/profile/', {'first_name': 'NoCsrf'}, format='json')
		self.assertEqual(without_csrf.status_code, 403)

		csrf_token = self._issue_csrf_token()
		with_csrf = self.client.patch(
			'/auth/api/profile/',
			{'first_name': 'WithCsrf'},
			format='json',
			HTTP_X_CSRFTOKEN=csrf_token,
		)
		self.assertEqual(with_csrf.status_code, 200)

	def test_post_requires_csrf_with_cookie_auth(self):
		without_csrf = self.client.post('/auth/api/logout/', {}, format='json')
		self.assertEqual(without_csrf.status_code, 403)

		csrf_token = self._issue_csrf_token()
		with_csrf = self.client.post('/auth/api/logout/', {}, format='json', HTTP_X_CSRFTOKEN=csrf_token)
		self.assertEqual(with_csrf.status_code, 200)

	def test_delete_requires_csrf_with_cookie_auth(self):
		without_csrf = self.client.delete(f'/auth/api/customers/{self.customer.id}/')
		self.assertEqual(without_csrf.status_code, 403)

		csrf_token = self._issue_csrf_token()
		with_csrf = self.client.delete(
			f'/auth/api/customers/{self.customer.id}/',
			HTTP_X_CSRFTOKEN=csrf_token,
		)
		self.assertEqual(with_csrf.status_code, 200)


class CsrfExemptSurfaceAuditTests(TestCase):
	"""
	P0: CSRF enforcement matrix and csrf_exempt surface audit.

	Documented routed csrf_exempt surface:
	- auth:   /auth/api/sessions/active/
	- auth:   /auth/api/mobile/login/
	- auth:   /auth/customer/register/mobile/
	- auth:   /auth/customer/login/mobile/
	- auth:   /auth/customer/profile/mobile/
	- auth:   /auth/customer/password/reset/mobile/
	- vendor: /vendors/register/mobile/
	- vendor: /vendors/login/mobile/
	- courier:/couriers/register/mobile/
	- courier:/couriers/login/mobile/
	- order:  /order/orders/create/mobile/
	- product:/product/products/create/mobile/
	- product:/product/products/1/update/mobile/

	The paired web routes remain CSRF-protected for unsafe cookie-auth requests.
	"""

	URL_EXEMPT_EXPECTATIONS = {
		'authentication.urls': {
			'count': 6,
			'snippets': [
				"path('api/sessions/active/', csrf_exempt(AdminLoginView.as_view()), name=\"active_sessions\")",
				"path('api/mobile/login/', csrf_exempt(AdminLoginView.as_view()), name=\"mobile_admin_login\")",
				"path('customer/register/mobile/', csrf_exempt(CustomerRegistrationView.as_view()), name=\"customer_register_mobile\")",
				"path('customer/login/mobile/', csrf_exempt(CustomerLoginView.as_view()), name=\"customer_login_mobile\")",
				"path('customer/profile/mobile/', csrf_exempt(CustomerProfileView.as_view()), name=\"customer_profile_mobile\")",
				"path('customer/password/reset/mobile/', csrf_exempt(CustomerResetView.as_view()), name=\"customer_password_reset_mobile\")",
			],
		},
		'vendor.urls': {
			'count': 2,
			'snippets': [
				"path('register/mobile/', csrf_exempt(TempVendorRegistrationView.as_view()), name=\"vendor_register_mobile\")",
				"path('login/mobile/', csrf_exempt(VendorLoginView.as_view()), name=\"vendor_login_mobile\")",
			],
		},
		'courier.urls': {
			'count': 2,
			'snippets': [
				"path('register/mobile/', csrf_exempt(TempCourierRegistrationView.as_view()), name=\"courier_register_mobile\")",
				"path('login/mobile/', csrf_exempt(CourierLoginView.as_view()), name=\"courier_login_mobile\")",
			],
		},
		'order.urls': {
			'count': 1,
			'snippets': [
				"path('orders/create/mobile/', csrf_exempt(OrderCreateView.as_view()), name=\"order_create_mobile\")",
			],
		},
		'product.urls': {
			'count': 2,
			'snippets': [
				"path('products/create/mobile/', csrf_exempt(ProductCreateView.as_view()), name=\"product_create_mobile\")",
				"path('products/<int:product_id>/update/mobile/', csrf_exempt(ProductUpdateView.as_view()), name=\"product_update_mobile\")",
			],
		},
		'dispatch.urls': {
			'count': 0,
			'snippets': [],
		},
		'messaging.urls': {
			'count': 0,
			'snippets': [],
		},
	}

	def test_urls_modules_document_expected_csrf_exempt_surface(self):
		for module_name, expectation in self.URL_EXEMPT_EXPECTATIONS.items():
			with self.subTest(module=module_name):
				module = __import__(module_name, fromlist=['urlpatterns'])
				source = inspect.getsource(module)
				active_exempt_lines = [
					line for line in source.splitlines()
					if 'csrf_exempt(' in line and not line.lstrip().startswith('#')
				]
				self.assertEqual(len(active_exempt_lines), expectation['count'])
				for snippet in expectation['snippets']:
					self.assertIn(snippet, source)


class CsrfEnforcementMatrixTests(TestCase):
	def setUp(self):
		self.customer = CustomerUser.objects.create(
			email='csrf-matrix-customer@example.com',
			first_name='Csrf',
			last_name='Customer',
			phone='08100001001',
			role='customer',
			is_email_verified=True,
		)
		self.customer.set_password('StrongPassword123')
		self.customer.save()

		self.vendor = VendorUser.objects.create(
			email='csrf-matrix-vendor@example.com',
			first_name='Csrf',
			last_name='Vendor',
			phone='08100001002',
			role='vendor',
			is_email_verified=True,
			is_approved=True,
		)
		self.vendor.set_password('StrongPassword123')
		self.vendor.save()

		self.category = None
		from product.models import Category, Product
		self.category = Category.objects.create(name='CSRF Matrix Category', slug='csrf-matrix-category')
		self.product = Product.objects.create(
			name='CSRF Matrix Product',
			description='CSRF matrix test product',
			category=self.category,
			vendor=self.vendor,
			price='1500.00',
			quantity=10,
			main_image='product_images/csrf-matrix.jpg',
			sku='CSRF-MATRIX-SKU',
			slug='csrf-matrix-product',
			approval_status='approved',
		)

		customer_content_type = ContentType.objects.get_for_model(self.customer)
		vendor_content_type = ContentType.objects.get_for_model(self.vendor)

		UserSession.objects.create(
			content_type=customer_content_type,
			object_id=self.customer.id,
			session_token='csrf-matrix-customer-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)
		UserSession.objects.create(
			content_type=vendor_content_type,
			object_id=self.vendor.id,
			session_token='csrf-matrix-vendor-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)

	def _cookie_client(self, session_token):
		client = APIClient(enforce_csrf_checks=True)
		client.cookies['auth_session'] = session_token
		return client

	def test_non_exempt_cookie_auth_web_routes_fail_without_csrf(self):
		cases = [
			{
				'name': 'auth_logout',
				'method': 'post',
				'path': '/auth/api/logout/',
				'token': 'csrf-matrix-customer-token',
				'data': {},
			},
			{
				'name': 'auth_profile_patch',
				'method': 'patch',
				'path': '/auth/api/profile/',
				'token': 'csrf-matrix-customer-token',
				'data': {'first_name': 'Updated'},
			},
			{
				'name': 'order_create_web',
				'method': 'post',
				'path': '/order/orders/create/',
				'token': 'csrf-matrix-customer-token',
				'data': {},
			},
			{
				'name': 'product_create_web',
				'method': 'post',
				'path': '/product/products/create/',
				'token': 'csrf-matrix-vendor-token',
				'data': {},
			},
			{
				'name': 'product_update_web',
				'method': 'patch',
				'path': f'/product/products/{self.product.id}/update/',
				'token': 'csrf-matrix-vendor-token',
				'data': {'name': 'Blocked Without CSRF'},
			},
		]

		for case in cases:
			with self.subTest(endpoint=case['name']):
				client = self._cookie_client(case['token'])
				response = getattr(client, case['method'])(case['path'], case['data'], format='json')
				self.assertEqual(response.status_code, 403)

	def test_exempt_mobile_routes_allow_cookie_auth_without_csrf(self):
		cases = [
			{
				'name': 'customer_register_mobile',
				'method': 'post',
				'path': '/auth/customer/register/mobile/',
				'token': None,
				'data': {},
			},
			{
				'name': 'customer_login_mobile',
				'method': 'post',
				'path': '/auth/customer/login/mobile/',
				'token': None,
				'data': {},
			},
			{
				'name': 'customer_reset_mobile',
				'method': 'post',
				'path': '/auth/customer/password/reset/mobile/',
				'token': None,
				'data': {},
			},
			{
				'name': 'vendor_register_mobile',
				'method': 'post',
				'path': '/vendors/register/mobile/',
				'token': None,
				'data': {},
			},
			{
				'name': 'vendor_login_mobile',
				'method': 'post',
				'path': '/vendors/login/mobile/',
				'token': None,
				'data': {},
			},
			{
				'name': 'courier_register_mobile',
				'method': 'post',
				'path': '/couriers/register/mobile/',
				'token': None,
				'data': {},
			},
			{
				'name': 'courier_login_mobile',
				'method': 'post',
				'path': '/couriers/login/mobile/',
				'token': None,
				'data': {},
			},
			{
				'name': 'order_create_mobile',
				'method': 'post',
				'path': '/order/orders/create/mobile/',
				'token': 'csrf-matrix-customer-token',
				'data': {},
			},
			{
				'name': 'product_create_mobile',
				'method': 'post',
				'path': '/product/products/create/mobile/',
				'token': 'csrf-matrix-vendor-token',
				'data': {},
			},
			{
				'name': 'product_update_mobile',
				'method': 'patch',
				'path': f'/product/products/{self.product.id}/update/mobile/',
				'token': 'csrf-matrix-vendor-token',
				'data': {'name': 'Allowed Without CSRF'},
			},
		]

		for case in cases:
			with self.subTest(endpoint=case['name']):
				client = APIClient(enforce_csrf_checks=True)
				if case['token']:
					client.cookies['auth_session'] = case['token']
				response = getattr(client, case['method'])(case['path'], case['data'], format='json')
				self.assertNotEqual(
					response.status_code,
					403,
					msg=f"{case['name']} should bypass CSRF when routed through csrf_exempt",
				)
