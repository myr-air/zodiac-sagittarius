# Changelog

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
- Guest/public trip create API delivered in 0.11.0 (#172); EN/TH landing switch deferred (#173)

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
- Request/response OpenAPI schemas still use `serde_json::Value` placeholders (#171)
