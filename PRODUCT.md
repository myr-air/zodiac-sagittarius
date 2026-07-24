# Joii Product & System Design

**Public brand:** Joii  
**Project codename:** Sagittarius  
**Status:** Backend production-capable; frontend Joii greenfield rebuild

This document is the system source of truth: product intent, domain model, and
architecture. Visual rules live in `DESIGN.md`. Agent workflow lives in
`AGENTS.md`.

---

## 1. Product purpose

Joii is a travel planning cockpit for group trips. Success means a group can
see the plan, resolve decisions, track members, and manage shared costs without
losing context across itinerary, people, and money.

### Users

| Role | Intent |
|------|--------|
| Organizer / owner | Build and maintain the full trip plan and access |
| Traveler | Review the plan, propose changes, track decisions |
| Viewer | Read the plan without editing |

### Brand personality

Calm, practical, friendly. Trustworthy for long planning sessions with light
travel energy. Public surfaces say **Joii** only; Sagittarius stays internal.

### Experience principles

1. **Desktop planning first.** Root is the Joii landing page; authenticated and
   trip-access routes open the planning cockpit — not a mobile trip-day view as
   the primary metaphor.
2. **Smart Table is the source of truth.** Itinerary edits, day structure,
   ordering, validation, and plan work orbit the table.
3. **Context stays nearby.** A right rail / inspector shows what helps the
   current decision: selection details, route preview, suggestions, budget,
   people.
4. **Minimal, not empty.** Strong hierarchy and obvious actions without
   decorative dashboard chrome.
5. **Backend-honest UI.** Frontend commands map to real `/api/v1` resources and
   versions; no shadow domain that diverges from the API.

### Non-goals (current phase)

- Rebuilding the entire pre-reset frontend in one pass
- Mobile trip mode as the primary experience
- Decorative marketing composition inside the cockpit

---

## 2. System context

```text
┌─────────────┐     HTTPS      ┌──────────────────┐
│  Joii web   │ ─────────────► │  sagittarius-api │
│  Next :5180 │   /api/v1      │  Axum :5181      │
└─────────────┘                │         │        │
                               │         ▼        │
                               │   PostgreSQL     │
                               │         │        │
                               │  WS trip events  │
                               └──────────────────┘
```

| Layer | Technology | Notes |
|-------|------------|-------|
| Web | Next.js 16, React 19, Tailwind 4, Bun | Joii; landing stub today |
| API | Rust, Axum 0.8, Tokio, SQLx | Crate `sagittarius-api` |
| Data | PostgreSQL | Migrations via `sagittarius-migrate` |
| Realtime | WebSocket trip event stream | Role-filtered |
| Auth | Email challenge, password session, passkeys | Bearer sessions |
| Deploy | Docker Compose + Cloudflare Tunnel | Hosts such as `joii.13thx.com` |

Local ports: web `5180`, API `5181`. Production compose runs `sagittarius-web`
and `sagittarius-server` on an internal network plus an external shared Docker
network; the database is external to this compose file.

---

## 3. Domain model

Language below is normative for UI copy, API naming discussions, and tests.

### Trip and access

- **Trip** — shared planning workspace with members and plans.
- **Member roles** — `owner`, `organizer`, `traveler`, `viewer`.
- **Join / invite / claim** — trip access without assuming every user has a full
  account session first.
- **Presence** — who is currently active in the trip (realtime-aware).

### Trip plans

Prefer **Trip Plan** over “sheet” or “plan variant” in product language.

- **Trip Plan** — a complete named version of the itinerary (days, activities,
  sub-activities). A trip may have many plans (real use, drafts, backups,
  proposals).
- **Main Plan** — the plan selected for real-world use. Any plan can become
  main; main is a selection, not an immutable original.
- **Backup Plan / Proposal Plan** — operational fallback vs presentation /
  comparison roles. **Plan Status** (main, draft, proposal, backup) is separate
  from the plan’s display name.
- Compatibility: wire/storage may still expose legacy `planVariants` /
  `activePlanVariantId` alongside `tripPlans` / `mainTripPlanId` during rollout.
  Prefer trip-plan language in new UI.

### Itinerary

- **Itinerary** — ordered plan content grouped by day.
- **Plan Day → Activity → Sub-activity** — one child nesting level only.
- **Activity Block** — an activity that contains sub-activities while remaining
  a real itinerary row.
- **Time Window** — optional start/end; end may fall on a later day
  (`endOffsetDays`). Duration is derived when both ends exist.
- **Flexible Sub-activity** — child without a fixed time; stays inside its
  parent block in manual order.
- **Journey Block / Ticketed Segment** — operational travel window vs the
  specific ticketed flight/train/etc. segment inside it.
- **Activity Type** — broad categories (transport, stay, food, activity, note).
  Specifics (flight, hotel) belong in details or commitments.
- Sibling time overlaps produce **warnings**, not automatic alternate plans.
- **Alternative Path** means an explicit route option the product models — not
  auto-generated “Plan A/B” labels from overlap heuristics.

### Plan-scoped records and money

Records belong to a **specific trip plan** when dates, transport, costs, or
commitments can differ across plans:

- Bookings / tickets / transport documents
- Tasks and activity notes
- Expenses and estimates

Money language:

| Term | Meaning |
|------|---------|
| **Actual Expense** | Money really paid or committed; does not auto-move when main plan changes |
| **Plan Estimate** | Projected cost for comparing/presenting a plan |
| **Plan Commitment** | Real-world booking/reservation; may link to an actual expense |
| **Plan Check Suggestion** | System-detected issue or improvement; advisory until a human acts |

---

## 4. Architecture

### Backend (`backend/`)

Cargo workspace under `backend/crates/` (see [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md)):

| Crate (folder) | Role |
|-------|------|
| `sagittarius-domain` (`crates/domain`) | Domain types, patches, capabilities, `ServiceError` |
| `sagittarius-db` (`crates/db`) | SQLx models and queries |
| `sagittarius-realtime` (`crates/realtime`) | Trip event hub / replay |
| `sagittarius-app` (`crates/app`) | Application services, `AppState`, mutation kernel |
| `sagittarius-api` (`crates/api`) | Axum `/api/v1` HTTP, migrate/seed bins, contract tests |

Feature modules (account, trip, itinerary, expenses, …) are mirrored inside
each layer. HTTP routes are merged per feature via `routes()`.

Migrations: `backend/migrations/`.

**Auth & account**

- Email challenge → session; password session; passkey register/login
- Account portal concerns: trips list, vault, explorer, todos, stats, ownership
- `Authorization: Bearer` for account and member sessions

**Trip surface (representative)**

- Trip load / patch
- Trip plans (plus legacy plan-variant compatibility)
- Itinerary CRUD, reorder, import
- Plan checks / suggestions
- Expenses, bookings, members, presence, tasks, stop notes
- Photo albums, daily briefings, place resolve, exchange rates
- `GET /api/v1/trips/{trip_id}/events/stream` — replay + live events

**Concurrency**

Many patches require `expectedVersion`. On `version_conflict`, clients must
reload authoritative state before retrying.

### Frontend (`frontend/`)

Joii is a greenfield Next App Router app (`package` name `joii`):

- Landing stub with Calm Travel Ops / Postcard Atlas tokens from `DESIGN.md`
- Intended rebuild: auth, trip list, cockpit (table + rails), map, members,
  expenses, bookings — wired to the existing API
- Local legacy UI may exist under `.space/legacy` for reference only

### Integration contract

- Browser → `NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL` (same-origin or explicit API
  host in production)
- Prefer one `/api/v1` namespace; do not reintroduce a parallel `/v1` client
- Realtime: authenticate the trip event stream with the same session model as
  REST; filter expense-sensitive events by role

### Deployment

- Images built from `frontend/Dockerfile` and backend container targets
- Compose with `.env.production` (see `.env.production.example`):
  `docker compose --env-file .env.production up -d`
- External Postgres + shared Docker network for host integration
- Publish via Cloudflare Tunnel to Joii / Sagittarius hostnames

---

## 5. Capability map

| Capability | Backend today | Joii UI today | Target UI |
|------------|---------------|------------------|-----------|
| Public landing | — | Stub | Postcard Atlas landing |
| Auth (email / password / passkey) | Yes | No | Full |
| Account portal / my trips | Yes | No | Full |
| Trip cockpit shell | Yes (data) | Yes (desktop shell; plan filter; honest chrome stubs) | Desktop cockpit |
| Trip plans (main/draft/…) | Yes | Partial (visible-plan filter by planVariantId; set-main deferred) | First-class |
| Smart itinerary table | Yes (API) | Yes (M1 write-path + M2 place resolve / sibling overlap cues / itinerary import) | Source of truth |
| Place resolve | Yes (`places/resolve`) | Yes (table place-cell Resolve → resolve → PATCH; not silent geocode) | Explicit resolve |
| Itinerary import | Yes (`itinerary-imports` normalize) | Yes (preview → sequential CRUD append into visible plan; no bulk-write API) | Import into plan |
| Sibling overlap warnings | — | Yes (Smart Itinerary Table warnings only; not plan-check inspector) | Table cues |
| Alternative Path (fork / active-path pick) | Yes (`pathGroupId`/`pathId`/`pathName`/`pathRole`) | Yes (fork parent stop-row + expandable subplan options; radio active-path pick; Path strip assign / add alternative / clear on Smart Itinerary Table) | Full authoring surface |
| Map / timeline | Partial/API | No | Context + routes |
| Members / join / presence | Yes | No | Full |
| Expenses / estimates | Yes | No | Plan-scoped |
| Bookings / commitments | Yes | No | Plan-scoped |
| Plan check suggestions | Yes | Yes (near-issue inline cues + selected-stop Context rail triage; empty rail = Run check / stale / honest empty — not a full-plan queue) | Joii inspector (M4) |
| Realtime trip events | Yes | No | Live sync |

---

## 6. Quality and delivery bar

- Domain and API changes need automated tests (`make verify` / focused crate
  tests).
- UI that ships user-visible behavior should pass `bun run verify:frontend` and
  a real browser smoke of the changed flow.
- Production publishes via Docker Compose + Cloudflare; smoke `/trips`, map, and
  auth when those routes exist again.
- Accessibility: semantic controls, visible focus, readable contrast, stable
  responsive layout, restrained motion — EN/TH capable labels.

---

## 7. Document roles

| File | Owns |
|------|------|
| `PRODUCT.md` | Why the product exists, domain language, system architecture |
| `DESIGN.md` | How it looks and behaves visually (tokens + rationale) |
| `AGENTS.md` | How agents build, test, and change this repo |

When these conflict with stale comments in code, update the code or this file —
do not reintroduce a large `docs/` tree for living truth.
