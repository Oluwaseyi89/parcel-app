from unittest.mock import patch

from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import serializers
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.test import APIClient

from core.exceptions import api_exception_handler


class ApiExceptionHandlerTests(TestCase):
	def test_validation_error_has_message_and_field_errors(self):
		exc = serializers.ValidationError({'status': ['"bogus" is not a valid choice.'], 'notes': ['Too long.']})
		response = api_exception_handler(exc, {})

		self.assertEqual(response.status_code, 400)
		self.assertEqual(response.data['status'], 'error')
		self.assertEqual(response.data['message'], '"bogus" is not a valid choice.')
		self.assertEqual(set(response.data['errors']), {'status', 'notes'})

	def test_non_field_validation_error_list_is_wrapped(self):
		response = api_exception_handler(serializers.ValidationError(['Provide at least one field.']), {})

		self.assertEqual(response.data['errors'], {'non_field_errors': ['Provide at least one field.']})
		self.assertEqual(response.data['message'], 'Provide at least one field.')

	def test_other_api_exceptions_use_detail_as_message(self):
		for exc, code in [(NotFound(), 404), (PermissionDenied('Nope.'), 403)]:
			with self.subTest(code=code):
				response = api_exception_handler(exc, {})
				self.assertEqual(response.status_code, code)
				self.assertEqual(response.data['status'], 'error')
				self.assertNotIn('errors', response.data)
				self.assertNotIn('detail', response.data)

	def test_unhandled_exception_returns_generic_500(self):
		with self.assertLogs('core.exceptions', level='ERROR'):
			response = api_exception_handler(RuntimeError('db password leaked'), {})

		self.assertEqual(response.status_code, 500)
		self.assertEqual(response.data, {'status': 'error', 'message': 'An unexpected error occurred.'})

	@override_settings(DEBUG=True)
	def test_unhandled_exception_defers_to_django_in_debug(self):
		self.assertIsNone(api_exception_handler(RuntimeError('boom'), {}))

	def test_unauthenticated_request_uses_standard_envelope(self):
		response = APIClient().get(reverse('v1:auth:session_me'))

		self.assertIn(response.status_code, {401, 403})
		self.assertEqual(response.data['status'], 'error')
		self.assertTrue(response.data['message'])

	def test_view_exception_becomes_json_500(self):
		with patch('product.views.ProductService.search_products', side_effect=RuntimeError('boom')):
			with self.assertLogs('core.exceptions', level='ERROR'):
				response = APIClient().get(reverse('v1:product:product_list'))

		self.assertEqual(response.status_code, 500)
		self.assertEqual(response.data['status'], 'error')
