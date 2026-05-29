CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE trips (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  destination_label text NOT NULL,
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

ALTER TABLE trips
  ADD CONSTRAINT trips_owner_member_id_fkey
  FOREIGN KEY (owner_member_id, id) REFERENCES trip_members(id, trip_id)
  DEFERRABLE INITIALLY DEFERRED;

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

ALTER TABLE trips
  ADD CONSTRAINT trips_active_plan_variant_id_fkey
  FOREIGN KEY (active_plan_variant_id, id) REFERENCES plan_variants(id, trip_id)
  DEFERRABLE INITIALLY DEFERRED;

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

CREATE TABLE suggestions (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  plan_variant_id uuid NOT NULL,
  proposer_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('add', 'edit', 'delete', 'reorder')),
  target_item_id uuid,
  proposed_patch jsonb NOT NULL,
  source_version bigint,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'conflicted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid,
  FOREIGN KEY (plan_variant_id, trip_id) REFERENCES plan_variants(id, trip_id),
  FOREIGN KEY (proposer_id, trip_id) REFERENCES trip_members(id, trip_id),
  FOREIGN KEY (target_item_id, trip_id) REFERENCES itinerary_items(id, trip_id),
  FOREIGN KEY (resolved_by, trip_id) REFERENCES trip_members(id, trip_id)
);

CREATE TABLE trip_tasks (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  title text NOT NULL,
  status text NOT NULL CHECK (status IN ('open', 'done')),
  visibility text NOT NULL CHECK (visibility IN ('private', 'shared')),
  kind text CHECK (kind IN ('prep', 'booking')),
  created_by uuid NOT NULL,
  assignee_id uuid,
  related_item_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1,
  FOREIGN KEY (created_by, trip_id) REFERENCES trip_members(id, trip_id),
  FOREIGN KEY (assignee_id, trip_id) REFERENCES trip_members(id, trip_id),
  FOREIGN KEY (related_item_id, trip_id) REFERENCES itinerary_items(id, trip_id)
);

CREATE TABLE expenses (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  title text NOT NULL,
  amount_minor integer NOT NULL CHECK (amount_minor >= 0),
  currency text NOT NULL DEFAULT 'HKD',
  paid_by uuid NOT NULL,
  category text NOT NULL,
  splits jsonb NOT NULL,
  itinerary_item_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1,
  FOREIGN KEY (paid_by, trip_id) REFERENCES trip_members(id, trip_id),
  FOREIGN KEY (itinerary_item_id, trip_id) REFERENCES itinerary_items(id, trip_id)
);

CREATE TABLE realtime_events (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  aggregate_type text NOT NULL,
  event_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  version bigint NOT NULL,
  payload jsonb NOT NULL,
  client_mutation_id text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT realtime_events_client_mutation_actor_required
    CHECK (client_mutation_id IS NULL OR created_by IS NOT NULL),
  FOREIGN KEY (created_by, trip_id) REFERENCES trip_members(id, trip_id)
);

CREATE INDEX itinerary_items_trip_plan_day_sort_idx
  ON itinerary_items (trip_id, plan_variant_id, day, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX suggestions_trip_status_idx
  ON suggestions (trip_id, status, created_at DESC);

CREATE INDEX trip_tasks_trip_visibility_status_idx
  ON trip_tasks (trip_id, visibility, status, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX trip_tasks_assignee_status_idx
  ON trip_tasks (assignee_id, status, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX trip_member_sessions_member_active_idx
  ON trip_member_sessions (member_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE INDEX realtime_events_trip_id_idx
  ON realtime_events (trip_id, id);

CREATE UNIQUE INDEX realtime_events_client_mutation_id_idx
  ON realtime_events (trip_id, created_by, client_mutation_id)
  WHERE client_mutation_id IS NOT NULL;
