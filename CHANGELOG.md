# Changelog

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
