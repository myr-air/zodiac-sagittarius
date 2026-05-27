# Sagittarius API Data Spec

Status: frontend contract draft, ready for Rust + PostgreSQL backend design.
Version: 2026-05-27.

## Goals

- Store a collaborative trip plan with plan variants, itinerary rows, suggestions, expenses, documents, and member presence.
- Keep the Smart Itinerary Table as the source of truth.
- Support optimistic concurrency from the frontend using `version`, `updatedAt`, and `clientMutationId`.
- Stream collaborative changes over WebSocket without requiring a page refresh.

## Identity And Conventions

- Public IDs are UUIDv7 strings in API responses.
- All timestamps are ISO 8601 UTC.
- Money is stored as integer minor units: `amountMinor`, plus `currency`.
- Soft deletes use `deleted_at`; normal list endpoints omit deleted rows.
- Every write accepts `clientMutationId` for idempotency and UI reconciliation.

## PostgreSQL Storage Model

```sql
CREATE TABLE trips (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  destination_label text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  active_plan_variant_id uuid,
  owner_member_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1
);

CREATE TABLE trip_members (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  user_id uuid,
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'organizer', 'traveler', 'viewer')),
  presence text NOT NULL DEFAULT 'offline',
  color text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE plan_variants (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('main', 'backup', 'draft', 'split')),
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1
);

CREATE TABLE itinerary_items (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  plan_variant_id uuid NOT NULL REFERENCES plan_variants(id),
  day date NOT NULL,
  sort_order integer NOT NULL,
  start_time time,
  activity text NOT NULL,
  activity_type text NOT NULL,
  place text NOT NULL,
  link_label text NOT NULL DEFAULT 'แผนที่',
  map_link text NOT NULL DEFAULT '',
  address text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  duration_minutes integer,
  transportation text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  advisories jsonb NOT NULL DEFAULT '[]',
  created_by uuid NOT NULL REFERENCES trip_members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1
);

CREATE TABLE suggestions (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  plan_variant_id uuid NOT NULL REFERENCES plan_variants(id),
  proposer_id uuid NOT NULL REFERENCES trip_members(id),
  type text NOT NULL CHECK (type IN ('add', 'edit', 'delete', 'reorder')),
  target_item_id uuid REFERENCES itinerary_items(id),
  proposed_patch jsonb NOT NULL,
  source_version bigint,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'conflicted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES trip_members(id)
);

CREATE TABLE expenses (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  title text NOT NULL,
  amount_minor integer NOT NULL,
  currency text NOT NULL DEFAULT 'HKD',
  paid_by uuid NOT NULL REFERENCES trip_members(id),
  category text NOT NULL,
  splits jsonb NOT NULL,
  itinerary_item_id uuid REFERENCES itinerary_items(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1
);

CREATE TABLE documents (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  itinerary_item_id uuid REFERENCES itinerary_items(id),
  title text NOT NULL,
  object_key text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES trip_members(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE realtime_events (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  event_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  payload jsonb NOT NULL,
  client_mutation_id text,
  created_by uuid REFERENCES trip_members(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX itinerary_items_trip_plan_day_sort_idx
  ON itinerary_items (trip_id, plan_variant_id, day, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX suggestions_trip_status_idx
  ON suggestions (trip_id, status, created_at DESC);

CREATE INDEX realtime_events_trip_created_idx
  ON realtime_events (trip_id, created_at DESC);
```

## REST API

Base path: `/v1`.

### Trips

- `GET /v1/trips/:tripId`
  Returns the full planning cockpit payload: trip, members, variants, itinerary items, suggestions, and expense summary.
- `PATCH /v1/trips/:tripId`
  Updates trip metadata and active plan variant.

### Plan Variants

- `POST /v1/trips/:tripId/plan-variants`
- `PATCH /v1/plan-variants/:planVariantId`
- `POST /v1/plan-variants/:planVariantId/publish`

### Itinerary Items

- `POST /v1/trips/:tripId/itinerary-items`
- `PATCH /v1/itinerary-items/:itemId`
- `DELETE /v1/itinerary-items/:itemId`
- `POST /v1/trips/:tripId/itinerary-items/reorder`

Example PATCH:

```json
{
  "clientMutationId": "web-01HX9C4VJ5JQ",
  "expectedVersion": 4,
  "patch": {
    "startTime": "09:00",
    "durationMinutes": 75,
    "advisories": [
      { "code": "booking-recommended", "label": "จองล่วงหน้าแนะนำ", "severity": "warning" }
    ]
  }
}
```

### Suggestions

- `POST /v1/trips/:tripId/suggestions`
- `POST /v1/suggestions/:suggestionId/approve`
- `POST /v1/suggestions/:suggestionId/reject`

### Expenses

- `GET /v1/trips/:tripId/expenses/summary`
- `POST /v1/trips/:tripId/expenses`
- `PATCH /v1/expenses/:expenseId`
- `DELETE /v1/expenses/:expenseId`

### Members And Presence

- `GET /v1/trips/:tripId/members`
- `POST /v1/trips/:tripId/invitations`
- `PATCH /v1/trips/:tripId/members/:memberId`
- `POST /v1/trips/:tripId/presence`

## WebSocket

Endpoint:

`wss://api.sagittarius.local/v1/trips/:tripId/ws`

Client subscribes after REST bootstrap. The server should replay missed events using `Last-Event-Id` or `?afterEventId=`.

Envelope:

```json
{
  "eventId": "018f4e88-8f3a-7f9a-91f8-39e0c1b68711",
  "tripId": "018f4e80-5788-7de0-a45c-8a555d17fc2d",
  "type": "itinerary_item.updated",
  "aggregateId": "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f",
  "version": 5,
  "clientMutationId": "web-01HX9C4VJ5JQ",
  "actorMemberId": "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
  "occurredAt": "2026-05-27T16:00:00.000Z",
  "payload": {
    "patch": { "startTime": "09:00" }
  }
}
```

Required event types:

- `trip.updated`
- `plan_variant.created`
- `plan_variant.updated`
- `itinerary_item.created`
- `itinerary_item.updated`
- `itinerary_item.deleted`
- `itinerary_items.reordered`
- `suggestion.created`
- `suggestion.resolved`
- `expense.created`
- `expense.updated`
- `expense.deleted`
- `expense.summary_updated`
- `presence.updated`

## Frontend Data Shape

The current frontend seed maps directly to this response:

```json
{
  "trip": {
    "id": "trip-hong-kong-shenzhen",
    "name": "Hong Kong + Shenzhen Trip",
    "destinationLabel": "Hong Kong + Shenzhen",
    "startDate": "2025-05-15",
    "endDate": "2025-05-20",
    "activePlanVariantId": "plan-main",
    "version": 1
  },
  "itineraryItems": [
    {
      "id": "item-dimdim",
      "tripId": "trip-hong-kong-shenzhen",
      "planVariantId": "plan-main",
      "day": "2025-05-16",
      "sortOrder": 100,
      "startTime": "08:30",
      "activity": "Dim Dim Sum ที่ Tim Ho Wan",
      "activityType": "food",
      "place": "Shop G72, G/F, The Elements",
      "linkLabel": "แผนที่",
      "mapLink": "https://maps.google.com/?q=Dim+Dim+Sum+Tim+Ho+Wan+The+Elements+Hong+Kong",
      "address": "Shop G72, G/F, The Elements, 1 Austin Rd W, Tsim Sha Tsui",
      "durationMinutes": 60,
      "transportation": "เดิน",
      "advisories": [
        { "code": "booking-recommended", "label": "จองล่วงหน้าแนะนำ", "severity": "warning" }
      ],
      "note": "ร้านนี้ได้รับคะแนนสูง 4.3/5 จากรีวิวจำนวนมาก เหมาะกับมื้อเช้าแบบไม่เร่ง",
      "version": 4
    }
  ]
}
```

## Write Rules

- If `expectedVersion` does not match the stored row, return `409 Conflict` with the latest entity.
- If a WebSocket event has the same `clientMutationId` as a pending frontend mutation, the frontend should mark it confirmed instead of applying a duplicate row.
- Reorder writes should be transactional and emit one `itinerary_items.reordered` event.
- Suggestion approval should update target itinerary rows and mark the suggestion resolved in the same transaction.
