from django.test import RequestFactory, SimpleTestCase, TestCase, override_settings
from django.urls import Resolver404, resolve

from authentication.models import CourierUser, CustomerUser, VendorUser
from authentication.serializers import CustomerLoginSerializer
from courier.serializers import CourierLoginSerializer
from vendor.serializers import VendorLoginSerializer


class UnversionedRootMountTests(SimpleTestCase):
	"""Auth endpoints are only reachable under /api/v1/."""

	def test_auth_routes_are_not_mounted_at_root(self):
		for path in ['/login/', '/me/', '/customer/login/', '/customer/register/', '/csrf/']:
			with self.subTest(path=path):
				with self.assertRaises(Resolver404):
					resolve(path)

	def test_auth_routes_resolve_under_v1(self):
		for path in ['/api/v1/auth/login/', '/api/v1/auth/me/', '/api/v1/auth/customer/login/']:
			with self.subTest(path=path):
				self.assertEqual(resolve(path).namespace, 'v1:auth')



class LegacyAliasRemovalTests(SimpleTestCase):
	"""Pre-versioning aliases are not part of the v1 contract."""

	def test_legacy_aliases_do_not_resolve(self):
		for path in [
			'/api/v1/order/legacy/create/',
			'/api/v1/dispatch/legacy/ready/',
			'/api/v1/messaging/legacy/send/',
			'/api/v1/product/upload/',
			'/api/v1/product/approve/',
		]:
			with self.subTest(path=path):
				with self.assertRaises(Resolver404):
					resolve(path)

	def test_canonical_routes_still_resolve(self):
		for path in [
			'/api/v1/order/create/',
			'/api/v1/dispatch/ready-orders/',
			'/api/v1/messaging/emails/',
			'/api/v1/product/create/',
			'/api/v1/product/temp-products/1/approve/',
		]:
			with self.subTest(path=path):
				resolve(path)

@override_settings(DEBUG=True)
class DevVerifyUrlTests(TestCase):
	"""Dev verification links must resolve via the versioned namespace."""

	def test_dev_verify_urls_point_at_v1(self):
		request = RequestFactory().get('/')
		cases = [
			(CustomerLoginSerializer, CustomerUser, 'customer'),
			(VendorLoginSerializer, VendorUser, 'vendor'),
			(CourierLoginSerializer, CourierUser, 'courier'),
		]
		for index, (serializer_class, model, role) in enumerate(cases):
			with self.subTest(role=role):
				user = model.objects.create(
					email=f'dev-verify-{role}@example.com',
					first_name='Dev',
					last_name='Verify',
					phone=f'0860000000{index}',
					role=role,
				)
				url = serializer_class(context={'request': request})._build_dev_verify_url(user)
				self.assertIn(f'/api/v1/auth/dev/verify-email/{role}/', url)
