# Event Platform — Backend

TypeScript REST API deployed as individual **AWS Lambda** functions behind **API Gateway HTTP API**. Uses Serverless Framework v3 with serverless-esbuild for bundling and serverless-offline for local development.

---

## How It Works

Each API route is its own Lambda function. Locally, `serverless offline` emulates the full Lambda + API Gateway environment on **port 3001** — no separate Express server needed.

```
serverless-offline (:3001)         AWS Lambda + API Gateway (production)
       │                                         │
       ▼                                         ▼
  Handler function                         Handler function
       │                                         │
       ▼                                         ▼
   Services  →  Repositories  →  MongoDB (Atlas / DocumentDB)
                              └→  OpenAI (search parse only)
```

---

## Project Structure

```
packages/backend/
├── src/
│   ├── ai/
│   │   └── openai.ts              # OpenAI client & search-parse helper
│   ├── db/
│   │   └── client.ts              # MongoDB client (cached per Lambda container)
│   ├── handlers/                  # One file = one Lambda function
│   │   ├── auth/                  #   signup, login, me
│   │   ├── events/                #   list, get, mine, create, update, delete
│   │   │                          #   cancel, republish, draft
│   │   ├── registrations/         #   register, cancel, mine
│   │   ├── attendees/             #   list (organizer view)
│   │   ├── search/                #   parse (AI + DB query)
│   │   └── health/                #   check
│   ├── lib/
│   │   ├── auth.ts                # requireAuth middleware
│   │   ├── env.ts                 # validateEnv() — fail-fast on startup
│   │   ├── errors.ts              # AppError + error envelope builder
│   │   ├── jwt.ts                 # sign / verify helpers
│   │   ├── lambda.ts              # handler wrapper (error catching, JSON response)
│   │   └── pagination.ts          # cursor/offset pagination helpers
│   ├── repositories/              # All MongoDB queries
│   │   ├── events.ts
│   │   ├── registrations.ts
│   │   └── users.ts
│   ├── services/                  # Business logic
│   │   ├── auth.ts
│   │   ├── events.ts
│   │   ├── registrations.ts
│   │   └── search.ts
│   └── scripts/
│       ├── migrate.ts             # Create MongoDB indexes
│       └── seed.ts                # Optional demo data
├── tests/
│   ├── env.test.ts
│   └── search.test.ts
├── serverless.yml                 # Serverless Framework v3 config
├── tsconfig.json
└── .env.example
```

---

## Prerequisites

- Node.js 20+, pnpm 10+
- MongoDB — Atlas cluster or DocumentDB inside a VPC
- OpenAI API key
- AWS CLI configured (for deployment only)

---

## Environment Variables

Copy `.env.example` to `.env` in this directory:

```env
# MongoDB connection string
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/event_platform

# JWT signing secret (generate: openssl rand -base64 32)
JWT_SECRET=replace-with-a-long-secret

# Token lifetime
JWT_EXPIRES_IN=7d

# OpenAI key (gpt-4o-mini)
OPENAI_API_KEY=sk-...

# VPC — required for Lambda deployment to reach DocumentDB
VPC_ID=vpc-...
SUBNET_ID_1=subnet-...
SUBNET_ID_2=subnet-...
```

> **Local dev** — `VPC_ID` and `SUBNET_IDs` are read from `.env` by `serverless-offline` but have no functional effect locally; any placeholder value works.

---

## Scripts

Run from `packages/backend/` or `pnpm --filter @event-platform/backend <script>` from the repo root:

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `serverless offline` | Local Lambda emulation on **port 3001** |
| `build` | `tsc -p tsconfig.json` | Compile to `dist/` |
| `typecheck` | `tsc --noEmit` | Type-check without emitting |
| `test` | `vitest run` | Run Vitest test suite |
| `db:migrate` | `tsx src/scripts/migrate.ts` | Create MongoDB indexes |
| `db:seed` | `tsx src/scripts/seed.ts` | Seed demo users & events |
| `deploy` | `serverless deploy` | Deploy to AWS Lambda + API Gateway |
| `package:aws` | `serverless package` | Build deployment ZIP without uploading |

---

## API Routes

All routes are defined in `serverless.yml`. The base URL locally is `http://localhost:3001`.

### Health
```
GET  /health              → { "ok": true }
```

### Auth
```
POST /auth/signup
POST /auth/login
GET  /auth/me             🔒 Bearer token required
```

### Events — Public
```
GET  /events              Query: category, search, dateFrom, dateTo, page, limit
GET  /events/{id}
```

### Events — Organizer
```
GET    /events/mine       🔒 Returns events created by the authenticated user
POST   /events            🔒 Create a new event
PATCH  /events/{id}       🔒 Update event details
DELETE /events/{id}       🔒 Delete event
PATCH  /events/{id}/cancel     🔒 Cancel (sets status = cancelled)
PATCH  /events/{id}/republish  🔒 Republish a cancelled event
PATCH  /events/{id}/draft      🔒 Move published event back to draft
```

### Registrations
```
POST   /events/{id}/register   🔒 Register current user for event
DELETE /events/{id}/register   🔒 Cancel registration
GET    /registrations/mine     🔒 List registrations for current user
GET    /events/{id}/attendees  🔒 Organizer view — list registered attendees
```

### Search
```
POST /search/parse    Body: { "query": "music events this weekend" }
                      Returns: { filters, events, warning? }
```

**Error envelope:**
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

---

## Local Development

```bash
# from repo root
pnpm install
pnpm dev
# or just the backend:
pnpm --filter @event-platform/backend dev
```

`serverless offline` reads `serverless.yml`, resolves env vars from `packages/backend/.env`, and starts an HTTP server on `localhost:3001` that routes requests to the appropriate handler function.

---

## Deployment

### 1. Install and configure AWS CLI
```bash
aws configure   # or set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars
```

### 2. Set up VPC and MongoDB

Lambda functions run inside a VPC to reach DocumentDB (or a VPC-peered Atlas cluster).

- Create (or identify) a VPC with at least two **private subnets** and a **NAT Gateway** (outbound internet needed for OpenAI calls).
- Note the `VPC_ID` and both `SUBNET_ID`s.
- Add the Lambda security group as an inbound rule on the DB security group (TCP 27017) — the `LambdaSecurityGroupId` is exported as a CloudFormation output after the first deploy.

### 3. Fill in `packages/backend/.env`

All `${env:...}` references in `serverless.yml` must resolve:

```env
MONGODB_URI=...
JWT_SECRET=...
OPENAI_API_KEY=...
VPC_ID=...
SUBNET_ID_1=...
SUBNET_ID_2=...
```

### 4. Deploy

```bash
cd packages/backend
pnpm deploy
# or target a specific stage/region:
pnpm deploy -- --stage prod --region eu-west-1
```

Serverless prints the **HTTP API base URL** on completion. Set `VITE_API_BASE_URL` to this URL (no trailing slash) for production frontend builds.

### 5. Verify

```bash
curl https://<your-api-id>.execute-api.us-east-1.amazonaws.com/health
# → {"ok":true}
```

### Build artifact only (no upload)
```bash
pnpm package:aws
```

> **pnpm install scripts blocked?** Run `pnpm approve-builds` from the repo root and allow `esbuild` and `serverless`.

---

## Architecture Notes

- **One function per route** — each handler is independently bundled by esbuild; tree-shaking keeps bundles small.
- **MongoDB connection caching** — `src/db/client.ts` reuses the connection across warm invocations to limit connection churn.
- **`bcryptjs` (pure JS)** — avoids native binary issues in Lambda deployment packages.
- **Capacity guard** — registration uses an atomic `findOneAndUpdate` with `$lt capacity` condition; no separate lock needed.
- **AI fallback** — `src/services/search.ts` catches OpenAI errors/timeouts and falls back to keyword-based MongoDB filtering, returning a `warning` field to the client.

---

## Tests

```bash
pnpm test
```

| File | Covers |
|------|--------|
| `tests/env.test.ts` | `validateEnv()` — missing/invalid env var detection |
| `tests/search.test.ts` | OpenAI response parsing, MongoDB filter construction, fallback behavior |

---

## What We Could Do More

- **Observability** — structured JSON logs with request IDs, AWS X-Ray / OpenTelemetry traces, secret redaction in logs
- **Security & abuse** — rate limiting (API Gateway throttling / express-rate-limit), refresh tokens with shorter access token lifetime, JWT secret rotation
- **Data & migrations** — versioned migration runner (not just index scripts), automated backups, archiving old records
- **Search** — dedicated Atlas Search index with relevance tuning, synonym support
- **Async work** — SQS queue for AI calls or email notifications to avoid Lambda timeout pressure
- **Tests** — integration tests against Mongo memory server; contract tests on OpenAI parser output schema
- **Infra** — CDK/Terraform parity, Atlas Private Endpoint, Secrets Manager for env vars
