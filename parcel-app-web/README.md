# Parcel App Web

Cookie-session authentication architecture and rollout runbook for the Next.js web client.

## Contents

1. Overview
2. Current Auth Model
3. End-to-End Login Flow
4. Session Bootstrap and Refresh
5. Middleware Behavior
6. CSRF Protection Model
7. Role Switching
8. Logout Flow
9. Local Development Setup
10. Production Setup Checklist
11. Migration Notes from localStorage Auth
12. Troubleshooting Guide
13. Validation Commands

## Overview

The web app now uses a cookie-first authentication model.

The backend is the source of truth for identity.
The frontend keeps only minimal in-memory auth state.
No sensitive auth material is persisted in localStorage.

Key backend endpoints:

- `GET /auth/me/`
- `GET /auth/csrf/`
- `POST /auth/api/logout/`
- `POST /auth/switch-role/`
- role-specific login endpoints:
	- `POST /auth/customer/login/`
	- `POST /vendors/login/`
	- `POST /couriers/login/`

Key frontend auth responsibilities:

- bootstrap active session from `/auth/me/`
- send CSRF token for unsafe requests
- rely on backend-trusted middleware checks
- keep dashboard role state in memory only

## Current Auth Model

The auth model is split across backend and frontend responsibilities.

### Backend responsibilities

- issue `auth_session` cookie after login
- issue role marker cookies for compatibility and routing metadata
- validate authenticated identity through `SessionTokenAuthentication`
- expose trusted session identity through `/auth/me/`
- enforce CSRF for cookie-authenticated state-changing requests
- allow active-role switching for multi-role accounts sharing the same email

### Frontend responsibilities

- call login endpoint for selected role
- store current user only in Zustand memory state
- bootstrap from `/auth/me/` on app mount
- call `/auth/switch-role/` for role transitions
- call backend logout endpoint before redirecting
- never write auth payloads or session tokens to localStorage

## End-to-End Login Flow

### Customer/vendor/courier login

1. User submits credentials from role login page.
2. Frontend calls the corresponding backend login endpoint.
3. Backend validates credentials and creates a `UserSession` row.
4. Backend sets:
	 - `auth_session`
	 - role marker cookie for active role
	 - legacy admin cookie where needed for admin compatibility
5. Frontend receives the user payload and updates in-memory auth state.
6. Frontend routes to the role dashboard.
7. On refresh or new tab load, frontend rehydrates from `/auth/me/` rather than localStorage.

## Session Bootstrap and Refresh

Session bootstrap happens in the app providers layer.

Current flow:

1. App mounts.
2. Frontend calls `bootstrapFromServer()`.
3. `bootstrapFromServer()` requests `GET /auth/me/` with cookies included.
4. If backend returns authenticated identity:
	 - `active_role` is trusted
	 - `allowed_roles` is trusted
	 - matching in-memory state is populated
5. If `/auth/me/` fails or returns no active session:
	 - auth store is cleared to empty state

This is the core contract that replaced localStorage auth hydration.

## Middleware Behavior

The Next middleware is server-trust-based.

Protected routes:

- `/customer-dash/*`
- `/vendor-dash/*`
- `/courier-dash/*`
- `/cart-check`
- `/payment`

Current middleware rules:

1. If route is not protected, allow request.
2. If protected route has no `auth_session` cookie, redirect to `/` with `from` query.
3. If `auth_session` exists, middleware calls backend `/auth/me/`.
4. Backend `active_role` determines authorization.
5. Wrong-role access is redirected consistently.
6. Marker cookies alone do not grant access.

Important consequence:

- If middleware behavior differs from client-side view behavior, trust backend `/auth/me/` first.

## CSRF Protection Model

Cookie-authenticated mutations require CSRF.

### Frontend flow

1. Unsafe request starts (`POST`, `PATCH`, `DELETE`, etc.).
2. API helper calls `GET /auth/csrf/` if token is not cached.
3. Frontend caches returned CSRF token in memory.
4. Request is retried with `X-CSRFToken` header.

### Backend flow

1. Session authentication resolves current user from cookie session.
2. If request is unsafe and auth source is cookie-based, CSRF is enforced.
3. Missing or invalid token causes request rejection.

Important notes:

- `CORS_ALLOWED_ORIGINS` is not enough by itself.
- `CSRF_TRUSTED_ORIGINS` must include the frontend origin.
- Production cross-site deployments usually require:
	- `Secure` cookies
	- `SameSite=None`
	- explicit trusted origins

## Role Switching

Role switching supports users that have multiple approved accounts under the same email.

Current backend behavior:

- `/auth/me/` returns `allowed_roles`
- `/auth/switch-role/` changes the active session target account
- backend reissues cookies for the newly active role

Current frontend behavior:

- dashboard reads `allowedRoles` from auth store
- role switch action calls `switchActiveRole(role)`
- store calls backend `/auth/switch-role/`
- store then rehydrates via `/auth/me/`
- UI redirects to the appropriate role dashboard

Constraints:

- only roles backed by valid active/verified accounts are switchable
- vendor/courier switching requires approved accounts
- role switching is session-scoped, not persisted in localStorage

## Logout Flow

Logout is backend-driven.

1. Frontend calls `POST /auth/api/logout/`.
2. Backend invalidates the active `UserSession`.
3. Backend clears auth and marker cookies.
4. Frontend clears in-memory auth state.
5. Frontend redirects to the matching public role entry page.

Important note:

- logout should be awaited before redirecting so cookie teardown completes deterministically.

## Local Development Setup

Expected local topology:

- frontend: `http://localhost:3000`
- backend: `http://localhost:7000`

Recommended local backend env values:

```env
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

Recommended frontend env values:

```env
NEXT_PUBLIC_API_BASE=http://localhost:7000
NEXT_PUBLIC_PAYMENT_API_BASE=http://localhost:8080
```

## Production Setup Checklist

Use this checklist before rollout.

### Origins and hosts

- `DJANGO_ALLOWED_HOSTS` includes backend hostname
- `DJANGO_CORS_ALLOWED_ORIGINS` includes frontend origin exactly
- `DJANGO_CSRF_TRUSTED_ORIGINS` includes frontend origin exactly

### Cookies

- `DJANGO_SESSION_COOKIE_SECURE=True`
- `DJANGO_CSRF_COOKIE_SECURE=True`
- if frontend and backend are cross-site:
	- `DJANGO_SESSION_COOKIE_SAMESITE=None`
	- `DJANGO_CSRF_COOKIE_SAMESITE=None`
	- `DJANGO_AUTH_SESSION_COOKIE_SAMESITE=None`
	- `DJANGO_AUTH_MARKER_COOKIE_SAMESITE=None`

### Frontend

- `NEXT_PUBLIC_API_BASE` points to production backend origin
- frontend requests use `credentials: include`
- no auth values are written to localStorage

### Validation

- login succeeds for customer/vendor/courier
- refresh preserves session via `/auth/me/`
- middleware blocks protected routes when session is absent
- CSRF-protected mutations pass with valid token
- role switch works for same-email multi-role accounts
- logout clears session and routes out of dashboards

## Migration Notes from localStorage Auth

Previous model:

- role identity stored in localStorage
- frontend marker cookies could become stale
- route mismatches happened when multiple role artifacts existed simultaneously

Current model:

- backend session is source of truth
- frontend uses only in-memory auth state
- middleware trusts `/auth/me/`
- role switching is explicit and session-backed
- localStorage is reserved for non-sensitive UX data only

Migration implications:

- do not reintroduce auth hydration from localStorage
- do not store session tokens or role payloads in browser storage
- if adding new role-aware UI, prefer `allowed_roles` and `active_role`

## Troubleshooting Guide

### Symptom: login succeeds but dashboard redirects back out

Check:

- `auth_session` cookie exists in browser
- `/auth/me/` returns correct `active_role`
- middleware can reach backend `/auth/me/`
- requested dashboard matches returned `active_role`

### Symptom: mutation fails with CSRF origin error

Check:

- frontend origin is in `DJANGO_CSRF_TRUSTED_ORIGINS`
- request includes cookies
- frontend got token from `/auth/csrf/`
- backend cookie settings are correct for the deployment topology

### Symptom: request fails with CSRF token missing/incorrect

Check:

- API helper is sending `X-CSRFToken`
- backend request is not accidentally stripping headers via proxy
- session and CSRF cookies belong to the expected backend domain

### Symptom: switching role says role unavailable

Check:

- both accounts share the same email
- target account is active
- target account email is verified
- vendor/courier target account is approved

### Symptom: customer registration crashes server-side

Check:

- backend registration view is using direct model existence check instead of missing helper methods
- `python manage.py check` passes in the active venv

### Symptom: works locally but breaks in production

Check:

- `SameSite` and `Secure` cookie flags match your frontend/backend domain relationship
- production frontend origin is present in both CORS and CSRF trusted origins
- HTTPS is enabled if using `Secure=True`

## Validation Commands

Backend:

```bash
source ~/python-envs/nftopia-analytics/bin/activate
cd /home/seyi/Documents/parcel-app/parcel-app-service
python manage.py check
python manage.py test authentication.tests -v 2
```

Frontend:

```bash
cd /home/seyi/Documents/parcel-app/parcel-app-web
npm test
npm run build
```

## Ownership Notes

If auth behavior changes, update this file when any of these are modified:

- `/auth/me/` response contract
- `/auth/switch-role/` behavior
- CSRF acquisition or validation behavior
- middleware protected-route logic
- cookie flag or domain configuration
- session bootstrap or logout flow
