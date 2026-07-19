# Joii / Sagittarius — Agent Instructions

Complementary guidance for coding agents. Human-facing product and architecture
live in `PRODUCT.md`. Visual identity lives in `DESIGN.md`
([getdesign.md](https://getdesign.md/) / [DESIGN.md format](https://github.com/google-labs-code/design.md)).

Public brand: **Joii**. Repo / zodiac codename: **Sagittarius**.

## Project overview

Sagittarius is a group-trip planning system: organizers, travelers, and viewers
collaborate on trip plans, itinerary, members, commitments, and shared costs.

Current state:

- **Backend:** layered Cargo workspace (`sagittarius-domain` → `db` →
  `realtime` / `app` → `sagittarius-api`) with Axum + PostgreSQL, sessions,
  passkeys, trip plans, itinerary, expenses, members, and WebSocket trip
  event streams. See `backend/ARCHITECTURE.md`.
- **Frontend:** Joii greenfield Next.js shell (landing stub). Rebuild the
  cockpit against `DESIGN.md` and the live `/api/v1` backend; do not resurrect
  the pre-reset SPA from git history without an explicit request.

## Repository map

| Path | Role |
|------|------|
| `frontend/` | Joii Next.js app (Bun), port `5180` |
| `backend/` | Cargo workspace (`sagittarius-*` crates), port `5181` |
| `backend/ARCHITECTURE.md` | Backend crate map and dependency rules |
| `docker-compose.yml` | Production-style web + API containers |
| `Makefile` | Dev and verify entrypoints |
| `PRODUCT.md` | System design, domain, architecture |
| `DESIGN.md` | UI tokens and visual rules |
| `.space/` | Local agent/mission/legacy archive — never commit |

## Dev environment

```bash
# API (Postgres required)
make backend-dev          # http://127.0.0.1:5181

# Web
make frontend-dev         # http://127.0.0.1:5180

# Checks
make verify               # frontend verify + backend tests
make db-init              # create + migrate local DB
```

Env templates:

- `backend/.env.example` → `backend/.env` for local API
- `.env.example` → optional root local defaults
- `.env.production.example` → `.env.production` for Compose

Package manager for the web app is **Bun**. Backend is **Cargo**.

Prefer focused unit/API tests for backend domain changes. Add frontend tests
when UI behavior exists beyond the landing stub.

## Code conventions

- Follow `DESIGN.md` for all UI. Cockpit = dense Calm Travel Ops; landing =
  Postcard Atlas. Prefer Tailwind + CSS variable tokens
  (`text-(--color-text-muted)`, `bg-(--color-surface)`, etc.).
- Keep public copy branded **Joii**. Sagittarius stays internal.
- Domain language and contracts in `PRODUCT.md` are normative (Trip Plan, Main
  Plan, plan-scoped records, Actual Expense vs Plan Estimate, itinerary
  hierarchy). Do not invent alternate product names for the same concepts.
- Backend mutations that use optimistic concurrency must send `expectedVersion`
  and handle `version_conflict` by reloading before retry.
- Path / plan fields (`pathGroupId`, `pathId`, `pathName`, `pathRole`, trip plan
  ids) are data-contract fields — keep UI, import/export, and API patches in
  sync when those features return.
- Do not commit `.space/`, secrets, `.env*`, or generated QA artifacts.

## Frontend rebuild guidance

When extending Joii:

1. Read `PRODUCT.md` for the capability and API boundary.
2. Read `DESIGN.md` before inventing layout or color.
3. Wire to existing `/api/v1` routes; do not invent a parallel API.
4. Desktop-first cockpit: Smart Itinerary Table as source of truth; context
   nearby in a right rail / inspector — not a marketing dashboard.

## Security

- Never log session tokens, passkey material, or password hashes.
- Do not weaken CORS, auth, or version checks “for convenience” in production
  paths.
- Do not write exploits, malware, or attack scripts against any system.

## Completion and git

- Commit only when the user asks (or when they explicitly want the finished
  task committed). Prefer Conventional Commits:
  `feat(frontend): …`, `fix(api): …`, `docs: …`.
- Do not push unless asked.
- Do not use `--force` on `main` / `master`.
- If you discover issues you are not fixing, open a GitHub issue with context,
  impact, and verification criteria — do not recreate a local `issues.md`
  index.

## Deployment

Merges to `main` are expected to publish via Docker Compose
(`.env.production` from `.env.production.example`) and the Cloudflare path for
Joii hosts. After route changes, smoke `/trips`, map, and auth when those
surfaces exist again.
