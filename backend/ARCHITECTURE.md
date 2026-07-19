# Backend architecture

Sagittarius backend is a **modular monolith**: one deployable API process,
layered Cargo crates, feature modules inside each layer.

## Workspace crates

```
backend/crates/
  domain/      # types, patches, capabilities, ServiceError (crate: sagittarius-domain)
  db/          # SQLx models + queries (crate: sagittarius-db)
  realtime/    # in-process trip event hub + replay (crate: sagittarius-realtime)
  app/         # use-cases, AppState, auth, mutation kernel (crate: sagittarius-app)
  api/         # Axum HTTP, bins, integration tests (crate: sagittarius-api)
```

Dependency rule (enforced by Cargo):

```
api → app → db → domain
       ↘ realtime → db
api → domain   (DTO / error mapping only)
```

- `domain` must not import axum. It may depend on `sqlx` only for
  `From<sqlx::Error>` on `ServiceError` (so `?` works in `app`/`db` call sites).
- `app` must not import axum.
- HTTP handlers must not call sqlx directly; go through `app` (WebSocket
  auth uses `app::trip_stream`).

SQL migrations live in `backend/migrations/` (applied by `sagittarius-migrate`).

## Feature modules

Prefer the same feature names across layers (`account`, `trip`, `itinerary`,
`expenses`, `members`, `bookings`, `plans`, `briefings`, `places`, `photos`,
`tasks`, plus shared/kernel helpers).

HTTP routes are composed per feature via `api::<feature>::routes()` merged in
`api::api_v1()`.

## Trip create: guest bootstrap vs account

- `POST /api/v1/public/trips` — **unauthenticated** guest bootstrap from a
  destination seed. Creates a trip + owner member with `NULL user_id`, returns
  a **member session** only (never an account/user session). Account audit
  events are skipped (no user id).
- `POST /api/v1/account/trips` — **account-session required**. Creates a claimed
  owner member with `user_id` set and returns the same trip + member-session
  shape after auth.

Do not weaken account-create auth for landing convenience; wire public Start
Planning to the guest bootstrap path instead.

## OpenAPI

- `GET /api/v1/openapi.json` — machine-readable OpenAPI 3 document
- `GET /api/docs` — interactive Scalar (or docs) UI over that document
- WebSocket `/trips/{trip_id}/events/stream` is out of OpenAPI path coverage

## Mutation scaffolding

Trip-scoped writes should prefer `sagittarius_app::kernel::MemberMutation`:

1. Hash session token and load active member
2. Check capability (one or any-of)
3. Reject duplicate `clientMutationId`
4. Run feature logic in the open transaction
5. `commit_publish` realtime events

Optimistic concurrency still uses `expectedVersion` and
`version_conflict` / `VersionConflictWithLatest` as documented in `PRODUCT.md`.

## Tests

- Unit tests live next to code in each library crate
- Contract / HTTP tests stay in `api/tests/`
- `sagittarius-api` re-exports `app` / `db` / `domain` / `realtime` for test
  convenience (`pub use sagittarius_* as …` in `lib.rs`)
