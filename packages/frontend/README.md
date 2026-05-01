# Event Platform — Frontend

React (TypeScript) client for browsing events, organizer workflows, attendee registration, and AI-assisted search.

## Role in the monorepo

Consumes the REST API via `VITE_API_BASE_URL` and shares validation/types with the server through **`@event-platform/shared`**.

## Prerequisites

Same as the [root README](../../README.md): Node 20+, pnpm, repo `.env` with at least:

- `VITE_API_BASE_URL` — API origin (e.g. `http://localhost:3001` locally or your deployed API URL for production builds).

## Scripts

Run from **`packages/frontend`** (or use `pnpm --filter @event-platform/frontend <script>` from the repo root):

| Script       | Purpose                          |
| ------------ | -------------------------------- |
| `pnpm dev`   | Vite dev server (port 3000)      |
| `pnpm build` | Typecheck + production bundle    |
| `pnpm typecheck` | `tsc --noEmit`               |
| `pnpm test`  | Vitest (unit / component tests)  |

Parallel dev with the API: from repo root run `pnpm dev` (runs backend + frontend).

## Layout (high level)

- `src/pages/` — route-level screens (browse, auth, organizer, registrations, event detail/edit).
- `src/components/` — reusable UI (cards, dialogs, search, markdown, layout).
- `src/api/` — fetch helpers (`apiRequest`, event/registration/search/auth clients).
- `src/stores/` — Zustand (auth session).
- `src/utils/` — theme helpers, **event form validation** (`eventFormValidation.ts`).
- `src/hooks/` — shared hooks (`useIsMobile`, etc.).
- Styles: Tailwind utilities in `styles.css`; **CSS Modules** per component/page (`*.module.css`).

## Testing

Vitest + Testing Library (`jsdom`). Tests live next to sources as `*.test.ts` / `*.test.tsx` (see `vite.config.ts`).

## Production build

```bash
pnpm build
```

Deploy the **`dist/`** output to static hosting (Amplify, S3 + CloudFront, etc.). Rebuild whenever `VITE_API_BASE_URL` changes.

Full deployment notes: [root README — Deployment](../../README.md#deployment-notes).

---

## What we could do more (frontend)

- **Testing**: broaden coverage beyond API helpers, dialog, hooks, and form validators — e.g. routing smoke tests, critical page flows with MSW mocks, accessibility checks (axe/RTL).
- **Performance**: lazy-load heavy editors (MDX Editor), route-based code splitting, tune bundle size warnings from Vite.
- **Accessibility**: deeper keyboard/screen-reader polish on dialogs, menus, and forms; focus trapping already partially handled — could standardize.
- **Internationalization**: extract copy, date/number formatting, RTL if needed.
- **Offline / resilience**: stale-time tuning for React Query, global error boundary, retry policies for flaky networks.
- **UX**: richer empty states, optimistic updates for registrations, skeleton consistency, image uploads for events (would need backend support).
