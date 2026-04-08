# Parcel App **Multi-Channel Commerce, Delivery, and Operations Platform**

![Repository](https://img.shields.io/badge/repo-monorepo-0f172a?style=for-the-badge)
![Web](https://img.shields.io/badge/web-Next.js%2016-111827?style=for-the-badge)
![Backend](https://img.shields.io/badge/backend-Django%20%2B%20DRF-166534?style=for-the-badge)
![Payments](https://img.shields.io/badge/payments-Spring%20Boot%203.4-0f766e?style=for-the-badge)
![Mobile](https://img.shields.io/badge/mobile-Expo%20%2B%20React%20Native-1f2937?style=for-the-badge)
![Admin](https://img.shields.io/badge/admin-React%20%2B%20Vite-7c2d12?style=for-the-badge)

Parcel App is a multi-surface platform for product discovery, checkout, parcel dispatch, courier workflows, vendor operations, complaints handling, and administrative control. This repository contains the backend services and client applications that together support customer shopping, vendor fulfillment, courier dispatch, payment processing, and internal operations.

The repository is organized as a practical product suite rather than a single compiled workspace. Each folder is an independently runnable application or service, but they are designed to work together around a shared business domain and a shared authentication model.

## 📚 Table of Contents

1. [What This Repository Contains](#-what-this-repository-contains)
2. [Platform Architecture](#-platform-architecture)
3. [Repository Map](#-repository-map)
4. [How The System Works](#-how-the-system-works)
5. [Authentication and Session Model](#-authentication-and-session-model)
6. [Recommended Local Development Order](#-recommended-local-development-order)
7. [Environment Configuration](#-environment-configuration)
8. [Run Commands By Project](#-run-commands-by-project)
9. [Quality Checks and Validation](#-quality-checks-and-validation)
10. [Operational Notes and Current State](#-operational-notes-and-current-state)
11. [Security Model](#-security-model)
12. [Troubleshooting Guide](#-troubleshooting-guide)
13. [Suggested Contributor Workflow](#-suggested-contributor-workflow)

## 🚀 What This Repository Contains

This repository currently holds six major parts:

- `parcel-app-service`: the main Django backend and API platform
- `parcel-app-web`: the primary Next.js web client using cookie-session auth
- `parcel-app-admin`: the admin and operations console for internal workflows
- `parcel-app-mobile`: the Expo/React Native mobile client for customer, vendor, and courier flows
- `parcel-app-payment-service`: the Spring Boot payment and order-processing service
- `parcel-app-react`: an older Vite-based storefront still present in the repository

If you are new to the codebase, the fastest way to understand the current product direction is:

1. Start with `parcel-app-service`
2. Then read `parcel-app-web`
3. Then review `parcel-app-admin`
4. Use `parcel-app-payment-service` for payment-specific work
5. Treat `parcel-app-react` as legacy unless your task explicitly targets it

## 🏗️ Platform Architecture

```text
                                   +----------------------+
                                   |   parcel-app-admin   |
                                   | React + Vite         |
                                   | internal operations  |
                                   +----------+-----------+
                                              |
                                              |
+----------------------+          +-----------v-----------+          +----------------------+
|  parcel-app-mobile   |          |   parcel-app-service  |          | parcel-app-payment-  |
| Expo + React Native  +--------->+ Django + DRF          +--------->+ service              |
| customer/vendor/     |  REST    | auth, users, orders,  |  payment | Spring Boot +        |
| courier interfaces   |          | dispatch, products    |  and     | PostgreSQL           |
+----------------------+          +-----------+-----------+  orders   +----------------------+
                                              ^
                                              |
                                              |
                                   +----------+-----------+
                                   |    parcel-app-web    |
                                   | Next.js + Zustand    |
                                   | primary web client   |
                                   +----------------------+

                                   +----------------------+
                                   |   parcel-app-react   |
                                   | Vite storefront      |
                                   | legacy/alternate UI  |
                                   +----------------------+
```

### Architectural intent

- `parcel-app-service` is the operational center of the platform.
- `parcel-app-web` is the most up-to-date browser client for authenticated customer, vendor, and courier experiences.
- `parcel-app-admin` is for internal staff and operational control.
- `parcel-app-payment-service` handles payment-oriented workflows in a separate Java service.
- `parcel-app-mobile` mirrors core user journeys on native devices.
- `parcel-app-react` remains in the repository as an older frontend surface and should be approached carefully before adding new feature work.

## 🗂️ Repository Map

```text
parcel-app/
├── parcel-app-admin/            # Internal admin console for moderation and ops
├── parcel-app-mobile/           # Expo mobile client for customer/vendor/courier journeys
├── parcel-app-payment-service/  # Spring Boot payment service with PostgreSQL
├── parcel-app-react/            # Older Vite-based storefront and payment UI
├── parcel-app-service/          # Main Django backend and domain APIs
└── parcel-app-web/              # Current Next.js web application
```

### Component breakdown

| Project | Role | Main Stack | Status |
|---|---|---|---|
| `parcel-app-service` | Core business API | Django, DRF, Celery, PostgreSQL | Active |
| `parcel-app-web` | Primary web product | Next.js 16, React 19, Zustand | Active |
| `parcel-app-admin` | Operations console | React 19, Vite, Vitest | Active |
| `parcel-app-mobile` | Mobile product surfaces | Expo 54, React Native 0.81, Zustand | Active, but config centralization is still needed |
| `parcel-app-payment-service` | Payment/order service | Spring Boot 3.4, Java 17, PostgreSQL | Active |
| `parcel-app-react` | Older storefront | Vite, React 18, Zustand | Legacy/transitionary |

## 🔄 How The System Works

At a high level, the platform supports these business flows:

### Customer flow

1. A customer browses products on web or mobile.
2. Cart and checkout requests are coordinated through the platform APIs.
3. Payment workflows may involve the payment service.
4. Orders move into fulfillment and dispatch.
5. Delivery and resolution status are surfaced back to the user.

### Vendor flow

1. A vendor manages products, stock, and deals.
2. Vendor-side order and notification views support fulfillment.
3. Vendor transaction and resolution screens track commercial outcomes.

### Courier flow

1. Couriers authenticate into dedicated dashboards.
2. Dispatch and deal assignment are surfaced to the courier channel.
3. Delivery execution and transaction views track active work.

### Admin flow

1. Internal staff monitor moderation, dispatch, complaints, banking, and orders.
2. The admin app acts as an operational console rather than a public product.
3. Quality gates are already in place for linting, regression tests, and release builds.

## 🔐 Authentication and Session Model

The current source of truth for web authentication is the Django backend in `parcel-app-service`.

### Current web auth contract

- The backend issues an `auth_session` cookie after successful login.
- The backend exposes `GET /auth/me/` as the trusted identity bootstrap endpoint.
- The frontend stores only minimal in-memory auth state.
- Sensitive auth state is not persisted in localStorage.
- CSRF is required for unsafe cookie-authenticated requests.
- Active role switching is supported for users with multiple approved accounts under the same email.

### Key auth endpoints

| Endpoint | Purpose |
|---|---|
| `GET /auth/me/` | Bootstrap current authenticated identity |
| `GET /auth/csrf/` | Issue or refresh CSRF token for cookie-authenticated mutations |
| `POST /auth/api/logout/` | Invalidate active session and clear cookies |
| `POST /auth/switch-role/` | Change active role for multi-role users |
| `POST /auth/customer/login/` | Customer login |
| `POST /vendors/login/` | Vendor login |
| `POST /couriers/login/` | Courier login |

### Trust boundary

For `parcel-app-web`, route protection now depends on backend-trusted session resolution rather than frontend markers alone. If client state and backend state disagree, the backend wins.

### Important implication for contributors

If you are changing login, logout, dashboards, middleware, or role switching, you should reason from `parcel-app-service` and `/auth/me/` first, then verify how the frontend hydrates and routes.

## 🧭 Recommended Local Development Order

This repository is easiest to run when you start services in dependency order.

### Option A: current primary stack

Use this when you are working on the main product path.

1. Start `parcel-app-service`
2. Start `parcel-app-payment-service` if your flow touches checkout or payment verification
3. Start `parcel-app-web`
4. Start `parcel-app-admin` if you need internal operations workflows
5. Start `parcel-app-mobile` only if you are testing native flows

### Option B: legacy storefront path

Use this only if your task explicitly targets the older Vite storefront.

1. Start `parcel-app-service`
2. Start `parcel-app-payment-service`
3. Start `parcel-app-react`

## ⚙️ Environment Configuration

The repository does not use one shared root `.env`. Each application manages its own configuration.

### 1. `parcel-app-service`

Core backend variables documented in `.env.example` include:

```env
DJANGO_SECRET_KEY=replace-with-your-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DJANGO_CORS_ALLOW_CREDENTIALS=True

DJANGO_SESSION_COOKIE_SECURE=False
DJANGO_SESSION_COOKIE_SAMESITE=Lax
DJANGO_CSRF_COOKIE_SECURE=False
DJANGO_CSRF_COOKIE_SAMESITE=Lax
DJANGO_AUTH_SESSION_COOKIE_SECURE=False
DJANGO_AUTH_SESSION_COOKIE_SAMESITE=Lax
DJANGO_AUTH_MARKER_COOKIE_SECURE=False
DJANGO_AUTH_MARKER_COOKIE_SAMESITE=Lax
```

Operational notes:

- `CORS_ALLOWED_ORIGINS` alone is not enough for browser auth flows.
- `CSRF_TRUSTED_ORIGINS` must also include the frontend origin.
- Localhost development typically works with `Lax` and insecure cookies.
- Cross-site production deployments usually need `Secure` plus `SameSite=None`.

### 2. `parcel-app-web`

Recommended frontend variables:

```env
NEXT_PUBLIC_API_BASE=http://localhost:7000
NEXT_PUBLIC_PAYMENT_API_BASE=http://localhost:8080
```

### 3. `parcel-app-admin`

Required variable:

```env
VITE_API_BASE_URL=http://localhost:7000
```

### 4. `parcel-app-payment-service`

This service is primarily configured through Spring property files and profile selection.

Key defaults documented in the service README:

- development profile: `application-dev.properties`
- production profile: `application-prod.properties`
- default runtime port: `8080`
- PostgreSQL required

### 5. `parcel-app-mobile`

Current state:

- the mobile app is Expo-based and runnable locally
- several screens currently call `http://localhost:7000/...` directly
- endpoint configuration is not yet fully centralized behind one environment abstraction

That means mobile work on a physical device usually requires replacing `localhost` with a LAN IP or introducing a proper shared API config layer.

## 🛠️ Run Commands By Project

### Backend API: `parcel-app-service`

```bash
cd parcel-app-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver 7000
```

### Payment Service: `parcel-app-payment-service`

```bash
cd parcel-app-payment-service
./gradlew clean build
./gradlew bootRun --args='--spring.profiles.active=dev'
```

### Primary Web App: `parcel-app-web`

```bash
cd parcel-app-web
npm install
npm run dev
```

### Admin Console: `parcel-app-admin`

```bash
cd parcel-app-admin
npm install
cp .env.example .env
npm run dev
```

### Mobile App: `parcel-app-mobile`

```bash
cd parcel-app-mobile
npm install
npm run start
```

Other useful mobile commands:

```bash
npm run android
npm run ios
npm run web
```

### Legacy Storefront: `parcel-app-react`

```bash
cd parcel-app-react
npm install
npm run dev
```

## ✅ Quality Checks and Validation

Use project-local checks rather than assuming one root command exists.

| Project | Useful Commands |
|---|---|
| `parcel-app-admin` | `npm run lint`, `npm run test`, `npm run build`, `npm run check` |
| `parcel-app-web` | `npm run test`, `npm run build` |
| `parcel-app-react` | `npm run test`, `npm run build` |
| `parcel-app-service` | `python manage.py check`, `python manage.py test` |
| `parcel-app-payment-service` | `./gradlew test`, `./gradlew clean build` |
| `parcel-app-mobile` | manual app verification via Expo flows |

### Recommended validation path after auth or routing changes

1. Run Django checks and relevant Django tests.
2. Run `parcel-app-web` tests and build.
3. If internal workflows changed, run `parcel-app-admin` checks.
4. If checkout changed, run payment-service build and endpoint validation.
5. If native flows changed, verify at least one customer and one role-specific mobile path.

## 📌 Operational Notes and Current State

### What is current

- `parcel-app-service` is the core backend source of truth.
- `parcel-app-web` is the primary browser client and has the latest auth architecture work.
- `parcel-app-admin` has release-quality checks and regression coverage in place.

### What needs special care

- `parcel-app-react` is still present but represents an older frontend direction.
- `parcel-app-mobile` currently contains hardcoded localhost API references in multiple screens, which makes device testing more fragile than browser-based local development.
- `parcel-app-payment-service` runs as a separate Java service and requires its own PostgreSQL setup and profile management.

### Good mental model

This is a product suite with multiple clients around one business domain, not a single framework app split into packages.

## 🔒 Security Model

The platform already contains several important security controls. Contributors should preserve them.

### Backend controls

- cookie-authenticated session resolution on the backend
- CSRF enforcement for unsafe requests authenticated by cookie
- environment-driven cookie flags for `Secure`, `SameSite`, and optional domains
- trusted-origin configuration for browser-based requests

### Frontend controls

- `parcel-app-web` does not treat localStorage as auth truth
- route protection is backend-trusted through `/auth/me/`
- auth teardown is backend-driven on logout
- unsafe requests fetch and attach CSRF tokens

### Operational safeguards

- avoid storing session tokens in frontend storage
- do not bypass trusted-origin configuration in development by disabling CSRF casually
- prefer environment-based cookie tuning rather than hardcoding production security settings
- treat role switching as a session mutation and rehydrate from the backend after it completes

## 🧪 Troubleshooting Guide

### Login succeeds but dashboard redirects back to login

Check these in order:

1. Confirm the backend is setting `auth_session`.
2. Confirm the frontend origin is included in `DJANGO_CORS_ALLOWED_ORIGINS`.
3. Confirm the frontend origin is included in `DJANGO_CSRF_TRUSTED_ORIGINS`.
4. Confirm `GET /auth/me/` returns the expected `active_role`.
5. Confirm middleware is pointed at the correct backend base URL.

### CSRF failures on POST, PATCH, or DELETE

Likely causes:

- frontend did not fetch `/auth/csrf/`
- `X-CSRFToken` was not sent
- trusted origins are incomplete
- cookie flags do not match the deployment topology

### Mobile app cannot reach the backend on a physical device

The current mobile code uses several `http://localhost:7000/...` endpoints directly. On a real device, `localhost` points to the device itself, not your computer. Use your machine's LAN IP or centralize mobile API configuration before broader device testing.

### Payment flow works in one client but not another

Verify:

1. the client is pointed at the correct payment-service base URL
2. the payment service is running with the intended Spring profile
3. PostgreSQL is reachable by the payment service
4. any client-specific checkout payload shape still matches backend expectations

## 🧑‍💻 Suggested Contributor Workflow

### For auth work

1. Start in `parcel-app-service`
2. Validate `/auth/me/`, `/auth/csrf/`, and login/logout behavior
3. Move to `parcel-app-web` middleware and store hydration
4. Test role-specific dashboards and protected routes

### For payment work

1. Review `parcel-app-payment-service`
2. Validate PostgreSQL and Spring profile config
3. Then test the calling client in `parcel-app-web` or `parcel-app-react`

### For operations work

1. Update `parcel-app-service` if the API contract changes
2. Validate workflows in `parcel-app-admin`
3. Run `npm run check` in the admin app before shipping

### For mobile work

1. Identify whether the screen uses hardcoded API URLs
2. Replace ad hoc endpoints with shared configuration where possible
3. Test on simulator first, then on a real device with network-aware base URLs

## 📎 Project-Specific Documentation

Each major app or service already has or should have its own local README for deeper details:

- `parcel-app-admin/README.md`
- `parcel-app-web/README.md`
- `parcel-app-service/README.md`
- `parcel-app-payment-service/README.md`
- `parcel-app-react/README.md`

The root README should help you navigate the platform. The project-local READMEs should help you execute changes inside each component.