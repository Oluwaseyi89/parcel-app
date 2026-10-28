#!/usr/bin/env bash
# Web container entrypoint: apply migrations, then hand the process over to gunicorn.
# Static files are collected at image build time. Celery workers, when used, run as a
# separate service (see render.yaml); without REDIS_URL tasks run inline in this process.
set -euo pipefail

# Render's free instances have no pre-deploy step, so migrate on start. Set
# RUN_MIGRATIONS=false when migrations run elsewhere (e.g. a paid plan's preDeployCommand).
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "Applying database migrations..."
    python manage.py migrate --noinput
fi

# exec makes gunicorn PID 1 so it receives the platform's SIGTERM and shuts down gracefully.
# Logs go to stdout/stderr, where Render collects them.
exec gunicorn parcel_app.wsgi:application \
    --bind "0.0.0.0:${PORT:-10000}" \
    --workers "${WEB_CONCURRENCY:-2}" \
    --timeout "${GUNICORN_TIMEOUT:-60}" \
    --access-logfile - \
    --error-logfile - \
    --log-level "${GUNICORN_LOG_LEVEL:-info}"
