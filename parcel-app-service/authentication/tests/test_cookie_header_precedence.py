from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from authentication.drf_auth import SessionTokenAuthentication
from authentication.models import CustomerUser, UserSession


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
