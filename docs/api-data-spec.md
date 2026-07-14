# Sagittarius API Data Contract

This document specifies the backend data model and API contract for the Sagittarius travel planning system.

## Database Schema

### Core Tables

```sql
CREATE TABLE trips (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  destination_label text NOT NULL,
  countries text[] NOT NULL DEFAULT '{}',
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
  presence text NOT NULL DEFAULT 'offline' CHECK (presence IN ('online', 'away', 'offline')),
  color text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, trip_id)
);

CREATE TABLE trip_member_sessions (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  member_id uuid NOT NULL,
  session_token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  FOREIGN KEY (member_id, trip_id) REFERENCES trip_members(id, trip_id)
);

CREATE TABLE plan_variants (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('main', 'backup', 'draft', 'split')),
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1,
  UNIQUE (id, trip_id)
);

CREATE TABLE itinerary_items (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  plan_variant_id uuid NOT NULL,
  day date NOT NULL,
  sort_order integer NOT NULL,
  start_time time,
  activity text NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('travel', 'food', 'shopping', 'attraction', 'experience', 'stay')),
  place text NOT NULL,
  link_label text NOT NULL DEFAULT 'แผนที่',
  map_link text NOT NULL DEFAULT '',
  address text,
  latitude numeric(10, 7) CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude numeric(10, 7) CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  transportation text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  advisories jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1,
  UNIQUE (id, trip_id),
  FOREIGN KEY (plan_variant_id, trip_id) REFERENCES plan_variants(id, trip_id),
  FOREIGN KEY (created_by, trip_id) REFERENCES trip_members(id, trip_id)
);

CREATE TABLE trip_join_sessions (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  join_session_token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);
```

### Path-based Itinerary Grouping (Migration 0010)

```sql
ALTER TABLE itinerary_items
  ADD COLUMN path_id uuid,
  ADD COLUMN path_group_id uuid,
  ADD COLUMN path_name text,
  ADD COLUMN path_role text;
```

Itinerary items support path-based grouping via `path_id`, `path_group_id`, `path_name`, and `path_role` fields for organizing activities into alternative plans (Plan A, Plan B, etc.).

## REST API Endpoints

### Trip Operations

```
GET /api/v1/trips/:tripId
```
Returns the full trip object with itinerary items, members, and plan variants.

```
POST /api/v1/trip-join-sessions
```
Creates a new join session for a trip, returning a join session token for sharing.

```
PATCH /api/v1/trips/:tripId/itinerary-items/:itemId
```
Updates an itinerary item. Supports partial updates to activity, place, times, path assignments, and sort_order.

## WebSocket Events

```
wss://api.sagittarius.local/api/v1/trips/:tripId/events/stream
```

Real-time event stream for trip changes. Events include:

- `itinerary_item.created` - New item added to itinerary
- `itinerary_item.updated` - Item modified (activity, place, time, path, sort_order)
- `itinerary_item.deleted` - Item removed from itinerary
- `trip.updated` - Trip metadata changed
- `member.joined` - New member joined the trip

All events include a `clientMutationId` field for optimistic update reconciliation.

## Data Model Notes

- Itinerary items are organized by `day` and `sort_order` within each plan variant
- Trip plans (`plan_variants`) allow multiple itinerary variants (main, backup, draft, split)
- All mutations return the updated entity with a `version` field for optimistic concurrency control
- WebSocket events are broadcast to all connected clients for the affected trip
- Members have roles: owner, organizer, traveler, viewer
- Session tokens are hashed and have expiration times
