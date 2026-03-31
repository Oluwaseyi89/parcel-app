from __future__ import absolute_import
import os
from celery import Celery

# Set Django settings module BEFORE importing Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "parcel_app.settings")

app = Celery("parcel_app")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()