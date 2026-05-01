# Event Platform

Serverless event platform where organizers create events and attendees browse/register with AI-powered natural-language search.

## Submission checklist (fill before review)

- **GitHub**: public repo URL with this source
- **Live frontend**: deployed static app URL
- **Live API**: deployed API base URL (verify `GET /health` returns `{"ok":true}`)
- Keep the three links below in sync with your deployment

## Live URLs

- Frontend: _add deployed frontend URL_
- API: _add deployed API base URL_ (example health endpoint: `/health`)
- GitHub: _add repo URL_

## Tech Stack

- Frontend: React + TypeScript + Vite + TanStack Query + React Router + Zustand + react-hook-form + Zod + Sonner
- Backend: Node.js + TypeScript + Express wrapped with `serverless-http`, deployed as **AWS Lambda** behind **API Gateway HTTP API** (Serverless Framework v3 + `serverless-esbuild`) + MongoDB Atlas
- AI: OpenAI (`gpt-4o-mini`) structured JSON parsing for search
- Shared: Workspace package with common types and schemas (`@event-platform/shared`)

## Monorepo Structure

- `packages/shared`: shared Zod schemas/types for frontend + backend
- **`packages/backend`**: API services, auth, events, registrations, search — see [packages/backend/README.md](packages/backend/README.md)
- **`packages/frontend`**: responsive UI for auth, browsing, organizer dashboard, registrations — see [packages/frontend/README.md](packages/frontend/README.md)

## Prerequisites

- Node.js 20+
- pnpm 10+ (see root `packageManager` field for the repo-pinned version)
- AWS CLI configured (for serverless deployment)
- MongoDB Atlas cluster/database user
- OpenAI API key

## Environment Setup

Copy `.env.example` to `.env` at repo root and set values:

```bash
MONGODB_URI=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=...
VITE_API_BASE_URL=http://localhost:3001
```

Optional: set `CORS_ORIGIN` (comma-separated) when the frontend runs on a non-default origin — see `.env.example`.

## Local Development

```bash
pnpm install
pnpm dev
```

This runs backend + frontend in parallel through workspace scripts.

## Validation Commands

Assessment-style checks (run from repo root):

```bash
pnpm install
pnpm lint
pnpm lint:fix   # optional: auto-fix where ESLint can
pnpm test
pnpm typecheck
pnpm build
```

Per-package TypeScript check (same as `pnpm typecheck`): `pnpm exec tsc --noEmit` inside `packages/frontend`, etc.

## Architecture Overview

```text
Frontend (React/Vite)
  -> API (Express local / Lambda via API Gateway in deploy)
    -> MongoDB Atlas (users, events, registrations)
    -> OpenAI API (search parse only, on explicit submit)
```

### Layering

- Thin HTTP handlers/routes
- Business logic in services (`auth`, `events`, `registrations`, `search`)
- Shared schema validation through `@event-platform/shared`

## Key Design Decisions

- Shared schemas package:
  - Prevents client/server validation drift and reduces duplication.
- Separate `registrations` collection:
  - Avoids embedded-array growth limits, improves queryability, preserves cancellation history.
- Denormalized `registeredCount`:
  - Event list/detail reads stay fast; writes update counter atomically.
- Capacity race-condition guard:
  - Registration increments only when `registeredCount < capacity` in one atomic Mongo update.
- AI search transparency:
  - Response returns parsed filters + events; UI displays removable chips so behavior is explainable.
- OpenAI fallback behavior:
  - On parse failure/timeout, service falls back to keyword-based filtering and returns a warning.

## API Highlights

- Auth: `/auth/signup`, `/auth/login`, `/auth/me`
- Events: create/list/detail/update/delete + organizer list-mine
- Registrations: register/cancel + attendee list-mine
- Search: `/search/parse` (OpenAI parsing + DB query)

Error envelope:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

## UX Notes

- Mobile-first responsive layout; desktop enhancements at wider breakpoints.
- Event detail uses action-state logic (not logged in, registered, full, host, ended).
- Loading states use skeleton-style shimmer blocks.
- Empty/error states include user guidance.

## Testing Coverage

Vitest suites:

- **Backend** (`packages/backend`): `validateEnv()`; search parsing / Mongo filter helpers
- **Shared** (`packages/shared`): published-events query schema (defaults, coercion)
- **Frontend** (`packages/frontend`): API client, event API helpers, `ConfirmDialog`, `useIsMobile`, event form validators

## Deployment Notes

### Backend (Lambda + API Gateway HTTP API)

The API is the same Express `app` as local dev, exported as a Lambda handler in `packages/backend/src/handlers/api.ts` via `serverless-http`. **Serverless Framework v3** bundles the handler with **`serverless-esbuild`** (see `packages/backend/serverless.yml`). We stay on v3 so `serverless deploy` / `package` work without a Serverless Dashboard login (v4+ requires `serverless login` for the open-source CLI).

1. Install [AWS CLI](https://aws.amazon.com/cli/) and configure credentials (`aws configure` or environment variables).
2. From the repo root: `pnpm install`.
3. Export the same secrets the app needs (or load them in your shell from `.env`):

   - `MONGODB_URI`, `JWT_SECRET`, `OPENAI_API_KEY`
   - Optional: `JWT_EXPIRES_IN` (defaults to `7d` in code and in `serverless.yml`)
   - **Required for production browsers:** `CORS_ORIGIN` — comma-separated list of frontend origins (e.g. `https://myapp.amplifyapp.com`). If unset, the API only allows `http://localhost:3000`.

4. Deploy:

```bash
cd packages/backend
pnpm deploy
```

5. After deploy, Serverless prints the **HTTP API** base URL. Set your frontend `VITE_API_BASE_URL` (build-time) to that base URL (no trailing slash). Health check: `GET /health` should return `{"ok":true}`.

6. Optional: build the deployment artifact without uploading: `pnpm package:aws` (set the same env vars first so `${env:...}` in `serverless.yml` can resolve).

If pnpm blocks install scripts (`esbuild`, `serverless`), run `pnpm approve-builds` once and allow those packages.

**MongoDB Atlas:** allow connections from AWS Lambda (commonly `0.0.0.0/0` on a dedicated database user for the challenge, or tighter IP / VPC later).

**Password hashing:** the API uses `bcryptjs` (pure JS) so Lambda bundles do not rely on native `bcrypt` binaries.

### Frontend

- AWS Amplify Hosting, S3 + CloudFront, or similar static hosting for the Vite build (`pnpm --filter @event-platform/frontend build`).

### Runtime behavior

- Mongo connection is cached per warm Lambda container to limit connection churn.

## Troubleshooting

- **Mongo connection fails**: verify Atlas allowlist and connection string credentials.
- **401 auth errors**: verify JWT secret consistency and `Authorization: Bearer <token>` format.
- **Search failures**: ensure `OPENAI_API_KEY` is present and valid.
- **CORS in production**: set `CORS_ORIGIN` on the Lambda environment to your deployed frontend origin(s).
- **pnpm blocks Serverless postinstall**: if deploy fails, run `pnpm approve-builds` and allow `serverless` if prompted.

## If we had more time (product & platform)

Ideas beyond the core assessment scope — see also **“What we could do more”** in [packages/frontend/README.md](packages/frontend/README.md) and [packages/backend/README.md](packages/backend/README.md).

### Features users would notice

- **Email flows**: confirmations, reminders, waitlists when events are full, organizer digests.
- **Event media**: cover images (S3 + presigned uploads), ICS calendar export.
- **Social & discovery**: sharing links with previews, saved searches, organizer profiles, richer category/tag taxonomy.
- **Policies**: ticketing tiers, refunds, terms acceptance, GDPR export/delete-me.
- **Collaboration**: co-organizers, delegated permissions beyond a single organizer per event.

### Reliability & scale

- **Pagination**: stable cursor pagination everywhere lists can grow.
- **Rate limiting & abuse controls**: API Gateway / WAF, per-IP limits, captcha on auth if needed.
- **Realtime**: websockets or SSE for registration counts without full reload.
- **Observability**: structured logs, traces, alerting; error tracking (e.g. Sentry) front and back.

### Security & compliance

- **Secrets**: AWS Secrets Manager / SSM Parameter Store for production; tighter CORS and JWT rotation.
- **Network**: VPC for Lambda and MongoDB Atlas Private Endpoint (instead of wide IP allowlists).
- **Audit**: immutable audit trail for cancellations and edits.

### Engineering quality

- **Broader automated tests**: E2E (Playwright), API integration tests against a test Mongo instance, CI running lint/typecheck/test/build on every push.
