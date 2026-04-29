# Event Platform

Serverless event platform where organizers create events and attendees browse/register with AI-powered natural-language search.

## Live URLs

- Frontend: _add deployed frontend URL_
- API: _add deployed API base URL_ (example health endpoint: `/health`)
- GitHub: _add repo URL_

## Tech Stack

- Frontend: React + TypeScript + Vite + TanStack Query + React Router + Zustand + react-hook-form + Zod + Sonner
- Backend: Node.js + TypeScript + Express (local) + AWS Lambda/API Gateway (target deploy) + MongoDB Atlas
- AI: OpenAI (`gpt-4o-mini`) structured JSON parsing for search
- Shared: Workspace package with common types and schemas (`@event-platform/shared`)

## Monorepo Structure

- `packages/shared`: shared Zod schemas/types for frontend + backend
- `packages/backend`: API services, auth, events, registrations, search, local Express wrapper
- `packages/frontend`: responsive UI for auth, browsing, organizer dashboard, registrations

## Prerequisites

- Node.js 20+
- pnpm 9+
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

## Local Development

```bash
pnpm install
pnpm dev
```

This runs backend + frontend in parallel through workspace scripts.

## Validation Commands

```bash
pnpm test
pnpm typecheck
pnpm build
```

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

Current automated tests (Vitest, backend):

- `validateEnv()` success/failure cases
- Search helper behavior:
  - fallback keyword parsing
  - Mongo filter construction for category/date/capacity

## Deployment Notes

- Backend deploy target: Serverless Framework -> Lambda + API Gateway
- Frontend deploy target: AWS Amplify Hosting (or equivalent static hosting)
- Mongo connection is cached per warm runtime to avoid excess connection churn.

## Troubleshooting

- **Mongo connection fails**: verify Atlas allowlist and connection string credentials.
- **401 auth errors**: verify JWT secret consistency and `Authorization: Bearer <token>` format.
- **Search failures**: ensure `OPENAI_API_KEY` is present and valid.
- **Build works, runtime fails on bcrypt/esbuild**: run `pnpm approve-builds` when prompted by pnpm.

## With More Time

- Cursor pagination for event lists
- Rate limiting and abuse protection
- Rich observability/tracing and structured log correlation
- VPC + PrivateLink hardening for Atlas connectivity
- Realtime registration updates
- Broader unit and integration test coverage
