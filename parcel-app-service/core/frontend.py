from urllib.parse import urlencode

from django.conf import settings


def frontend_url(path, **params):
    """Absolute URL of a page in the customer-facing web app (settings.FRONTEND_URL)."""
    url = f"{settings.FRONTEND_URL}/{path.lstrip('/')}"
    query = {key: value for key, value in params.items() if value is not None}
    return f"{url}?{urlencode(query)}" if query else url
