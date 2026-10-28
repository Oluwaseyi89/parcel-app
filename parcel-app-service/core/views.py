import logging

from django.conf import settings
from django.db import connection
from django.http import JsonResponse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

logger = logging.getLogger(__name__)


@never_cache
@require_safe
def healthz(request):
    """Liveness probe: the process is up and serving requests. Touches no dependencies."""
    return JsonResponse({"status": "ok"})


@never_cache
@require_safe
def readyz(request):
    """Readiness probe: dependencies needed to serve traffic are reachable."""
    checks = {"database": _check_database()}
    if settings.READINESS_CHECK_REDIS:
        checks["redis"] = _check_redis()

    ready = all(result == "ok" for result in checks.values())
    return JsonResponse(
        {"status": "ok" if ready else "unavailable", "checks": checks},
        status=200 if ready else 503,
    )


def _check_database():
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return "ok"
    except Exception:
        # Details go to logs only; the probe response must not leak connection info.
        logger.exception("Readiness check failed: database")
        return "error"


def _check_redis():
    try:
        import redis

        redis.Redis.from_url(settings.CELERY_BROKER_URL, socket_connect_timeout=2, socket_timeout=2).ping()
        return "ok"
    except Exception:
        logger.exception("Readiness check failed: redis")
        return "error"
