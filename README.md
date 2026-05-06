# Event Platform

A full-stack, serverless event platform where organizers publish events and attendees browse, discover, and register — powered by AI-assisted natural-language search.

## Screenshots
Browse Page:
<img width="1919" height="888" alt="image" src="https://github.com/user-attachments/assets/17fd169e-2301-4d2b-9ee7-21f64649aaaa" />

Search by AI:
<img width="1919" height="579" alt="image" src="https://github.com/user-attachments/assets/04a5c7f0-f08d-4dbc-a90b-cebeea0aa145" />

My Events Page(Organizer Role):
<img width="1919" height="507" alt="image" src="https://github.com/user-attachments/assets/a38fe673-954e-484b-841a-7170125d8eab" />

My Registrations Page(Attendee Role):
<img width="1919" height="568" alt="image" src="https://github.com/user-attachments/assets/82f357e7-3528-4320-a0af-702e625a9e02" />

Event Detail Page(Attendee Role):
<img width="1918" height="414" alt="image" src="https://github.com/user-attachments/assets/a823c2ec-86ee-4999-98f0-4efdc99c0299" />

Event Create/Update Page(Organizer Role):
<img width="1919" height="923" alt="image" src="https://github.com/user-attachments/assets/c16b3f2d-00e3-403e-9803-58a8e466d862" />

---

## Packages

| Package | Description |
|---------|-------------|
| [`packages/shared`](packages/shared) | Zod schemas and TypeScript types shared between backend and frontend |
| [`packages/backend`](packages/backend/README.md) | TypeScript REST API — individual AWS Lambda functions behind API Gateway |
| [`packages/frontend`](packages/frontend/README.md) | React 19 + Vite SPA — browse, search, register, and manage events |

---

## Tech Stack

### Frontend
- **React 19** + TypeScript + **Vite 7**
- **TanStack Query v5** — server state & caching
- **React Router v7** — client-side routing
- **Zustand v5** — auth session store
- **react-hook-form** + **Zod** — forms and validation
- **Tailwind CSS v4** + CSS Modules — styling
- **@mdxeditor/editor** — rich markdown event descriptions
- **Sonner** — toast notifications
- **lucide-react** — icons
- **date-fns** — date formatting

### Backend
- **Node.js 20** + TypeScript + **Express**
- **Serverless Framework v3** + **serverless-esbuild** — Lambda packaging
- **serverless-offline** — local Lambda emulation on port 3001
- **MongoDB** (Atlas or DocumentDB) via the official driver
- **OpenAI `gpt-4o-mini`** — structured JSON parsing for AI search
- **bcryptjs** — password hashing (pure JS, no native binaries)
- **jsonwebtoken** — JWT auth

### Shared
- **Zod** — schema definitions consumed by both packages
- **`@event-platform/shared`** — workspace package resolving to `packages/shared/src/index.ts`

---

## Monorepo Structure

```
event-platform/
├── packages/
│   ├── shared/          # @event-platform/shared — Zod schemas & types
│   ├── backend/         # @event-platform/backend — Lambda API
│   └── frontend/        # @event-platform/frontend — React SPA
├── package.json         # root workspace scripts & ESLint dev deps
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Prerequisites

- **Node.js 20+**
- **pnpm 10+** (version pinned in `packageManager` field — run `corepack enable` if needed)
- **AWS CLI** configured with deploy credentials (for Lambda + S3/CloudFront deployment)
- **MongoDB** — Atlas cluster or DocumentDB inside a VPC
- **OpenAI API key**

---

## Environment Setup

Copy the example files and fill in your values:

```bash
# Backend secrets
cp packages/backend/.env.example packages/backend/.env

# Frontend build config
cp packages/frontend/.env.example packages/frontend/.env
```

**`packages/backend/.env`**

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/event_platform
JWT_SECRET=<openssl rand -base64 32>
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-...

# Required for AWS Lambda deployment (VPC)
VPC_ID=vpc-...
SUBNET_ID_1=subnet-...
SUBNET_ID_2=subnet-...
```

**`packages/frontend/.env`**

```env
VITE_API_BASE_URL=http://localhost:3001   # local dev
# VITE_API_BASE_URL=https://your-api.execute-api.us-east-1.amazonaws.com  # production
```

---

## Local Development

```bash
pnpm install
pnpm dev
```

Runs `serverless offline` (API on **port 3001**) and Vite dev server (frontend on **port 3000**) in parallel.

---

## Quality Commands

Run all checks from the repo root:

```bash
pnpm lint          # ESLint across all packages
pnpm lint:fix      # auto-fix where possible
pnpm typecheck     # tsc --noEmit across all packages
pnpm test          # Vitest suites across all packages
pnpm build         # compile shared → backend → frontend
```

---

## Architecture

```
Browser (React/Vite :3000)
  │
  ▼
API Gateway HTTP API
  │  individual Lambda functions per route
  ▼
Lambda handlers  →  Services  →  Repositories  →  MongoDB
                                                 └─ OpenAI (search only)
```

### Layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Handlers** | `src/handlers/` | Parse request, call service, return HTTP response |
| **Services** | `src/services/` | Business logic — auth, events, registrations, search |
| **Repositories** | `src/repositories/` | All MongoDB queries — users, events, registrations |
| **DB client** | `src/db/client.ts` | Cached connection across warm Lambda invocations |
| **Shared** | `packages/shared/` | Zod schemas validated at both ends |

---

## API Reference

### Auth
| Method | Path | Auth |
|--------|------|------|
| `POST` | `/auth/signup` | — |
| `POST` | `/auth/login` | — |
| `GET` | `/auth/me` | Bearer |

### Events
| Method | Path | Auth |
|--------|------|------|
| `GET` | `/events` | — |
| `GET` | `/events/{id}` | — |
| `GET` | `/events/mine` | Bearer |
| `POST` | `/events` | Bearer |
| `PATCH` | `/events/{id}` | Bearer (organizer) |
| `DELETE` | `/events/{id}` | Bearer (organizer) |
| `PATCH` | `/events/{id}/cancel` | Bearer (organizer) |
| `PATCH` | `/events/{id}/republish` | Bearer (organizer) |
| `PATCH` | `/events/{id}/draft` | Bearer (organizer) |

### Registrations
| Method | Path | Auth |
|--------|------|------|
| `POST` | `/events/{id}/register` | Bearer |
| `DELETE` | `/events/{id}/register` | Bearer |
| `GET` | `/registrations/mine` | Bearer |
| `GET` | `/events/{id}/attendees` | Bearer (organizer) |

### Search
| Method | Path | Auth |
|--------|------|------|
| `POST` | `/search/parse` | — |

### Health
| Method | Path |
|--------|------|
| `GET` | `/health` → `{"ok":true}` |

**Error envelope:**
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

---

## Key Design Decisions

- **Shared schema package** — single source of truth for validation; prevents frontend/backend drift.
- **Individual Lambda functions per route** — cold starts are scoped; each handler bundles only what it needs via esbuild.
- **Repository layer** — isolates MongoDB queries from business logic; easy to swap or test.
- **Separate `registrations` collection** — avoids embedded-array growth limits; preserves cancellation history and improves queryability.
- **Denormalized `registeredCount`** — fast event list/detail reads; incremented atomically in the same update that guards capacity.
- **Capacity race-condition guard** — registration only succeeds when `registeredCount < capacity` in a single atomic MongoDB update.
- **AI search transparency** — response returns both the parsed filters and the matched events; the UI renders removable filter chips so users can see and undo what the AI inferred.
- **OpenAI fallback** — on parse failure or timeout, the service falls back to keyword filtering and surfaces a warning to the UI.

---

## Testing Coverage

| Package | What's tested |
|---------|---------------|
| **Backend** | `validateEnv()`, search parsing helpers, MongoDB filter builders |
| **Shared** | Pagination query schema — defaults and coercion |
| **Frontend** | API client, event API helpers, `ConfirmDialog`, `useIsMobile`, event form validators |

---

## Deployment

### Backend — AWS Lambda + API Gateway

The backend is a set of individual Lambda functions deployed via Serverless Framework v3. See [`packages/backend/README.md`](packages/backend/README.md#deployment) for the full step-by-step guide.

Quick summary:

```bash
# ensure packages/backend/.env has all required vars including VPC_ID, SUBNET_IDs
cd packages/backend
pnpm deploy
```

After deploy, Serverless prints the HTTP API base URL. Set `VITE_API_BASE_URL` to that URL for a production frontend build.

### Frontend — S3 + CloudFront

```bash
# 1. set VITE_API_BASE_URL to your deployed API URL in packages/frontend/.env
pnpm --filter @event-platform/frontend build

# 2. deploy dist/ to S3 + CloudFront via Serverless Framework
cd packages/frontend
pnpm deploy
```

The `serverless.yml` creates an S3 bucket, CloudFront distribution with HTTPS redirect and SPA 404→index.html handling, and syncs `dist/` automatically.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Mongo connection fails locally | Confirm `MONGODB_URI` in `packages/backend/.env` and Atlas/DocumentDB network access |
| `401` auth errors | Check `JWT_SECRET` consistency and `Authorization: Bearer <token>` header |
| Search returns no AI results | Verify `OPENAI_API_KEY` is valid; fallback keyword search still runs |
| Lambda can't reach MongoDB | Ensure Lambda security group is added as inbound rule on DB security group (TCP 27017) |
| Lambda can't reach OpenAI | Private subnets need a NAT Gateway for outbound internet |
| pnpm blocks install scripts | Run `pnpm approve-builds` and allow `esbuild` / `serverless` |
| CloudFront returns old build | Invalidate the distribution: `aws cloudfront create-invalidation --distribution-id <id> --paths "/*"` |

---

## If We Had More Time

### Features users would notice
- **Email flows** — registration confirmations, event reminders, waitlist notifications, organizer digests
- **Event media** — cover images via S3 presigned uploads, `.ics` calendar export
- **Social & discovery** — sharing links with OG previews, saved searches, organizer profiles, richer tag taxonomy
- **Collaboration** — co-organizers, delegated permissions

### Reliability & scale
- **Cursor pagination** — stable pagination for growing lists
- **Rate limiting** — API Gateway / WAF, per-IP throttles, captcha on auth endpoints
- **Realtime** — WebSocket or SSE push for registration count updates
- **Observability** — structured logs with request IDs, distributed traces (X-Ray / OpenTelemetry), Sentry

### Security & compliance
- **Secrets management** — AWS Secrets Manager / SSM Parameter Store instead of Lambda env vars
- **Network hardening** — MongoDB Atlas Private Endpoint, tighter CORS, JWT rotation with refresh tokens
- **Audit trail** — immutable log of cancellations and event edits

### Engineering quality
- **E2E tests** — Playwright covering critical user flows
- **API integration tests** — against a Mongo memory server or test container
- **CI pipeline** — lint → typecheck → test → build on every push
