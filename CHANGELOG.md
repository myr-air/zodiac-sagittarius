# Changelog

## [0.18.0] — 2026-07-20

### Added
- Account settings at `/portal/settings`: identity strip, profile/locale/hometown forms with dirty Save PATCH
- Hometown city Open-Meteo typeahead (country derived); passkeys list + add; trusted devices list + revoke
- Coming soon Connections (Google/social) and Security (email/password/TOTP/close) chrome — labeled, non-acting

### Notes
- Mission M7YH2KNV; passkey remove and logout chrome omitted (no DELETE passkey route; draft has no logout); live APIs only


## [0.17.0] — 2026-07-20

### Added
- Post-create join credentials step: show one-shot `joinId` + `joinPassword` (landing + portal) before `/trips/{id}`; Continue/Skip allowed
- Shared `destination_geo` fill from destination label for public and account slim create (Open-Meteo best-effort)

### Changed
- Destination geo no longer invents Thailand/TH/Asia/Bangkok for non-TH labels; on miss keep label with unknown/neutral country fields
- Portal credentials handoff uses fullscreen Postcard Atlas shell (replaces trips chrome)

### Notes
- Mission M7YF0YYY; origin Bangkok defaults when origin omitted unchanged; password rotate/reset out of scope

## [0.16.0] — 2026-07-20

### Added
- Slim signed-in trip create: `POST /api/v1/account/trips` accepts name and/or destinationLabel; server fills join id/password, Main Plan, and owner session (`joinPassword` returned once)
- `POST /api/v1/account/classify-trip-seed` — NL → structured seed + style/place/season recommendations (heuristic; LLM-ready)
- Shared create-trip compose/classify helpers; landing guest create uses classify → public trip bootstrap
- Portal Create trip: NL seed → Understand with AI → editable review (when modes) → account create → `/trips/{id}`

### Changed
- Auto join ids use all-uppercase `{yymm}-{SLUG4}-{suffix4}` (month-scoped count); join lookup is case-insensitive

### Notes
- Mission M7XXVC84; full v34 wizard deferred (compact portal slice + approved draft as north-star)

## [0.15.0] — 2026-07-20

### Added
- Portal shell: signed-in account home at `/portal` with primary nav Home · Explore · Trips · Friends · Settings
- `/portal/trips` passport booklet list loaded from `GET /account/trips`, with client Upcoming/Planning/Past/All filters and search
- Explore / Friends / Settings stub pages sharing portal nav chrome

### Changed
- Account auth success (password / email / passkey) navigates to `/portal`; bare `/trips` redirects to `/portal`
- Trip cockpit remains `/trips/{id}`; guest create-trip and trip-access unchanged

### Notes
- Mission M7XKCPVU; Create trip / Import on the portal list deferred
- Approved UI: H passport booklet (atlas-token materials)

## [0.14.1] — 2026-07-20

### Fixed
- Landing `/` infinite reload from unstable empty recent-search `useSyncExternalStore` snapshots

### Notes
- Mission M7XJVDUV; freeze shared empty list identity for server + empty client reads

## [0.14.0] — 2026-07-19

### Added
- Authenticated account home on `/trips`: Navica-style top nav and draft-v3 compose grid (stories ∥ friends map; upcoming trips; places ∥ itinerary)
- Live bind for greeting (`GET /account`), trip cards (`GET /account/trips`), and itinerary summary (`GET /account/explorer`)
- Visual placeholders for stories, friends location, and place guides (no social/geo/POI APIs)

### Notes
- Mission M7X8ZO5N; orange Details/date accents match approved draft (exception vs primary teal ops tokens)
- `/trips/[id]` remains the per-trip cockpit route

## [0.13.0] — 2026-07-19

### Added
- Typed OpenAPI request/response schemas (`ToSchema` on domain/app wire types and API DTOs); named `components.schemas` in `/api/v1/openapi.json` (#171)
- Optional `openapi` Cargo features on `sagittarius-domain` and `sagittarius-app`
- Landing header EN/TH locale switch shared with auth via `joii.auth.locale` (#173)
- Auth draft-v3 polish: desktop thumbnail rail, trip tip callout, kicker spacing, `radius-sm` trip inputs (#174)

### Notes
- Nested expense/itinerary JSON bags remain OpenAPI `Object` until typed later
- Closes #171, #173, #174

## [0.12.0] — 2026-07-19

### Added
- Account auth pages: `/login`, `/register` with password, email code, and passkey flows against `/api/v1`
- Trip access page `/trip-access` (invite resolve → claimable member → member session → `/trips/{id}`)
- Account trips stub `/trips`; EN/TH auth copy with frozen locale (`joii.auth.locale`)
- Landing Log in / Trip access links wired to the new routes

### Fixed
- Landing recent-searches `useSyncExternalStore` snapshot identity loop
- Hero parallax and Switzerland destination media; primary CTA text on teal fills

### Notes
- Draft-parity polish delivered in 0.13.0 (#174)
- Mission M7X4UTQL

## [0.11.0] — 2026-07-19

### Added
- Unauthenticated `POST /api/v1/public/trips` guest bootstrap from a destination seed (member session, no account login)
- Landing Start Planning wired to public bootstrap; stores member session and opens `/trips/{id}` placeholder
- Contract coverage for public bootstrap vs auth-gated `POST /api/v1/account/trips`

### Notes
- Guest owner members use `NULL user_id`; claiming into an account remains later work
- Closes #172 (Phase 2 guest create)

## [0.10.0] — 2026-07-19

### Added
- Joii Postcard Atlas public landing (`/`): parallax hero, single destination query, Start Planning → `#create` stub (no auth wall)
- Landing modules: trip ideas, popular destinations, trip access band, recent searches (localStorage), planning tips, footer
- Unit tests for parallax offset, plan-query enablement, and recent-search persistence

### Notes
- Guest/public trip create API delivered in 0.11.0 (#172); EN/TH landing switch delivered in 0.13.0 (#173)

## [0.9.0] — 2026-07-19

### Added
- OpenAPI 3 document at `GET /api/v1/openapi.json` (utoipa)
- Interactive Scalar docs at `GET /api/docs`
- Bidirectional OpenAPI route coverage contract tests
- Layered backend workspace crates (`domain` / `db` / `realtime` / `app` / `api`)
- Joii v2 frontend shell reset (landing stub)
- `docs/learned.md` knowledge log

### Changed
- Squashed backend migrations into a trip-plan baseline
- Consolidated product docs (`AGENTS.md`, `PRODUCT.md`, `DESIGN.md`) and Makefile entrypoints

### Notes
- WebSocket `/trips/{trip_id}/events/stream` is out of OpenAPI path coverage
- Typed request/response OpenAPI schemas delivered in 0.13.0 (#171)
