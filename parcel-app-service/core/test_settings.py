import os
import runpy
from pathlib import Path
from unittest.mock import patch

from django.conf import settings
from django.test import Client, SimpleTestCase, override_settings

SETTINGS_PATH = Path(settings.BASE_DIR) / 'parcel_app' / 'settings.py'

S3_ENV = {
	'USE_S3': 'True',
	'AWS_STORAGE_BUCKET_NAME': 'parcel-media',
	'AWS_S3_REGION_NAME': 'eu-west-2',
	'S3_MEDIA_PUBLIC': 'False',
	'AWS_QUERYSTRING_AUTH': 'True',
}


def load_settings(**env):
	"""Execute settings.py against exactly `env`, ignoring the developer's .env file."""
	base = {'DJANGO_SECRET_KEY': 'test-secret', 'DJANGO_DEBUG': 'True'}
	with patch.dict(os.environ, {**base, **env}, clear=True), patch('dotenv.load_dotenv'):
		return runpy.run_path(str(SETTINGS_PATH))


class StaticFilesSettingsTests(SimpleTestCase):
	def test_whitenoise_runs_right_after_security_middleware(self):
		middleware = load_settings()['MIDDLEWARE']

		self.assertEqual(middleware[0], 'django.middleware.security.SecurityMiddleware')
		self.assertEqual(middleware[1], 'whitenoise.middleware.WhiteNoiseMiddleware')

	def test_static_root_set_and_no_missing_staticfiles_dir(self):
		config = load_settings()

		self.assertTrue(config['STATIC_ROOT'].endswith('staticfiles'))
		self.assertNotIn('STATICFILES_DIRS', config)
		self.assertNotIn('flower', config['INSTALLED_APPS'])

	def test_manifest_storage_only_outside_debug(self):
		debug = load_settings(DJANGO_DEBUG='True')
		production = load_settings(DJANGO_DEBUG='False', **S3_ENV)

		self.assertEqual(debug['STORAGES']['staticfiles']['BACKEND'],
						 'django.contrib.staticfiles.storage.StaticFilesStorage')
		self.assertEqual(production['STORAGES']['staticfiles']['BACKEND'],
						 'whitenoise.storage.CompressedManifestStaticFilesStorage')
		self.assertEqual(debug['STORAGES']['default']['BACKEND'], 'django.core.files.storage.FileSystemStorage')

	@override_settings(WHITENOISE_USE_FINDERS=True, WHITENOISE_AUTOREFRESH=True)
	def test_whitenoise_serves_admin_static_files(self):
		# A fresh client builds the middleware chain under the overridden settings.
		response = Client().get('/static/admin/css/base.css')

		self.assertEqual(response.status_code, 200)


class MediaStorageSettingsTests(SimpleTestCase):
	def test_production_without_s3_refuses_to_start(self):
		with self.assertRaisesMessage(ValueError, 'USE_S3 must be True'):
			load_settings(DJANGO_DEBUG='False', USE_S3='False')

	def test_production_with_s3_starts(self):
		config = load_settings(DJANGO_DEBUG='False', **S3_ENV)

		self.assertEqual(config['STORAGES']['default']['BACKEND'], 'storages.backends.s3boto3.S3Boto3Storage')

	def test_aws_derives_amazonaws_domain_with_virtual_addressing(self):
		config = load_settings(**S3_ENV)

		self.assertEqual(config['AWS_S3_CUSTOM_DOMAIN'], 'parcel-media.s3.eu-west-2.amazonaws.com')
		self.assertEqual(config['AWS_S3_ADDRESSING_STYLE'], 'virtual')
		self.assertEqual(config['MEDIA_URL'], 'https://parcel-media.s3.eu-west-2.amazonaws.com/media/')

	def test_custom_endpoint_skips_amazonaws_domain_and_uses_path_style(self):
		config = load_settings(AWS_S3_ENDPOINT_URL='https://abcd.supabase.co/storage/v1/s3/', **S3_ENV)

		self.assertIsNone(config['AWS_S3_CUSTOM_DOMAIN'])
		self.assertEqual(config['AWS_S3_ADDRESSING_STYLE'], 'path')
		self.assertEqual(config['MEDIA_URL'], 'https://abcd.supabase.co/storage/v1/s3/parcel-media/media/')

	def test_explicit_custom_domain_and_addressing_style_win(self):
		config = load_settings(
			AWS_S3_ENDPOINT_URL='https://abcd.supabase.co/storage/v1/s3',
			AWS_S3_CUSTOM_DOMAIN='cdn.example.com',
			AWS_S3_ADDRESSING_STYLE='virtual',
			**S3_ENV,
		)

		self.assertEqual(config['AWS_S3_CUSTOM_DOMAIN'], 'cdn.example.com')
		self.assertEqual(config['AWS_S3_ADDRESSING_STYLE'], 'virtual')
		self.assertEqual(config['MEDIA_URL'], 'https://cdn.example.com/media/')


class EmailSettingsTests(SimpleTestCase):
	def test_console_backend_without_smtp_host(self):
		config = load_settings()

		self.assertEqual(config['EMAIL_BACKEND'], 'django.core.mail.backends.console.EmailBackend')
		self.assertEqual(config['DEFAULT_FROM_EMAIL'], 'webmaster@localhost')
		self.assertNotIn('EMAIL_FILE_PATH', config)

	def test_smtp_backend_reads_connection_settings(self):
		config = load_settings(
			EMAIL_HOST='smtp.mailprovider.com',
			EMAIL_PORT='465',
			EMAIL_HOST_USER='mailer@parcel.app',
			EMAIL_HOST_PASSWORD='secret',
			EMAIL_USE_TLS='False',
			EMAIL_USE_SSL='True',
			DEFAULT_FROM_EMAIL='Parcel <no-reply@parcel.app>',
		)

		self.assertEqual(config['EMAIL_BACKEND'], 'django.core.mail.backends.smtp.EmailBackend')
		self.assertEqual(config['EMAIL_HOST'], 'smtp.mailprovider.com')
		self.assertEqual(config['EMAIL_PORT'], 465)
		self.assertFalse(config['EMAIL_USE_TLS'])
		self.assertTrue(config['EMAIL_USE_SSL'])
		self.assertEqual(config['DEFAULT_FROM_EMAIL'], 'Parcel <no-reply@parcel.app>')
		self.assertEqual(config['SERVER_EMAIL'], 'Parcel <no-reply@parcel.app>')

	def test_from_address_falls_back_to_smtp_user(self):
		config = load_settings(EMAIL_HOST='smtp.mailprovider.com', EMAIL_HOST_USER='mailer@parcel.app')

		self.assertEqual(config['DEFAULT_FROM_EMAIL'], 'mailer@parcel.app')

	def test_explicit_backend_overrides_choice(self):
		config = load_settings(EMAIL_HOST='smtp.mailprovider.com',
							   EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')

		self.assertEqual(config['EMAIL_BACKEND'], 'django.core.mail.backends.locmem.EmailBackend')

	def test_tls_and_ssl_together_are_rejected(self):
		with self.assertRaisesMessage(ValueError, 'mutually exclusive'):
			load_settings(EMAIL_USE_TLS='True', EMAIL_USE_SSL='True')
