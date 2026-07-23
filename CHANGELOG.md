# Changelog

## [0.28.1] — 2026-07-23

### Fixed
- Frontend `react-hooks/set-state-in-effect` and `react-hooks/refs` lint errors that blocked `bun run lint` / verify

### Added
- Calm Plan Day header drop-active chrome (`data-drop-active`) during reorder drag-over, cleared on leave/drop/dragend

### Notes
- Closed #185 #186

## [0.28.0] — 2026-07-23

### Added
- Cross-day Plan Day drag-and-drop: stop day PATCH plus dual-scope order persist; plan-block day moves cascade to nested children in one statement
- Draft itinerary field-bag keys (`from`/`to`/`by`/`meal`) map and hydrate through API `details` (`origin`/`destination`/`mode`/`meal`) with merge so sibling extras survive PATCH

### Notes
- Closed #177 #178 #179 (M82GSOYG); Playwright visual-verify restored via skill-local `@playwright/test` install
- Closed #184: live `/trips/{id}` Alternative Path chrome smoke verified (fork parent “Currently using…”, expanded options with Using chip, Path strip)


## [0.27.0] — 2026-07-23

### Added
- Alternative Path product UI on the Smart Itinerary Table: fork parent stop-row with expandable options, radio active-path pick, and Path strip assign / add alternative / clear

### Changed
- PRODUCT.md §5 marks Alternative Path fork / active-path pick as shipped in the Joii UI

### Notes
- Mission M827T84Q (roadmap itinerary-band-c-complete M3); live `/trips/{id}` path screenshot smoke tracked as #184


## [0.26.1] — 2026-07-23

### Changed
- Ignore `.playwright-cli/` QA artifacts; document AFK browser verify matrix in AGENTS.md

## [0.26.0] — 2026-07-23

### Added
- Place resolve picker, itinerary import (normalize → sequential create/PATCH append), and sibling overlap day-cues on the Smart Itinerary Table

### Fixed
- Cockpit UX honesty: Import Escape close, Demo weather badge, calm Join ID trip-access copy, human date range, Days toggle contrast, unified rail empty cue
- Bound `globalThis.fetch` for itinerary mutations; draft start/end times persist on create; conflict lock clears after reload

### Notes
- Missions M81HY2YR (M2 places/bulk ingest) + M81LW2UJ (UX fix-pass); roadmap itinerary-band-c-complete


## [0.25.0] — 2026-07-22

### Added
- Smart itinerary table M1 write-path: nested sub-activity CRUD, mutation round-trip, context-rail PATCH, planVariantId switch, honest chrome

### Changed
- PRODUCT.md §5 marks cockpit shell / Smart itinerary table / plan filter rows for shipped M1 behavior

### Notes
- Mission M81DDKSC (roadmap itinerary-band-c-complete M1)


## [0.24.2] — 2026-07-22

### Fixed
- Guest create Continue/Skip leave `#create` and open `/trips/{id}` with durable pending-join resume and Open your trip
- Days/Table cockpit load failures show alert + Retry; empty Days spine offers recovery after load settles
- Local API base fallback, bound fetch for cockpit load, landing-reveal hydrate, and kill-switch for legacy `joii-v2` service worker

### Notes
- Closes #180–#183; mission M81AHX9V


## [0.24.1] — 2026-07-22

### Fixed
- Default OpenRouter model is the official Free Models Router (`openrouter/free`); only `OPENROUTER_API_KEY` is required

### Notes
- `OPENROUTER_MODEL` / `OPENROUTER_MODELS` remain optional server overrides until account settings own model preference


## [0.24.0] — 2026-07-22

### Added
- Shared OpenRouter helper with model rotation (`OPENROUTER_MODELS` or primary + free defaults)
- Auto-switch on 408/429/502/503/529 for day-plan-assist, place resolve, and itinerary import

### Notes
- Free-tier account RPM/RPD is shared across `:free` models; rotation recovers from per-model/provider limits, not the account free ceiling


## [0.23.0] — 2026-07-22

### Added
- Day workspace at `/trips/{id}/days`: Theme A Calm Travel Ops canvas with Table ↔ Days cross-links
- Day folder tabs + `+ day`, collapsible type-correct timeline, inline Details, time-edit dialog
- MapLibre day map (OpenFreeMap Positron) with auto-pins and ordered polyline when ≥2 pins
- OpenRouter day-plan-assist Suggest / Auto-route & fill (≤3 options with Why); Accept applies itinerary mutations and auto-rejects siblings
- Inline AI suggestion chips under related stops with Why / Accept·Reject dialog; topbar + map Auto route pin gate

### Notes
- Mission M80VKAX5; stub provider `SAGITTARIUS_DAY_PLAN_ASSIST_PROVIDER=stub` for contract tests; full indirect context packing and Theme A polish I1–I7 deferred


## [0.22.0] — 2026-07-22

### Added
- Itinerary Phase 2: stroke type icons, overnight duration rail, day collapse persistence, Share stub
- Within-day Reorder with itinerary-items/order PATCH; sub-activity chevron tree
- Type-shaped field bags, Meal/By title-line choice chips, note/link/time-setup dialogs

### Fixed
- Main Plan itinerary filter uses activePlanVariantId when it diverges from mainTripPlanId
- Pre-existing frontend typecheck/build failures (passkey-register, CreateTripForm test, portal-nav, Vitest projects)
- Draft Reorder stop-drag grid and Share command button styles

### Notes
- Mission M80P3JXX; closes #175 #176; follow-ups #177 #178 #179


## [0.21.0] — 2026-07-22

### Added
- Trip workspace on `/trips/{id}`: Calm Travel Ops shell, TripCockpit load, Main Plan switcher
- Smart Itinerary Table (day spine, time-rail | body stops, Quick add, inline edit, selection rail)
- Draft CSS port for cockpit chrome; focused Vitest for trip modules

### Notes
- Mission M7ZNU364; Phase 2 polish + verify typecheck fixes tracked in M80P3JXX (#175, #176)



## [0.20.0] — 2026-07-21

### Added
- Authenticated change-password (`POST /account/password`) and Settings Password accordion
- Passkey remove (`DELETE /account/passkeys/{id}`) with confirm dialog
- Close account soft-disable (`POST /account/close`) with danger dialog; revokes all sessions
- City and Timezone searchable picker dialogs; compact Connections Coming soon stub

### Changed
- Trusted device Revoke uses confirm dialog; Security dialogs share backdrop/scrim chrome
- Email / TOTP remain summary-only Coming soon; Explore / Friends stay stubs

### Notes
- Mission M7ZG5WPD; OAuth Connections and TOTP/email-change deferred; passkey-only set-first-password edge case deferred



## [0.19.0] — 2026-07-21

### Added
- Portal primary nav sliding navy active indicator (measured translate3d + width) with hybrid mid-bridge stretch, soft corners, mild squash, and settle ≤220ms
- Clip-path label expand/collapse (~360ms) on the current item; `prefers-reduced-motion` instant snap

### Changed
- Replaced per-link liquid ink-fill bloom with a shared `portal-nav-indicator` under `nav.portal-nav-links`

### Notes
- Mission M7ZDUD7N; PortalNav remains per-page chrome with module-scoped prev href for soft-nav remounts


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
