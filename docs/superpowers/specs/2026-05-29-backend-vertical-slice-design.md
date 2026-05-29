# Sagittarius Backend Vertical Slice Design

## Goal

Build the first Rust/PostgreSQL backend slice for the Sagittarius web frontend:
join a trip, claim or resume a participant session, load the planning cockpit
payload, update itinerary rows, create and resolve suggestions, manage checklist
tasks, enforce role permissions, and stream collaborative changes over
WebSocket.

## Scope

This slice implements the frontend integration path described in
`docs/api-data-spec.md` and the TypeScript models in `src/trip/types.ts`.
It includes REST endpoints, a PostgreSQL schema and migrations, a transaction
event log, WebSocket replay/broadcast, and integration tests for the explicit
role and concurrency rules.

The slice does not implement expenses mutation, documents, invitations,
permanent user accounts, or gRPC service contracts. The Rust service is shaped
so a tonic/gRPC transport can later call the same application services without
duplicating business logic.

## Architecture

Create a Rust workspace under `backend/` with Rust 1.95 pinned in
`rust-toolchain.toml` and edition 2024 in `Cargo.toml`.

Use a small layered service:

- `api`: axum routes, extractors, JSON DTOs, WebSocket upgrade.
- `app`: use cases for join, session, trip load, itinerary, suggestions, tasks,
  permissions, and event publishing.
- `db`: sqlx repositories and transaction helpers.
- `domain`: enums, capability checks, patch validation, and error types.
- `realtime`: event persistence, missed-event replay, and in-process broadcast.

The frontend uses REST for bootstrap and mutations. WebSocket is used after the
REST bootstrap for collaboration events and supports `?afterEventId=` replay.
The event log is stored in Postgres so clients can recover missed events after
a reconnect.

## Transport

REST base path is `/v1`.

Initial endpoints:

- `POST /v1/trips/join`
- `POST /v1/trips/:tripId/members/:memberId/claim`
- `POST /v1/trips/:tripId/members/:memberId/login`
- `POST /v1/trips/:tripId/member-session/logout`
- `GET /v1/trips/:tripId`
- `PATCH /v1/itinerary-items/:itemId`
- `POST /v1/trips/:tripId/suggestions`
- `POST /v1/suggestions/:suggestionId/approve`
- `POST /v1/suggestions/:suggestionId/reject`
- `POST /v1/trips/:tripId/tasks`
- `PATCH /v1/tasks/:taskId`
- `GET /v1/trips/:tripId/ws`

Every authenticated endpoint accepts a bearer member-session token. The join
endpoint returns safe trip metadata and claimable members without exposing
password hashes. Claim and login return a session token plus timestamps matching
`TripParticipantSession`.

## Data Model

Start from the SQL model in `docs/api-data-spec.md` and add `trip_tasks`,
because the frontend already renders and mutates `TripTask` values.

```sql
CREATE TABLE trip_tasks (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  title text NOT NULL,
  status text NOT NULL CHECK (status IN ('open', 'done')),
  visibility text NOT NULL CHECK (visibility IN ('private', 'shared')),
  kind text CHECK (kind IN ('prep', 'booking')),
  created_by uuid NOT NULL REFERENCES trip_members(id),
  assignee_id uuid REFERENCES trip_members(id),
  related_item_id uuid REFERENCES itinerary_items(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1
);

CREATE INDEX trip_tasks_trip_visibility_status_idx
  ON trip_tasks (trip_id, visibility, status, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX trip_tasks_assignee_status_idx
  ON trip_tasks (assignee_id, status, updated_at DESC)
  WHERE deleted_at IS NULL;
```

Other additions to the draft schema:

- `realtime_events` includes `version bigint NOT NULL` and
  `aggregate_type text NOT NULL` so WebSocket envelopes can be built without
  refetching the aggregate.
- `realtime_events (trip_id, id)` is indexed for UUIDv7 replay order.
- `trip_member_sessions (session_token_hash)` remains unique; raw tokens are
  returned once and stored only as hashes.
- write idempotency is enforced by a unique index on
  `(trip_id, created_by, client_mutation_id)` where `client_mutation_id IS NOT NULL`.

Public IDs are UUIDv7. Timestamps are UTC. Soft-deleted rows are omitted from
normal list payloads.

## Permissions

The backend is the source of truth for capabilities:

| Capability | Owner | Organizer | Traveler | Viewer |
| --- | --- | --- | --- | --- |
| View trip plan | Yes | Yes | Yes | Yes |
| Edit itinerary directly | Yes | Yes | No | No |
| Create suggestions | Yes | Yes | Yes | No |
| Review suggestions | Yes | Yes | No | No |
| Create shared tasks | Yes | Yes | Yes | No |
| Create private tasks | Yes | Yes | Yes | No |
| Update own private tasks | Yes | Yes | Yes | No |
| Manage participants | Yes | Yes | No | No |

Disabled members cannot authenticate, load trip data, mutate rows, or subscribe
to WebSocket events. Owner role cannot be reassigned in this slice.

## Write Rules

All mutations run in a single Postgres transaction:

1. Authenticate the session token and lock the active member row.
2. Verify the member belongs to the target trip and is active.
3. Check the required capability.
4. Validate the JSON patch against allowed fields.
5. Check `expectedVersion` when the request targets a versioned row.
6. Apply the mutation and increment `version`.
7. Insert a `realtime_events` row with `clientMutationId`.
8. Commit and publish the event through the in-process broadcaster.

If `expectedVersion` does not match, return `409 Conflict` with the latest
entity and no event. If an idempotent `clientMutationId` repeats after a
successful write, return the prior response body and do not insert a duplicate
event.

Suggestion approval updates the target itinerary item and resolves the
suggestion in the same transaction. If the target item version no longer matches
`sourceVersion`, mark the suggestion `conflicted` and return `409 Conflict`.

## Read Payload

`GET /v1/trips/:tripId` returns one planning cockpit payload:

- `trip` metadata with active plan variant and version.
- `members` with safe fields only.
- `planVariants`.
- active, non-deleted `itineraryItems` sorted by day and sort order.
- pending/recent `suggestions`.
- visible `tasks`: shared tasks plus private tasks created by or assigned to
  the current member.
- `expenseSummary` for roles allowed to view expenses; viewers receive `null`.

The response shape uses camelCase JSON matching the frontend models.

## Realtime

`GET /v1/trips/:tripId/ws` upgrades to WebSocket after member-session auth.
The client may pass `afterEventId`. The server first replays persisted events
for the trip after that UUIDv7 event id, then streams newly committed events.

Initial event types:

- `itinerary_item.updated`
- `suggestion.created`
- `suggestion.resolved`
- `task.created`
- `task.updated`
- `presence.updated`

The event envelope matches `docs/api-data-spec.md`: event id, trip id, event
type, aggregate id, version, client mutation id, actor member id, occurred at,
and payload.

## Error Handling

Return typed JSON errors:

- `400 invalid_request` for malformed input or unsupported patch fields.
- `401 unauthenticated` for missing, expired, revoked, or invalid session token.
- `403 forbidden` for role or disabled-member failures.
- `404 not_found` when the trip/member/item/suggestion/task is not visible to
  the caller.
- `409 version_conflict` for stale `expectedVersion` or conflicted suggestion
  approval.

Error responses include a stable `code`, a human-readable `message`, and an
optional `latest` entity for conflicts.

## Performance Plan

Use axum and tokio with sqlx connection pooling. Keep bootstrap efficient by
loading related lists with bounded, indexed queries inside one request rather
than making the frontend fan out. Keep mutation hot paths allocation-light by
deserializing only known patch structs and using typed enums for role checks.

Use UUIDv7 for index locality. Store event replay state in Postgres and use an
in-process broadcast channel for single-node low latency. The next scale-out
step is Postgres `LISTEN/NOTIFY` or a dedicated message bus behind the same
`realtime` interface.

## Testing

Use TDD for implementation. Required tests:

- join succeeds with valid room credentials and hides password hashes.
- participant claim creates one active session and prevents double-claim.
- login rejects disabled members and wrong passwords.
- trip load returns members, active itinerary rows, suggestions, visible tasks,
  and role-filtered expense summary.
- owner/organizer can patch itinerary items; traveler/viewer cannot.
- stale itinerary patch returns `409` with the latest item.
- traveler can create suggestions; viewer cannot.
- organizer can approve a matching suggestion and conflict a stale suggestion.
- task visibility only exposes private tasks to the creator or assignee.
- mutation writes insert one realtime event and repeated `clientMutationId`
  does not duplicate it.
- WebSocket replay returns events after `afterEventId`.

Local verification uses Rust 1.95. The current machine reports Rust 1.93, so
the implementation plan must include installing or selecting Rust 1.95 before
claiming compile/test verification.
