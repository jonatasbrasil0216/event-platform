# Event Platform — Frontend

React 19 + TypeScript SPA for browsing events, managing registrations, organizer workflows, and AI-assisted natural-language search.

---

## Role in the Monorepo

- Calls the REST API at `VITE_API_BASE_URL` (set at build time).
- Shares Zod schemas and TypeScript types with the backend via **`@event-platform/shared`** (workspace package).

---

## Project Structure

```
packages/frontend/
├── src/
│   ├── api/
│   │   ├── client/          # apiRequest — base fetch wrapper with error handling
│   │   ├── auth/            # signup, login, getMe
│   │   ├── events/          # list, get, mine, create, update, delete, status changes
│   │   ├── registrations/   # register, cancel, listMine
│   │   └── search/          # parseSearch (AI endpoint)
│   ├── components/
│   │   ├── category-chip/             # single category badge
│   │   ├── category-pills/            # row of category filter pills
│   │   ├── confirm-dialog/            # reusable confirmation modal
│   │   ├── date-picker-button/        # inline date picker trigger
│   │   ├── event-card/                # public event card (browse grid)
│   │   ├── loading-blocks/            # shimmer skeleton placeholders
│   │   ├── markdown-content/          # render markdown with remark-gfm + sanitize
│   │   ├── markdown-editor-field/     # @mdxeditor rich text field (form use)
│   │   ├── my-event-card/             # organizer event card (my-events page)
│   │   ├── my-registration-card/      # attendee registration card
│   │   ├── navbar/                    # top navigation bar
│   │   ├── new-event-card/            # "create event" placeholder card
│   │   ├── organizer-attendees-card/  # attendee list for organizers
│   │   ├── pagination-controls/       # prev / next / page indicator
│   │   ├── parsed-filter-chips/       # AI-inferred filter chips (removable)
│   │   ├── search-box/                # natural-language search input
│   │   └── segmented-count-tabs/      # tab bar with badge counts
│   ├── hooks/
│   │   ├── use-debounced-value/       # debounce any value
│   │   └── use-is-mobile/             # responsive breakpoint hook
│   ├── pages/
│   │   ├── auth/                      # LoginPage, SignupPage
│   │   ├── browse-events/             # public event grid + AI search
│   │   ├── event-detail/              # attendee & organizer detail views
│   │   ├── event-form/                # create / edit event form
│   │   ├── home/                      # landing / redirect
│   │   ├── my-events/                 # organizer dashboard
│   │   └── my-registrations/          # attendee registrations list
│   ├── stores/
│   │   └── auth/                      # Zustand — JWT token + user profile
│   ├── utils/
│   │   ├── category-theme/            # category → color/icon mapping
│   │   └── event-form-validation/     # Zod schema for event create/edit form
│   ├── App.tsx                        # React Router route definitions
│   ├── main.tsx                       # app entry, QueryClient, Toaster
│   └── styles.css                     # Tailwind base + global tokens
├── index.html
├── vite.config.ts
├── serverless.yml                     # S3 + CloudFront deployment
├── tsconfig.json
└── .env.example
```

---

## Prerequisites

- Node.js 20+, pnpm 10+
- Backend running locally or a deployed API URL

---

## Environment Variables

Copy `.env.example` to `.env` in this directory:

```env
# API origin — no trailing slash
VITE_API_BASE_URL=http://localhost:3001
```

For production builds, set this to your deployed API Gateway URL before running `pnpm build`.

---

## Scripts

Run from `packages/frontend/` or `pnpm --filter @event-platform/frontend <script>` from the repo root:

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Dev server on **port 3000** with HMR |
| `build` | `tsc --noEmit && vite build` | Typecheck + production bundle → `dist/` |
| `typecheck` | `tsc --noEmit` | Type-check without building |
| `test` | `vitest run` | Run Vitest + Testing Library suite |
| `deploy` | `serverless deploy --stage dev` | Deploy `dist/` to S3 + CloudFront |

---

## Local Development

```bash
# From repo root — starts backend (serverless-offline :3001) + frontend (:3000)
pnpm install
pnpm dev

# Frontend only
pnpm --filter @event-platform/frontend dev
```

---

## Pages & Features

| Route | Page | Who |
|-------|------|-----|
| `/` | Home — redirects based on auth | All |
| `/browse` | Browse events grid + AI search + category filters | All |
| `/events/:id` | Event detail — register/cancel CTA with contextual states | All |
| `/login` | Login form | Unauthenticated |
| `/signup` | Signup form | Unauthenticated |
| `/events/new` | Create event form (rich markdown editor) | Organizer |
| `/events/:id/edit` | Edit event form | Organizer |
| `/my-events` | Organizer dashboard — manage own events | Organizer |
| `/my-registrations` | Attendee view of registered events | Attendee |

### Event detail action states
The detail page resolves one of five action states based on context:

| State | Condition |
|-------|-----------|
| Not logged in | User has no session |
| Registered | User has an active registration |
| Event full | `registeredCount >= capacity` |
| Own event | Viewing an event you organized |
| Ended | Event date has passed |

### AI Search
The search box on `/browse` sends the raw query to `POST /search/parse`. The response includes both the AI-inferred filters and the matching events. Inferred filters appear as removable chips above the results so users can see — and undo — what the model parsed.

---

## Styling

- **Tailwind CSS v4** utilities via `@tailwindcss/vite` plugin (no `tailwind.config.js` needed)
- **CSS Modules** (`*.module.css`) for component-scoped styles
- Mobile-first responsive layout; desktop enhancements at wider breakpoints
- Shimmer skeleton `LoadingBlocks` component for all loading states
- `Sonner` toasts for success/error feedback

---

## Testing

```bash
pnpm test
```

Tests use **Vitest** + **Testing Library** (`jsdom` environment) and live next to their source files as `*.test.ts` / `*.test.tsx`.

| File | Covers |
|------|--------|
| `src/api/client/index.test.ts` | `apiRequest` — status handling, error envelope parsing, auth header injection |
| `src/api/events/index.test.ts` | Event API helpers — request shape and response mapping |
| `src/components/confirm-dialog/index.test.tsx` | Render, open/close, confirm/cancel callbacks |
| `src/hooks/use-is-mobile/index.test.tsx` | Breakpoint detection across viewport sizes |
| `src/utils/event-form-validation/index.test.ts` | Form schema — valid inputs, required fields, date ordering |

---

## Production Build & Deployment

### Build

```bash
# Set VITE_API_BASE_URL to your production API URL first
pnpm build
# Output: dist/
```

### Deploy to S3 + CloudFront

`serverless.yml` provisions:
- S3 bucket (private) holding the `dist/` assets
- CloudFront Origin Access Identity → bucket policy
- CloudFront distribution with HTTPS redirect, `CachingOptimized` policy for assets, `no-cache` for `index.html`
- SPA routing: 403 and 404 responses rewrite to `/index.html`

```bash
pnpm build   # must run first
pnpm deploy  # or: serverless deploy --stage prod
```

CloudFront URL is exported as a CloudFormation output (`CloudFrontUrl`).

**Cache invalidation after redeploy:**
```bash
aws cloudfront create-invalidation \
  --distribution-id <CloudFrontDistributionId> \
  --paths "/*"
```

Full deployment notes: [root README — Deployment](../../README.md#deployment).

---

## What We Could Do More

- **Testing** — route smoke tests, critical page flows with MSW mocks, accessibility checks (axe-core + RTL)
- **Performance** — lazy-load `@mdxeditor/editor`, route-based code splitting, tighten Vite bundle size warnings
- **Accessibility** — standardize focus trapping across all dialogs and menus; ARIA roles on custom controls
- **Internationalization** — extract all copy, localized date/number formatting, RTL layout support
- **Offline / resilience** — stale-time tuning in TanStack Query, global error boundary, retry policies
- **UX** — optimistic registration updates, richer empty states, consistent skeleton coverage, event cover images (needs backend support)
