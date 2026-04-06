# Parcel Admin

Parcel Admin is the operations console for moderation, dispatch, complaints, banking, orders, and access control workflows in the Parcel platform.

## Requirements

- Node.js 20+
- npm 10+

## Local Setup

1. Install dependencies:

	```bash
	npm install
	```

2. Create a local environment file:

	```bash
	cp .env.example .env
	```

3. Start the development server:

	```bash
	npm run dev
	```

## Environment

The app currently requires one deployment variable:

- `VITE_API_BASE_URL`: Base URL for the Django admin API, for example `http://localhost:7000` in development or `https://api.example.com` in production.

Reference: [.env.example](/home/seyi/Documents/parcel-app/parcel-app-admin/.env.example)

## Quality Checks

- `npm run lint`: ESLint validation
- `npm run test`: Run unit and integration regression tests with Vitest
- `npm run test:watch`: Run tests in watch mode during development
- `npm run build`: Produce the production bundle with Vite
- `npm run check`: Full release gate that runs lint, tests, and build in sequence

## Regression Coverage

The release baseline includes tests for:

- auth guard bootstrap and protected-route behavior
- moderation action success and rollback paths
- API request error parsing and header handling

## Deployment Baseline

Before deployment, verify all of the following:

1. `.env` or hosting environment variables define `VITE_API_BASE_URL` for the target backend.
2. `npm run check` passes locally or in CI.
3. The generated bundle from `npm run build` is published from `dist/`.
4. The target backend allows the admin origin and `X-Session-Token` header.
