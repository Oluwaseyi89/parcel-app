from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import inspect
from datetime import timedelta
from rest_framework.test import APIClient

from authentication.drf_auth import SessionTokenAuthentication
from authentication.models import AdminUser, CourierUser, CustomerUser, UserSession, VendorUser


class SessionTokenAuthenticationTests(TestCase):
	def test_authenticates_admin_with_session_token_header(self):
		admin = AdminUser.objects.create(
			email='admin@example.com',
			first_name='System',
			last_name='Admin',
			role='admin'
		)
		admin.set_password('StrongPassword123')
		admin.save()

		content_type = ContentType.objects.get_for_model(admin)
		session = UserSession.objects.create(
			content_type=content_type,
			object_id=admin.id,
			session_token='session-token-123',
			expires_at=timezone.now() + timedelta(hours=1)
		)

		class RequestStub:
			def __init__(self):
				self.headers = {'X-Session-Token': session.session_token}
				self.COOKIES = {}
				self.META = {}

		request = RequestStub()
		auth = SessionTokenAuthentication()
		user, auth_session = auth.authenticate(request)

		self.assertEqual(user.id, admin.id)
		self.assertEqual(auth_session.id, session.id)


class AdminCustomerEndpointTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.admin = AdminUser.objects.create(
			email='admin@example.com',
			first_name='Admin',
			last_name='User',
			role='admin',
			is_email_verified=True,
		)
		self.admin.set_password('StrongPassword123')
		self.admin.save()

		self.customer = CustomerUser.objects.create(
			email='customer@example.com',
			first_name='Jane',
			last_name='Doe',
			role='customer',
			is_email_verified=True,
		)
		self.customer.set_password('StrongPassword123')
		self.customer.save()

	def _authenticate(self, user, token):
		content_type = ContentType.objects.get_for_model(user)
		UserSession.objects.create(
			content_type=content_type,
			object_id=user.id,
			session_token=token,
			expires_at=timezone.now() + timedelta(hours=1)
		)
		self.client.credentials(HTTP_X_SESSION_TOKEN=token)

	def test_admin_can_list_customers(self):
		self._authenticate(self.admin, 'admin-token')
		response = self.client.get('/auth/api/customers/')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['status'], 'success')
		self.assertEqual(len(response.data['data']), 1)

	def test_customer_cannot_list_customers(self):
		self._authenticate(self.customer, 'customer-token')
		response = self.client.get('/auth/api/customers/')

		self.assertEqual(response.status_code, 403)


class SessionContractTests(TestCase):
	def setUp(self):
		self.client = APIClient()

	def test_customer_login_sets_cookie_session_contract(self):
		customer = CustomerUser.objects.create(
			email='customer-login@example.com',
			first_name='Customer',
			last_name='Login',
			phone='08000000001',
			role='customer',
			is_email_verified=True,
		)
		customer.set_password('StrongPassword123')
		customer.save()

		response = self.client.post(
			'/auth/customer/login/',
			{'email': customer.email, 'password': 'StrongPassword123'},
			format='json',
		)

		self.assertEqual(response.status_code, 200)
		self.assertIn('auth_session', response.cookies)
		self.assertIn('logcus', response.cookies)
		self.assertEqual(response.cookies['logcus'].value, '1')

	def test_vendor_login_sets_cookie_session_contract(self):
		vendor = VendorUser.objects.create(
			email='vendor-login@example.com',
			first_name='Vendor',
			last_name='Login',
			phone='08000000002',
			role='vendor',
			is_email_verified=True,
			is_approved=True,
		)
		vendor.set_password('StrongPassword123')
		vendor.save()

		response = self.client.post(
			'/vendors/login/',
			{'email': vendor.email, 'password': 'StrongPassword123'},
			format='json',
		)

		self.assertEqual(response.status_code, 200)
		self.assertIn('auth_session', response.cookies)
		self.assertIn('logvend', response.cookies)
		self.assertEqual(response.cookies['logvend'].value, '1')

	def test_courier_login_sets_cookie_session_contract(self):
		courier = CourierUser.objects.create(
			email='courier-login@example.com',
			first_name='Courier',
			last_name='Login',
			phone='08000000003',
			role='courier',
			is_email_verified=True,
			is_approved=True,
		)
		courier.set_password('StrongPassword123')
		courier.save()

		response = self.client.post(
			'/couriers/login/',
			{'email': courier.email, 'password': 'StrongPassword123'},
			format='json',
		)

		self.assertEqual(response.status_code, 200)
		self.assertIn('auth_session', response.cookies)
		self.assertIn('logcour', response.cookies)
		self.assertEqual(response.cookies['logcour'].value, '1')

	def test_me_endpoint_returns_identity_from_cookie_session(self):
		customer = CustomerUser.objects.create(
			email='me-customer@example.com',
			first_name='Me',
			last_name='Customer',
			phone='08000000004',
			role='customer',
			is_email_verified=True,
		)
		customer.set_password('StrongPassword123')
		customer.save()

		content_type = ContentType.objects.get_for_model(customer)
		UserSession.objects.create(
			content_type=content_type,
			object_id=customer.id,
			session_token='cookie-session-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)

		self.client.cookies['auth_session'] = 'cookie-session-token'
		response = self.client.get('/auth/me/')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['status'], 'success')
		self.assertEqual(response.data['data']['active_role'], 'customer')
		self.assertEqual(response.data['data']['allowed_roles'], ['customer'])
		self.assertEqual(response.data['data']['user']['email'], customer.email)


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


class ActiveRoleSwitchTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.shared_email = 'multi-role@example.com'

		self.vendor = VendorUser.objects.create(
			email=self.shared_email,
			first_name='Multi',
			last_name='Vendor',
			phone='08000000991',
			role='vendor',
			is_active=True,
			is_email_verified=True,
			is_approved=True,
		)
		self.vendor.set_password('StrongPassword123')
		self.vendor.save()

		self.courier = CourierUser.objects.create(
			email=self.shared_email,
			first_name='Multi',
			last_name='Courier',
			phone='08000000992',
			role='courier',
			is_active=True,
			is_email_verified=True,
			is_approved=True,
		)
		self.courier.set_password('StrongPassword123')
		self.courier.save()

		content_type = ContentType.objects.get_for_model(self.vendor)
		self.session = UserSession.objects.create(
			content_type=content_type,
			object_id=self.vendor.id,
			session_token='multi-role-session-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)

		self.client.credentials(HTTP_X_SESSION_TOKEN='multi-role-session-token')

	def test_me_returns_all_available_roles_for_same_email(self):
		response = self.client.get('/auth/me/')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['data']['active_role'], 'vendor')
		self.assertIn('vendor', response.data['data']['allowed_roles'])
		self.assertIn('courier', response.data['data']['allowed_roles'])

	def test_switch_role_updates_active_session_user(self):
		response = self.client.post('/auth/switch-role/', {'role': 'courier'}, format='json')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['data']['active_role'], 'courier')
		self.assertIn('courier', response.data['data']['allowed_roles'])
		self.assertIn('vendor', response.data['data']['allowed_roles'])
		self.assertIn('logcour', response.cookies)

		self.session.refresh_from_db()
		self.assertEqual(self.session.object_id, self.courier.id)

		me_response = self.client.get('/auth/me/')
		self.assertEqual(me_response.status_code, 200)
		self.assertEqual(me_response.data['data']['active_role'], 'courier')

	def test_switch_role_rejects_unavailable_role(self):
		response = self.client.post('/auth/switch-role/', {'role': 'customer'}, format='json')

		self.assertEqual(response.status_code, 403)


class CookieVsHeaderPrecedenceTests(TestCase):
	"""
	P0: Cookie session vs header token precedence and fallback.

	Verifies deterministic auth-source selection when multiple credential
	carriers are present simultaneously on the same request.

	Precedence (highest → lowest):
	    1. Authorization header  (Token / Bearer / Session prefix, or raw)
	    2. X-Session-Token header
	    3. Cookie  (auth_session → admin_session → session_token)

	No fallback: an invalid/expired token in a higher-priority slot raises
	AuthenticationFailed immediately; lower-priority slots are never consulted.
	"""

	def setUp(self):
		self.customer_a = CustomerUser.objects.create(
			email='prec-a@example.com',
			first_name='Prec',
			last_name='Alpha',
			phone='08100000001',
			role='customer',
			is_email_verified=True,
		)
		self.customer_a.set_password('StrongPassword123')
		self.customer_a.save()

		self.customer_b = CustomerUser.objects.create(
			email='prec-b@example.com',
			first_name='Prec',
			last_name='Beta',
			phone='08100000002',
			role='customer',
			is_email_verified=True,
		)
		self.customer_b.set_password('StrongPassword123')
		self.customer_b.save()

		ct = ContentType.objects.get_for_model(CustomerUser)
		self.session_a = UserSession.objects.create(
			content_type=ct,
			object_id=self.customer_a.id,
			session_token='prec-token-alpha',
			expires_at=timezone.now() + timedelta(hours=1),
		)
		self.session_b = UserSession.objects.create(
			content_type=ct,
			object_id=self.customer_b.id,
			session_token='prec-token-beta',
			expires_at=timezone.now() + timedelta(hours=1),
		)
		self.session_expired = UserSession.objects.create(
			content_type=ct,
			object_id=self.customer_a.id,
			session_token='prec-token-expired',
			expires_at=timezone.now() - timedelta(minutes=1),
		)

		self.auth = SessionTokenAuthentication()

	# ── _stub helper ─────────────────────────────────────────────────

	def _stub(self, x_session_token=None, cookies=None, authorization=None):
		"""Build a minimal request stub for _extract_session_token unit tests."""
		class RequestStub:
			def __init__(self, headers, COOKIES, META):
				self.headers = headers
				self.COOKIES = COOKIES
				self.META = META

		headers = {}
		if x_session_token:
			headers['X-Session-Token'] = x_session_token
		meta = {}
		if authorization:
			# DRF's get_authorization_header reads META['HTTP_AUTHORIZATION']
			meta['HTTP_AUTHORIZATION'] = (
				authorization.encode('utf-8')
				if isinstance(authorization, str)
				else authorization
			)
		return RequestStub(headers=headers, COOKIES=cookies or {}, META=meta)

	# ── _extract_session_token unit tests ────────────────────────────

	def test_extract_returns_none_when_no_credentials(self):
		"""No header and no cookie → (None, None)."""
		token, source = self.auth._extract_session_token(self._stub())
		self.assertIsNone(token)
		self.assertIsNone(source)

	def test_extract_reads_x_session_token_header(self):
		token, source = self.auth._extract_session_token(
			self._stub(x_session_token='prec-token-alpha')
		)
		self.assertEqual(token, 'prec-token-alpha')
		self.assertEqual(source, 'header')

	def test_extract_reads_cookie_auth_session(self):
		token, source = self.auth._extract_session_token(
			self._stub(cookies={'auth_session': 'prec-token-alpha'})
		)
		self.assertEqual(token, 'prec-token-alpha')
		self.assertEqual(source, 'cookie')

	def test_extract_reads_cookie_admin_session(self):
		token, source = self.auth._extract_session_token(
			self._stub(cookies={'admin_session': 'prec-token-alpha'})
		)
		self.assertEqual(token, 'prec-token-alpha')
		self.assertEqual(source, 'cookie')

	def test_extract_reads_cookie_session_token_fallback(self):
		token, source = self.auth._extract_session_token(
			self._stub(cookies={'session_token': 'prec-token-alpha'})
		)
		self.assertEqual(token, 'prec-token-alpha')
		self.assertEqual(source, 'cookie')

	def test_extract_header_beats_cookie(self):
		"""X-Session-Token header takes precedence over auth_session cookie."""
		token, source = self.auth._extract_session_token(
			self._stub(
				x_session_token='prec-token-beta',
				cookies={'auth_session': 'prec-token-alpha'},
			)
		)
		self.assertEqual(token, 'prec-token-beta')
		self.assertEqual(source, 'header')

	def test_extract_authorization_header_beats_x_session_token(self):
		"""Authorization: Token … takes precedence over X-Session-Token."""
		token, source = self.auth._extract_session_token(
			self._stub(
				authorization='Token prec-token-beta',
				x_session_token='prec-token-alpha',
			)
		)
		self.assertEqual(token, 'prec-token-beta')
		self.assertEqual(source, 'header')

	def test_extract_authorization_header_beats_cookie(self):
		"""Authorization: Token … takes precedence over auth_session cookie."""
		token, source = self.auth._extract_session_token(
			self._stub(
				authorization='Token prec-token-beta',
				cookies={'auth_session': 'prec-token-alpha'},
			)
		)
		self.assertEqual(token, 'prec-token-beta')
		self.assertEqual(source, 'header')

	def test_extract_bearer_prefix_normalised(self):
		token, source = self.auth._extract_session_token(
			self._stub(authorization='Bearer prec-token-alpha')
		)
		self.assertEqual(token, 'prec-token-alpha')
		self.assertEqual(source, 'header')

	def test_extract_session_prefix_normalised(self):
		token, source = self.auth._extract_session_token(
			self._stub(authorization='Session prec-token-alpha')
		)
		self.assertEqual(token, 'prec-token-alpha')
		self.assertEqual(source, 'header')

	def test_extract_raw_authorization_header_no_prefix(self):
		"""Single-part Authorization header (no prefix) is accepted."""
		token, source = self.auth._extract_session_token(
			self._stub(authorization='prec-token-alpha')
		)
		self.assertEqual(token, 'prec-token-alpha')
		self.assertEqual(source, 'header')

	def test_extract_cookie_sub_precedence_auth_session_over_admin_session(self):
		"""auth_session beats admin_session when both cookies are present."""
		token, source = self.auth._extract_session_token(
			self._stub(cookies={
				'auth_session': 'prec-token-alpha',
				'admin_session': 'prec-token-beta',
			})
		)
		self.assertEqual(token, 'prec-token-alpha')
		self.assertEqual(source, 'cookie')

	def test_extract_cookie_sub_precedence_admin_session_over_session_token(self):
		"""admin_session beats session_token when both cookies are present."""
		token, source = self.auth._extract_session_token(
			self._stub(cookies={
				'admin_session': 'prec-token-alpha',
				'session_token': 'prec-token-beta',
			})
		)
		self.assertEqual(token, 'prec-token-alpha')
		self.assertEqual(source, 'cookie')

	# ── Full authenticate() resolution via API ───────────────────────

	def test_header_user_resolved_when_both_header_and_cookie_present(self):
		"""Header token (user B) wins over cookie token (user A) — /auth/me/ returns B."""
		client = APIClient()
		client.cookies['auth_session'] = 'prec-token-alpha'      # user A in cookie
		client.credentials(HTTP_X_SESSION_TOKEN='prec-token-beta')  # user B in header

		response = client.get('/auth/me/')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['data']['user']['email'], self.customer_b.email)

	def test_cookie_user_resolved_when_no_header_present(self):
		"""When only cookie is present, cookie user is authenticated."""
		client = APIClient()
		client.cookies['auth_session'] = 'prec-token-alpha'

		response = client.get('/auth/me/')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['data']['user']['email'], self.customer_a.email)

	def test_invalid_header_token_does_not_fall_back_to_valid_cookie(self):
		"""Invalid X-Session-Token yields 401/403 even when a valid cookie is also present."""
		client = APIClient()
		client.cookies['auth_session'] = 'prec-token-alpha'   # valid
		client.credentials(HTTP_X_SESSION_TOKEN='no-such-token')  # invalid

		response = client.get('/auth/me/')

		self.assertIn(response.status_code, {401, 403})

	def test_expired_header_token_does_not_fall_back_to_valid_cookie(self):
		"""Expired X-Session-Token yields 401/403 even when a valid cookie is also present."""
		client = APIClient()
		client.cookies['auth_session'] = 'prec-token-alpha'        # valid
		client.credentials(HTTP_X_SESSION_TOKEN='prec-token-expired')  # expired

		response = client.get('/auth/me/')

		self.assertIn(response.status_code, {401, 403})

	def test_no_credentials_denied_on_protected_endpoint(self):
		response = APIClient().get('/auth/me/')
		self.assertIn(response.status_code, {401, 403})

	# ── CSRF source-binding tests ─────────────────────────────────────

	def test_header_auth_unsafe_method_does_not_require_csrf(self):
		"""Header-authenticated POST bypasses the cookie-triggered CSRF check."""
		client = APIClient(enforce_csrf_checks=True)
		client.credentials(HTTP_X_SESSION_TOKEN='prec-token-alpha')

		response = client.post('/auth/api/logout/', {}, format='json')

		# Source is 'header' → enforce_csrf() is never called → not a 403
		self.assertNotEqual(response.status_code, 403)

	def test_cookie_auth_unsafe_method_requires_csrf(self):
		"""Cookie-authenticated POST without a CSRF token yields 403."""
		client = APIClient(enforce_csrf_checks=True)
		client.cookies['auth_session'] = 'prec-token-alpha'

		response = client.post('/auth/api/logout/', {}, format='json')

		self.assertEqual(response.status_code, 403)

	def test_when_both_present_header_wins_and_csrf_not_enforced(self):
		"""
		Both header and cookie present on the same request → header wins (source='header'),
		so CSRF check is skipped even for an unsafe method without a CSRF token.
		"""
		client = APIClient(enforce_csrf_checks=True)
		client.cookies['auth_session'] = 'prec-token-alpha'         # cookie source
		client.credentials(HTTP_X_SESSION_TOKEN='prec-token-alpha')  # header source (same user)

		response = client.post('/auth/api/logout/', {}, format='json')

		# Header wins → source='header' → no CSRF enforcement → not 403
		self.assertNotEqual(response.status_code, 403)


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
