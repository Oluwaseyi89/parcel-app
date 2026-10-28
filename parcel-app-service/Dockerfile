FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DJANGO_SETTINGS_MODULE=parcel_app.settings \
    PORT=10000

WORKDIR /app

# Every dependency installs from a wheel (psycopg[binary] bundles libpq), so no system packages.
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Bake hashed, compressed static files into the image so container start-up stays fast.
# Production settings require these variables at import time; the placeholders are never
# used to connect to anything.
RUN DJANGO_SECRET_KEY=collectstatic-placeholder \
    DJANGO_DEBUG=False \
    DATABASE_URL=postgres://placeholder@localhost:5432/placeholder \
    USE_S3=True \
    AWS_STORAGE_BUCKET_NAME=placeholder \
    S3_MEDIA_PUBLIC=False \
    AWS_QUERYSTRING_AUTH=True \
    python manage.py collectstatic --noinput

RUN useradd --create-home --system django \
    && chown -R django:django /app
USER django

# Render injects PORT (default 10000); start-services.sh binds gunicorn to it.
EXPOSE 10000

CMD ["./start-services.sh"]
