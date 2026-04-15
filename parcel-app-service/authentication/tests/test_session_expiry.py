from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from authentication.models import AdminUser, CourierUser, CustomerUser, UserSession, VendorUser


class SessionExpiryTests(TestCase):
	"""Expired sessions are denied at the authentication layer."""

	def setUp(self):
		self.client = APIClient()
		self.customer = CustomerUser.objects.create(
			email='expiry-customer@example.com',
			first_name='Expiry',
			last_name='Customer',
			phone='08200000001',
			role='customer',
			is_email_verified=True,
		)
		self.customer.set_password('StrongPassword123')
		self.customer.save()
		self.ct = ContentType.objects.get_for_model(self.customer)

	def _create_session(self, token, expires_delta):
		return UserSession.objects.create(
			content_type=self.ct,
			object_id=self.customer.id,
			session_token=token,
			expires_at=timezone.now() + expires_delta,
		)

	def test_expired_session_denied_via_header(self):
		self._create_session('expired-header-token', -timedelta(minutes=1))
		self.client.credentials(HTTP_X_SESSION_TOKEN='expired-header-token')

		response = self.client.get('/auth/me/')

		self.assertIn(response.status_code, {401, 403})

	def test_expired_session_denied_via_cookie(self):
		self._create_session('expired-cookie-token', -timedelta(minutes=1))
		self.client.cookies['auth_session'] = 'expired-cookie-token'

		response = self.client.get('/auth/me/')

		self.assertIn(response.status_code, {401, 403})

	def test_expired_session_is_auto_invalidated(self):
		session = self._create_session('expired-auto-token', -timedelta(minutes=1))
		self.assertTrue(session.is_active)

		self.client.credentials(HTTP_X_SESSION_TOKEN='expired-auto-token')
		self.client.get('/auth/me/')

		session.refresh_from_db()
		self.assertFalse(session.is_active)

	def test_active_session_allowed(self):
		self._create_session('valid-token', timedelta(hours=1))
		self.client.credentials(HTTP_X_SESSION_TOKEN='valid-token')

		response = self.client.get('/auth/me/')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['data']['user']['email'], self.customer.email)

	def test_just_expired_session_denied(self):
		"""Session that expired 1 second ago is still rejected."""
		self._create_session('just-expired-token', -timedelta(seconds=1))
		self.client.credentials(HTTP_X_SESSION_TOKEN='just-expired-token')

		response = self.client.get('/auth/me/')

		self.assertIn(response.status_code, {401, 403})

	def test_expired_session_on_multiple_user_types(self):
		"""Expiry enforcement applies uniformly across all user types."""
		vendor = VendorUser.objects.create(
			email='expiry-vendor@example.com',
			first_name='Expiry',
			last_name='Vendor',
			phone='08200000002',
			role='vendor',
			is_email_verified=True,
			is_approved=True,
		)
		vendor.set_password('StrongPassword123')
		vendor.save()

		courier = CourierUser.objects.create(
			email='expiry-courier@example.com',
			first_name='Expiry',
			last_name='Courier',
			phone='08200000003',
			role='courier',
			is_email_verified=True,
			is_approved=True,
		)
		courier.set_password('StrongPassword123')
		courier.save()

		admin = AdminUser.objects.create(
			email='expiry-admin@example.com',
			first_name='Expiry',
			last_name='Admin',
			role='admin',
			is_email_verified=True,
		)
		admin.set_password('StrongPassword123')
		admin.save()

		for label, user in [('vendor', vendor), ('courier', courier), ('admin', admin)]:
			with self.subTest(user_type=label):
				ct = ContentType.objects.get_for_model(user)
				UserSession.objects.create(
					content_type=ct,
					object_id=user.id,
					session_token=f'expired-{label}-token',
					expires_at=timezone.now() - timedelta(minutes=5),
				)
				client = APIClient()
				client.credentials(HTTP_X_SESSION_TOKEN=f'expired-{label}-token')

				response = client.get('/auth/me/')

				self.assertIn(response.status_code, {401, 403})


class LogoutInvalidationTests(TestCase):
	"""Logout marks session inactive and clears cookies."""

	def setUp(self):
		self.client = APIClient()
		self.customer = CustomerUser.objects.create(
			email='logout-customer@example.com',
			first_name='Logout',
			last_name='Customer',
			phone='08200001001',
			role='customer',
			is_email_verified=True,
		)
		self.customer.set_password('StrongPassword123')
		self.customer.save()
		self.ct = ContentType.objects.get_for_model(self.customer)

	def _login(self):
		response = self.client.post(
			'/auth/customer/login/',
			{'email': self.customer.email, 'password': 'StrongPassword123'},
			format='json',
		)
		self.assertEqual(response.status_code, 200)
		return response

	def _issue_csrf_token(self):
		response = self.client.get('/auth/csrf/')
		self.assertEqual(response.status_code, 200)
		return response.data['data']['csrf_token']

	def test_logout_marks_session_inactive(self):
		self._login()
		session = UserSession.objects.get(
			content_type=self.ct,
			object_id=self.customer.id,
			is_active=True,
		)
		self.assertTrue(session.is_active)

		csrf = self._issue_csrf_token()
		logout = self.client.post('/auth/api/logout/', {}, format='json', HTTP_X_CSRFTOKEN=csrf)
		self.assertEqual(logout.status_code, 200)

		session.refresh_from_db()
		self.assertFalse(session.is_active)

	def test_logout_clears_auth_session_cookie(self):
		self._login()

		csrf = self._issue_csrf_token()
		logout = self.client.post('/auth/api/logout/', {}, format='json', HTTP_X_CSRFTOKEN=csrf)

		self.assertIn('auth_session', logout.cookies)
		self.assertEqual(logout.cookies['auth_session']['max-age'], 0)

	def test_logout_clears_role_marker_cookie(self):
		self._login()

		csrf = self._issue_csrf_token()
		logout = self.client.post('/auth/api/logout/', {}, format='json', HTTP_X_CSRFTOKEN=csrf)

		self.assertIn('logcus', logout.cookies)
		self.assertEqual(logout.cookies['logcus']['max-age'], 0)

	def test_me_returns_unauthorized_after_logout(self):
		self._login()

		csrf = self._issue_csrf_token()
		self.client.post('/auth/api/logout/', {}, format='json', HTTP_X_CSRFTOKEN=csrf)

		me = self.client.get('/auth/me/')
		self.assertIn(me.status_code, {401, 403})

	def test_reusing_invalidated_session_token_is_denied(self):
		self._login()
		session = UserSession.objects.get(
			content_type=self.ct,
			object_id=self.customer.id,
			is_active=True,
		)
		token = session.session_token

		csrf = self._issue_csrf_token()
		self.client.post('/auth/api/logout/', {}, format='json', HTTP_X_CSRFTOKEN=csrf)

		# Build a fresh client with the old token as header — must be denied
		fresh_client = APIClient()
		fresh_client.credentials(HTTP_X_SESSION_TOKEN=token)
		me = fresh_client.get('/auth/me/')
		self.assertIn(me.status_code, {401, 403})

	def test_logout_via_header_auth_marks_session_inactive(self):
		"""Logout using X-Session-Token header (no cookie) also invalidates."""
		session = UserSession.objects.create(
			content_type=self.ct,
			object_id=self.customer.id,
			session_token='header-logout-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)

		client = APIClient()
		client.credentials(HTTP_X_SESSION_TOKEN='header-logout-token')

		logout = client.post('/auth/api/logout/', {}, format='json')
		self.assertEqual(logout.status_code, 200)

		session.refresh_from_db()
		self.assertFalse(session.is_active)

	def test_double_logout_is_idempotent(self):
		"""Logging out twice doesn't error — second returns 401/403."""
		self._login()

		csrf = self._issue_csrf_token()
		first_logout = self.client.post('/auth/api/logout/', {}, format='json', HTTP_X_CSRFTOKEN=csrf)
		self.assertEqual(first_logout.status_code, 200)

		second_logout = self.client.post('/auth/api/logout/', {}, format='json')
		self.assertIn(second_logout.status_code, {401, 403})

	def test_logout_does_not_affect_other_active_sessions(self):
		"""Logging out one session leaves other sessions for the same user intact."""
		session_a = UserSession.objects.create(
			content_type=self.ct,
			object_id=self.customer.id,
			session_token='session-a-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)
		session_b = UserSession.objects.create(
			content_type=self.ct,
			object_id=self.customer.id,
			session_token='session-b-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)

		client_a = APIClient()
		client_a.credentials(HTTP_X_SESSION_TOKEN='session-a-token')
		logout = client_a.post('/auth/api/logout/', {}, format='json')
		self.assertEqual(logout.status_code, 200)

		session_a.refresh_from_db()
		self.assertFalse(session_a.is_active)

		session_b.refresh_from_db()
		self.assertTrue(session_b.is_active)

		client_b = APIClient()
		client_b.credentials(HTTP_X_SESSION_TOKEN='session-b-token')
		me = client_b.get('/auth/me/')
		self.assertEqual(me.status_code, 200)


class SessionModelTests(TestCase):
	"""Unit tests for UserSession model methods."""

	def setUp(self):
		self.customer = CustomerUser.objects.create(
			email='model-customer@example.com',
			first_name='Model',
			last_name='Customer',
			phone='08200002001',
			role='customer',
			is_email_verified=True,
		)
		self.ct = ContentType.objects.get_for_model(self.customer)

	def test_is_expired_returns_true_for_past_expiry(self):
		session = UserSession.objects.create(
			content_type=self.ct,
			object_id=self.customer.id,
			session_token='model-expired-token',
			expires_at=timezone.now() - timedelta(minutes=1),
		)
		self.assertTrue(session.is_expired())

	def test_is_expired_returns_false_for_future_expiry(self):
		session = UserSession.objects.create(
			content_type=self.ct,
			object_id=self.customer.id,
			session_token='model-valid-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)
		self.assertFalse(session.is_expired())

	def test_invalidate_sets_is_active_false(self):
		session = UserSession.objects.create(
			content_type=self.ct,
			object_id=self.customer.id,
			session_token='model-invalidate-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)
		self.assertTrue(session.is_active)

		session.invalidate()

		session.refresh_from_db()
		self.assertFalse(session.is_active)

	def test_new_session_defaults_to_active(self):
		session = UserSession.objects.create(
			content_type=self.ct,
			object_id=self.customer.id,
			session_token='model-default-token',
			expires_at=timezone.now() + timedelta(hours=1),
		)
		self.assertTrue(session.is_active)

	def test_inactive_session_token_not_resolved_by_auth(self):
		"""is_active=False sessions are not returned by the auth query."""
		UserSession.objects.create(
			content_type=self.ct,
			object_id=self.customer.id,
			session_token='model-inactive-token',
			expires_at=timezone.now() + timedelta(hours=1),
			is_active=False,
		)

		client = APIClient()
		client.credentials(HTTP_X_SESSION_TOKEN='model-inactive-token')
		response = client.get('/auth/me/')
		self.assertIn(response.status_code, {401, 403})
