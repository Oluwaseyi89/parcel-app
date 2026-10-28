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
