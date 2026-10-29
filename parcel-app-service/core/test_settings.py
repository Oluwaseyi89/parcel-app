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

PRODUCTION_ENV = {
	'DJANGO_DEBUG': 'False',
	'DATABASE_URL': 'postgres://parcel:secret@pooler.supabase.com:5432/postgres',
	'FRONTEND_URL': 'https://parcel-app-web.vercel.app',
	**S3_ENV,
}


def load_settings(**env):
	"""Execute settings.py against exactly `env`, ignoring the developer's .env file.

	A value of None removes that variable from the environment.
	"""
	merged = {'DJANGO_SECRET_KEY': 'test-secret', 'DJANGO_DEBUG': 'True', **env}
	merged = {key: value for key, value in merged.items() if value is not None}
	with patch.dict(os.environ, merged, clear=True), patch('dotenv.load_dotenv'):
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
		production = load_settings(**PRODUCTION_ENV)

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
			load_settings(**{**PRODUCTION_ENV, 'USE_S3': 'False'})

	def test_production_with_s3_starts(self):
		config = load_settings(**PRODUCTION_ENV)

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


class SecuritySettingsTests(SimpleTestCase):
	def test_missing_secret_key_refuses_to_start(self):
		with self.assertRaisesMessage(ValueError, 'DJANGO_SECRET_KEY must be set'):
			load_settings(DJANGO_SECRET_KEY=None)

	def test_debug_defaults_to_false(self):
		config = load_settings(**{**PRODUCTION_ENV, 'DJANGO_DEBUG': None})

		self.assertFalse(config['DEBUG'])

	def test_production_enforces_https_behind_proxy(self):
		config = load_settings(**PRODUCTION_ENV)

		self.assertEqual(config['SECURE_PROXY_SSL_HEADER'], ('HTTP_X_FORWARDED_PROTO', 'https'))
		self.assertTrue(config['SECURE_SSL_REDIRECT'])
		self.assertEqual(config['SECURE_HSTS_SECONDS'], 3600)
		self.assertFalse(config['SECURE_HSTS_INCLUDE_SUBDOMAINS'])
		self.assertEqual(config['SECURE_REDIRECT_EXEMPT'], [r'^healthz$', r'^readyz$'])

	def test_debug_skips_https_enforcement(self):
		config = load_settings()

		self.assertNotIn('SECURE_PROXY_SSL_HEADER', config)
		self.assertFalse(config['SECURE_SSL_REDIRECT'])
		self.assertEqual(config['SECURE_HSTS_SECONDS'], 0)

	def test_hsts_and_redirect_are_overridable(self):
		config = load_settings(**PRODUCTION_ENV, DJANGO_SECURE_HSTS_SECONDS='31536000',
							   DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS='True', DJANGO_SECURE_SSL_REDIRECT='False')

		self.assertEqual(config['SECURE_HSTS_SECONDS'], 31536000)
		self.assertTrue(config['SECURE_HSTS_INCLUDE_SUBDOMAINS'])
		self.assertFalse(config['SECURE_SSL_REDIRECT'])

	def test_render_hostname_is_allowed(self):
		config = load_settings(RENDER_EXTERNAL_HOSTNAME='parcel-api.onrender.com',
							   DJANGO_ALLOWED_HOSTS='api.parcel.app')

		self.assertEqual(config['ALLOWED_HOSTS'], ['api.parcel.app', 'parcel-api.onrender.com'])


class DatabaseSettingsTests(SimpleTestCase):
	def test_production_without_database_url_refuses_to_start(self):
		with self.assertRaisesMessage(ValueError, 'DATABASE_URL must be set'):
			load_settings(**{**PRODUCTION_ENV, 'DATABASE_URL': None})

	def test_production_database_url_requires_tls_and_health_checks(self):
		database = load_settings(**PRODUCTION_ENV)['DATABASES']['default']

		self.assertEqual(database['HOST'], 'pooler.supabase.com')
		self.assertEqual(database['OPTIONS']['sslmode'], 'require')
		self.assertEqual(database['CONN_MAX_AGE'], 60)
		self.assertTrue(database['CONN_HEALTH_CHECKS'])

	def test_tls_requirement_can_be_disabled(self):
		database = load_settings(**PRODUCTION_ENV, DATABASE_SSL_REQUIRE='False')['DATABASES']['default']

		self.assertNotIn('sslmode', database.get('OPTIONS', {}))

	def test_transaction_pooler_disables_connection_reuse_cursors_and_prepares(self):
		database = load_settings(**PRODUCTION_ENV, DATABASE_TRANSACTION_POOLER='True')['DATABASES']['default']

		self.assertEqual(database['CONN_MAX_AGE'], 0)
		self.assertTrue(database['DISABLE_SERVER_SIDE_CURSORS'])
		self.assertIsNone(database['OPTIONS']['prepare_threshold'])
		self.assertEqual(database['OPTIONS']['sslmode'], 'require')

	def test_debug_falls_back_to_individual_variables(self):
		database = load_settings(DATABASE_NAME='local_db', DATABASE_HOST='db.local')['DATABASES']['default']

		self.assertEqual(database['NAME'], 'local_db')
		self.assertEqual(database['HOST'], 'db.local')


class CelerySettingsTests(SimpleTestCase):
	def test_tasks_run_inline_without_redis(self):
		config = load_settings()

		self.assertTrue(config['CELERY_TASK_ALWAYS_EAGER'])
		self.assertEqual(config['CELERY_BROKER_URL'], 'memory://')

	def test_redis_url_configures_broker_and_disables_eager_mode(self):
		config = load_settings(REDIS_URL='redis://red-abc:6379')

		self.assertFalse(config['CELERY_TASK_ALWAYS_EAGER'])
		self.assertEqual(config['CELERY_BROKER_URL'], 'redis://red-abc:6379')
		self.assertEqual(config['CELERY_RESULT_BACKEND'], 'redis://red-abc:6379')
