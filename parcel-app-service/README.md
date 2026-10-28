# Parcel E-commerce Backend Service

A comprehensive Django-based backend service for a multi-vendor e-commerce platform with parcel delivery integration, vendor management, and order processing capabilities.

---

## 🚀 Features

### Core E-commerce Functionality
- **Multi-vendor Marketplace** — Vendor registration, approval, and store management system  
- **Customer Management** — User registration, profile management, and shopping cart system  
- **Product Catalog** — Complete product management with image support and categories  
- **Order Processing** — End-to-end order management from cart to delivery  
- **Shopping Cart System** — Session-based cart management for authenticated and guest users  
- **Inventory Management** — Product stock tracking and availability

### Business Operations
- **Vendor Onboarding** — Streamlined vendor registration with approval workflow  
- **Courier Integration** — Delivery personnel management and assignment  
- **Payment Tracking** — Order payment status and transaction management  
- **Customer Support** — Complaint management and customer communication system  
- **Dispatch Management** — Order fulfillment and delivery coordination

### Technical Features
- **REST API** — Comprehensive API endpoints for frontend applications  
- **Celery Integration** — Asynchronous task processing with Redis  
- **Email Services** — Account activation, password reset, and order notifications  
- **File Upload** — Image handling with Pillow integration  
- **PostgreSQL** — Robust database backend for e-commerce data  
- **Docker Ready** — Containerized deployment with production configuration  
- **Real-time Geolocation** — Distance calculation for delivery estimation

---

## 🏗️ Project Structure

```
    parcel-app-django/
    ├── parcel_app/                 # Main Django project configuration
    ├── parcel_backends/            # Core backend & admin functionality
    ├── parcel_customer/            # Customer management & shopping carts
    ├── parcel_product/             # Product catalog management
    ├── parcel_order/               # Order processing & payment system
    ├── parcel_dispatch/            # Order fulfillment & delivery management
    ├── parcel_message/             # Messaging & notification system
    ├── static/                     # Static files (CSS, JS, images)
    ├── media/                      # User uploaded files (product images)
    └── logs/                       # Application logs
```
---

## 🛠️ Installation

### Prerequisites
- **Python 3.12+**
- **PostgreSQL 13+**
- **Redis 7+**

### Local Development

#### Clone the repository
```bash
    git clone https://github.com/Oluwaseyi89/parcel-app-django.git
    cd parcel-app-django
```

#### Create virtual environment
```bash
    python -m venv django-env
    source django-env/bin/activate  # Linux/Mac
    # or
    django-env\Scripts\activate    # Windows
```

#### Install dependencies
```bash
    pip install -r requirements.txt
```

#### Environment Configuration
```bash
    # Database
    DATABASE_URL=postgresql://username:password@localhost:5432/parcel_db

    # Redis
    REDIS_URL=redis://localhost:6379/0

    # Django
    DJANGO_SECRET_KEY=your-secret-key-here
    DJANGO_DEBUG=True
    DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
    DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
    DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
    DJANGO_CORS_ALLOW_CREDENTIALS=True

    # Cookie settings
    # Local dev: Lax + insecure works across localhost ports.
    DJANGO_SESSION_COOKIE_SECURE=False
    DJANGO_SESSION_COOKIE_SAMESITE=Lax
    DJANGO_CSRF_COOKIE_SECURE=False
    DJANGO_CSRF_COOKIE_SAMESITE=Lax

    # Production cross-site setup example (frontend and backend on different sites)
    # DJANGO_SESSION_COOKIE_SECURE=True
    # DJANGO_SESSION_COOKIE_SAMESITE=None
    # DJANGO_CSRF_COOKIE_SECURE=True
    # DJANGO_CSRF_COOKIE_SAMESITE=None
    # DJANGO_AUTH_SESSION_COOKIE_SECURE=True
    # DJANGO_AUTH_SESSION_COOKIE_SAMESITE=None
    # DJANGO_AUTH_MARKER_COOKIE_SECURE=True
    # DJANGO_AUTH_MARKER_COOKIE_SAMESITE=None

    # Email (for production)
    EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_USE_TLS=True
    EMAIL_HOST_USER=your-email@gmail.com
    EMAIL_HOST_PASSWORD=your-app-password
```

#### Database Setup
```bash
    python manage.py migrate
    python manage.py createsuperuser
```

#### Run Development Server
```bash
    python manage.py runserver
```

## ☁️ AWS S3 Media Storage

### Required Environment Variables
```bash
    USE_S3=True
    AWS_ACCESS_KEY_ID=your-access-key
    AWS_SECRET_ACCESS_KEY=your-secret-key
    AWS_STORAGE_BUCKET_NAME=your-bucket
    AWS_S3_REGION_NAME=us-east-1
    AWS_S3_CUSTOM_DOMAIN=your-bucket.s3.us-east-1.amazonaws.com
    AWS_LOCATION=media
```

### Security Mode (Recommended: Private Media)
```bash
    S3_MEDIA_PUBLIC=False
    AWS_QUERYSTRING_AUTH=True
    AWS_S3_ENCRYPTION=AES256
    AWS_S3_VERIFY=True
```

### Public Media Mode (Optional)
Use this only if your bucket policy intentionally allows public read access.

```bash
    S3_MEDIA_PUBLIC=True
    AWS_QUERYSTRING_AUTH=False
```

### Backfill Legacy Local Uploads to S3
Run this after enabling S3 to migrate existing local files.

```bash
    # Safe preview
    python manage.py backfill_media_to_storage --dry-run

    # Real migration
    python manage.py backfill_media_to_storage

    # Example: partial run by model group
    python manage.py backfill_media_to_storage --only vendor courier --limit 100
```

### Stage 6 Validation Checklist
```bash
    python manage.py check
    python manage.py help backfill_media_to_storage
    python manage.py backfill_media_to_storage --dry-run --only vendor courier product --limit 5
```

## 🐳 Docker Image

The `Dockerfile` builds a web-only image: static files are collected at build time, and on start
`start-services.sh` applies migrations (unless `RUN_MIGRATIONS=false`) and runs gunicorn on `$PORT`
(default `10000`) with logs on stdout.

```bash
    docker build -t parcel-app-service .
    docker run -p 10000:10000 \
    -e DJANGO_SECRET_KEY=your-secret-key \
    -e DATABASE_URL=postgres://user:pass@host:5432/db \
    -e USE_S3=True -e AWS_STORAGE_BUCKET_NAME=your-bucket \
    -e AWS_ACCESS_KEY_ID=... -e AWS_SECRET_ACCESS_KEY=... \
    parcel-app-service
```

With `DJANGO_DEBUG` unset (production), settings require `DJANGO_SECRET_KEY`, `DATABASE_URL` and
`USE_S3=True`, require TLS to the database, and redirect HTTP to HTTPS based on the proxy's
`X-Forwarded-Proto` header.

## ☁️ Deploying to Render

The repository root contains a Render Blueprint (`render.yaml`) for this service.

1. In Render, choose **New → Blueprint** and select this repository.
2. Enter the values Render prompts for (they are `sync: false` in the Blueprint and never stored
   in the repo): `DATABASE_URL`, `DJANGO_CORS_ALLOWED_ORIGINS`, the bucket credentials, SMTP
   settings, `PAYMENT_SYNC_TOKEN` and `PAYSTACK_SECRET_KEY`.
3. Render builds the image, runs migrations on start, and checks `GET /healthz`.

**Database (Supabase):** use the Session pooler connection string from Supabase → Connect. The
direct `db.<ref>.supabase.co` host is IPv6-only, which Render cannot reach. For the transaction
pooler (port 6543) also set `DATABASE_TRANSACTION_POOLER=True`.

**Media (Supabase Storage or S3):** for Supabase set `AWS_S3_ENDPOINT_URL` to
`https://<project-ref>.supabase.co/storage/v1/s3` and `AWS_S3_REGION_NAME` to the project region.

**Background tasks:** Celery is optional. Without `REDIS_URL`, tasks run inline in the web
process. To use a worker, uncomment the Key Value and worker services in `render.yaml`
(workers need a paid instance type).

**Free plan:** there is no pre-deploy step, so migrations run when the container starts. On a
paid plan, add `preDeployCommand: python manage.py migrate --noinput` and set
`RUN_MIGRATIONS=false`.

**Custom domain:** Render sends health checks with the custom domain once one is verified, so add
it to `DJANGO_ALLOWED_HOSTS`.

**Health endpoints:** `GET /healthz` (process is up) and `GET /readyz` (database reachable; add
`READINESS_CHECK_REDIS=true` to also check Redis).
