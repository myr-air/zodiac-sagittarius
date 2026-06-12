# Sagittarius API Data Spec

Status: canonical routing and data contract for frontend/backend integration.
Version: 2026-05-30.

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
- Trips have a room-level join credential (`join_id` + `join_password_hash`) before member selection.
- Guest trip participants claim a `trip_members` row with a per-trip password/PIN; permanent accounts can later link to the same row through `user_id`.

## PostgreSQL Storage Model

```sql
CREATE TABLE trips (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  origin_label text NOT NULL DEFAULT 'Bangkok, Thailand',
  origin_city text NOT NULL DEFAULT 'Bangkok',
  origin_country text NOT NULL DEFAULT 'Thailand',
  origin_country_code text NOT NULL DEFAULT 'TH',
  destination_label text NOT NULL,
  destination_cities jsonb NOT NULL DEFAULT '[]'::jsonb,
  start_date date NOT NULL,
  end_date date NOT NULL,
  join_id text NOT NULL UNIQUE,
  join_password_hash text NOT NULL,
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
  access_status text NOT NULL DEFAULT 'active' CHECK (access_status IN ('active', 'disabled')),
  claim_password_hash text,
  claimed_at timestamptz,
  last_seen_at timestamptz,
  presence text NOT NULL DEFAULT 'offline',
  color text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE trip_member_sessions (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  member_id uuid NOT NULL REFERENCES trip_members(id),
  session_token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE TABLE trip_join_sessions (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  join_session_token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
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
  path_group_id text,
  path_id text,
  path_name text,
  path_role text CHECK (path_role IS NULL OR path_role IN ('main', 'alternative')),
  day date NOT NULL,
  sort_order integer NOT NULL,
  start_time time,
  end_time time,
  end_offset_days integer NOT NULL DEFAULT 0,
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
  exchange_rate_to_settlement_currency double precision NOT NULL DEFAULT 1,
  notes text NOT NULL DEFAULT '',
  receipt_url text,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  comments jsonb NOT NULL DEFAULT '[]'::jsonb,
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

CREATE TABLE account_vault_items (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  trip_id uuid REFERENCES trips(id),
  kind text NOT NULL CHECK (kind IN ('note', 'file')),
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  external_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
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

CREATE INDEX trip_member_sessions_member_active_idx
  ON trip_member_sessions (member_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE INDEX trip_join_sessions_trip_active_idx
  ON trip_join_sessions (trip_id, expires_at DESC)
  WHERE consumed_at IS NULL;

CREATE INDEX realtime_events_trip_created_idx
  ON realtime_events (trip_id, created_at DESC);
```

## REST API

Base path: `/api/v1`.

### Health

- `GET /api/v1/health`
  Returns `ok` for local liveness checks.

### Account Auth

- `POST /api/v1/auth/email/challenges`
  Starts provider-free email-code login.
- `POST /api/v1/auth/email/sessions`
  Finishes email-code login and creates an account session.
- `POST /api/v1/auth/passkeys/options`
  Starts passkey login.
- `POST /api/v1/auth/passkeys/sessions`
  Finishes passkey login and creates an account session.
- `DELETE /api/v1/account/session`
  Revokes the current account bearer session.

### Account Resources

- `GET /api/v1/account`
  Returns the current account profile, passkeys, and trusted devices.
- `PATCH /api/v1/account`
  Updates current account profile settings.
- `GET /api/v1/account/trips`
  Lists trips visible through the current account identity.
- `POST /api/v1/account/trips`
  Creates an account-owned trip and owner member session.
- `GET /api/v1/account/trip-stats`
  Returns account trip summary counters.
- `GET /api/v1/account/explorer`
  Returns portal explorer counters and the next upcoming account-visible trip.
- `GET /api/v1/account/to-dos`
  Lists shared or assigned trip tasks visible to the current account.
- `GET /api/v1/account/vault`
  Lists account vault notes/files plus visible itinerary notes.
- `POST /api/v1/account/vault`
  Creates a personal account vault note or file link.
- `POST /api/v1/account/passkeys/options`
  Starts passkey registration for the current account.
- `POST /api/v1/account/passkeys`
  Finishes passkey registration for the current account.
- `DELETE /api/v1/account/trusted-devices/:trustedDeviceId`
  Revokes one trusted device.

### Trips

- `GET /api/v1/trips/:tripId`
  Returns the full planning cockpit payload: trip, members, variants, itinerary items, suggestions, and expense summary.
- `PATCH /api/v1/trips/:tripId`
  Updates trip metadata and active plan variant.

### Plan Variants

- `POST /api/v1/trips/:tripId/plan-variants`
- `PATCH /api/v1/trips/:tripId/plan-variants/:planVariantId`
- `POST /api/v1/trips/:tripId/plan-variants/:planVariantId/publications`

### Itinerary Items

- `POST /api/v1/trips/:tripId/itinerary-items`
- `PATCH /api/v1/trips/:tripId/itinerary-items/:itemId`
- `DELETE /api/v1/trips/:tripId/itinerary-items/:itemId`
- `PATCH /api/v1/trips/:tripId/itinerary-items/order`

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

- `POST /api/v1/trips/:tripId/suggestions`
- `PATCH /api/v1/trips/:tripId/suggestions/:suggestionId`
  Resolves a suggestion with `{ status: "approved" | "rejected" }`.

### Expenses

- `GET /api/v1/trips/:tripId/expenses/summary`
- `POST /api/v1/trips/:tripId/expenses`
- `PATCH /api/v1/trips/:tripId/expenses/:expenseId`
- `DELETE /api/v1/trips/:tripId/expenses/:expenseId`

### Members And Presence

- `POST /api/v1/trip-join-sessions`
  Verifies `{ joinCode, tripPassword }` and returns safe trip metadata, claimable members, and a short-lived `joinSessionToken`.
- `POST /api/v1/trips/:tripId/members/:memberId/claims`
  First-time guest participant claim with `{ participantPassword }`; stores a password hash and returns a member session.
- `POST /api/v1/trips/:tripId/member-sessions`
  Verifies an existing participant password with `{ memberId, participantPassword, joinSessionToken }` and returns a member session.
- `DELETE /api/v1/trips/:tripId/member-sessions/current`
  Revokes the current guest member session.
- `POST /api/v1/trips/:tripId/members/:memberId/claim-resets`
  Organizer/owner only; clears `claim_password_hash`, `claimed_at`, and active sessions for the member.
- `GET /api/v1/trips/:tripId/members`
- `POST /api/v1/trips/:tripId/members`
- `PATCH /api/v1/trips/:tripId/members/:memberId`
  Organizer/owner only; updates display name, role, or access status. Disabling a member revokes active sessions and clears guest claim credentials.
- `POST /api/v1/trips/:tripId/members/:memberId/account-links`
  Links the current account to a trip member using a member session token.
- `POST /api/v1/trips/:tripId/ownership-transfers`
  Transfers owner role to the target member.
- `POST /api/v1/trips/:tripId/presence`

## Role Capability Matrix

| Capability | Owner | Organizer | Traveler | Viewer |
| --- | --- | --- | --- | --- |
| View trip plan | Yes | Yes | Yes | Yes |
| Edit itinerary directly | Yes | Yes | No | No |
| Create suggestions | Yes | Yes | Yes | No |
| Review suggestions | Yes | Yes | No | No |
| View expense summary | Yes | Yes | Yes | No |
| Edit expenses | Yes | Yes | No | No |
| Manage participants | Yes | Yes | No | No |

## WebSocket

Endpoint:

`wss://api.sagittarius.local/api/v1/trips/:tripId/events/stream`

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
    "originLabel": "Bangkok, Thailand",
    "originCity": "Bangkok",
    "originCountry": "Thailand",
    "originCountryCode": "TH",
    "destinationLabel": "Hong Kong + Shenzhen",
    "destinationCities": [
      {
        "city": "Hong Kong",
        "country": "Hong Kong",
        "countryCode": "HK",
        "timezone": "Asia/Hong_Kong",
        "latitude": 22.3193,
        "longitude": 114.1694
      }
    ],
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
