# Event Platform — Backend

TypeScript HTTP API for users, events, registrations, and OpenAI-assisted search.

## Runtime modes

| Mode | Entry | Purpose |
| ---- | ----- | ------- |
| **Local** | `src/local/server.ts` | Express on port **3001** — `pnpm dev` |
| **AWS Lambda** | `src/handlers/api.ts` | Same Express app wrapped with **`serverless-http`**; routed by API Gateway (**`serverless.yml`**) |

Application routes and middleware live in **`src/app.ts`**; business logic under **`src/services/`**.

## Prerequisites

Same as the [root README](../../README.md): MongoDB Atlas, JWT secret, OpenAI key. For deploy, AWS CLI credentials and Lambda env vars (see root **Deployment Notes**).

## Scripts

Run from **`packages/backend`** or `pnpm --filter @event-platform/backend <script>`:

| Script | Purpose |
| ------ | ------- |
| `pnpm dev` | Local Express + hot reload (`tsx watch`) |
| `pnpm build` | Compile TypeScript → `dist/` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest |
| `pnpm db:migrate` | Create indexes (run against Atlas) |
| `pnpm db:seed` | Optional demo users/events |
| `pnpm deploy` | `serverless deploy` (Lambda + HTTP API) |
| `pnpm package:aws` | `serverless package` (ZIP only; set env vars for `${env:...}` resolution) |

## Layout (high level)

- `src/app.ts` — Express app, routes, CORS, error envelope.
- `src/services/` — `auth`, `events`, `registrations`, `search`.
- `src/lib/` — env validation, JWT, auth guards, HTTP helpers, pagination.
- `src/db/` — Mongo client (connection cached across Lambda invocations where possible).
- `src/handlers/api.ts` — Lambda handler export.
- `serverless.yml` — Serverless Framework v3 + **serverless-esbuild** packaging.

Atlas network access (`0.0.0.0/0` or tighter) is documented in the root README.

---

## What we could do more (backend)

- **Observability**: structured JSON logs, request IDs, optional AWS X-Ray or OpenTelemetry; redact secrets in logs.
- **Security & abuse**: rate limiting (API Gateway / WAF / express-rate-limit), IP allowlists for admin paths, rotated JWT secrets, refresh tokens / shorter access tokens.
- **Data & migrations**: versioned migrations (not only index scripts), backups, archiving old events/registrations.
- **Search**: dedicated text index relevance tuning, synonyms, banning expensive queries at scale.
- **Async work**: queues (SQS) for AI calls or notifications if latency/cost warrants it.
- **Tests**: integration tests against Mongo memory server or containers; contract tests on OpenAI parser output.
- **Infra**: move to CDK/IaC parity, VPC + Atlas Private Endpoint, Secrets Manager/SM for env instead of plaintext Lambda env where policy allows.
