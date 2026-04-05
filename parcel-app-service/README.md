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

## 🐳 Docker Deployment

### Quick Start with Docker Compose
```bash
    docker-compose -f docker-compose.prod.yml up -d

    docker-compose -f docker-compose.prod.yml exec web python manage.py migrate
```

### Manual Docker Build
```bash
    docker build -t parcel-app .
    docker run -p 80:8080 \
    -e DJANGO_SECRET_KEY=your-secret-key \
    -e DATABASE_URL=postgresql://user:pass@host:5432/db \
    -e REDIS_URL=redis://host:6379/0 \
    parcel-app
```

