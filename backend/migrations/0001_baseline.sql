CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY,
  display_name text NOT NULL,
  avatar_color text NOT NULL,
  locale text NOT NULL DEFAULT 'th-TH',
  timezone text NOT NULL DEFAULT 'Asia/Bangkok',
  password_hash text,
  home_city text,
  home_country text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz
);

CREATE INDEX users_password_enabled_idx
  ON users (id)
  WHERE password_hash IS NOT NULL AND disabled_at IS NULL;

CREATE TABLE user_emails (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  email text NOT NULL,
  normalized_email text NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX user_emails_normalized_email_idx
  ON user_emails (normalized_email);

CREATE TABLE email_login_challenges (
  id uuid PRIMARY KEY,
  normalized_email text NOT NULL,
  code_hash text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE INDEX email_login_challenges_email_active_idx
  ON email_login_challenges (normalized_email, expires_at DESC)
  WHERE consumed_at IS NULL;

CREATE TABLE email_login_outbox (
  id uuid PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES email_login_challenges(id) ON DELETE CASCADE,
  normalized_email text NOT NULL,
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX email_login_outbox_challenge_idx
  ON email_login_outbox (challenge_id);

CREATE TABLE webauthn_challenges (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  challenge text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('register', 'login')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE INDEX webauthn_challenges_challenge_active_idx
  ON webauthn_challenges (challenge, expires_at DESC)
  WHERE consumed_at IS NULL;

CREATE TABLE webauthn_credentials (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  credential_id text NOT NULL,
  public_key jsonb NOT NULL,
  sign_count bigint NOT NULL DEFAULT 0,
  nickname text NOT NULL DEFAULT 'Passkey',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE UNIQUE INDEX webauthn_credentials_credential_id_idx
  ON webauthn_credentials (credential_id);

CREATE TABLE trusted_devices (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  label text NOT NULL,
  user_agent text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  revoked_at timestamptz,
  CONSTRAINT trusted_devices_id_user_id_key UNIQUE (id, user_id)
);

CREATE INDEX trusted_devices_user_active_idx
  ON trusted_devices (user_id, last_seen_at DESC)
  WHERE revoked_at IS NULL;

CREATE UNIQUE INDEX trusted_devices_user_active_label_key
  ON trusted_devices (user_id, label)
  WHERE revoked_at IS NULL;

CREATE TABLE user_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  trusted_device_id uuid,
  session_token_hash text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('temporary', 'trusted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CONSTRAINT user_sessions_kind_device_match CHECK (
    (kind = 'trusted' AND trusted_device_id IS NOT NULL)
    OR (kind = 'temporary' AND trusted_device_id IS NULL)
  ),
  FOREIGN KEY (trusted_device_id, user_id) REFERENCES trusted_devices(id, user_id)
);

CREATE UNIQUE INDEX user_sessions_token_hash_idx
  ON user_sessions (session_token_hash);

CREATE INDEX user_sessions_user_active_idx
  ON user_sessions (user_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE auth_attempt_locks (
  scope text NOT NULL,
  attempt_key text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, attempt_key)
);

CREATE INDEX auth_attempt_locks_locked_until_idx
  ON auth_attempt_locks (locked_until)
  WHERE locked_until IS NOT NULL;

CREATE TABLE trips (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  destination_label text NOT NULL,
  countries text[] NOT NULL DEFAULT '{}',
  start_date date NOT NULL,
  end_date date NOT NULL,
  join_id text NOT NULL UNIQUE,
  join_password_hash text NOT NULL,
  main_trip_plan_id uuid,
  owner_member_id uuid NOT NULL,
  origin_label text NOT NULL DEFAULT 'Bangkok, Thailand',
  origin_city text NOT NULL DEFAULT 'Bangkok',
  origin_country text NOT NULL DEFAULT 'Thailand',
  origin_country_code text NOT NULL DEFAULT 'TH',
  destination_cities jsonb NOT NULL DEFAULT '[]'::jsonb,
  party_size integer NOT NULL DEFAULT 1 CHECK (party_size > 0),
  default_timezone text NOT NULL DEFAULT 'Asia/Bangkok',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1
);

CREATE TABLE trip_members (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  user_id uuid REFERENCES users(id),
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
  UNIQUE (id, trip_id),
  CONSTRAINT trip_members_owner_must_be_active
    CHECK (role <> 'owner' OR access_status <> 'disabled')
);

CREATE INDEX trip_members_trip_id_idx
  ON trip_members (trip_id);

CREATE INDEX trip_members_user_id_idx
  ON trip_members (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX trip_members_trip_user_idx
  ON trip_members (trip_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX trip_members_one_owner_per_trip_idx
  ON trip_members (trip_id)
  WHERE role = 'owner';

ALTER TABLE trips
  ADD CONSTRAINT trips_owner_member_id_fkey
  FOREIGN KEY (owner_member_id, id) REFERENCES trip_members(id, trip_id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE trip_plans (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('main', 'draft', 'proposal', 'backup')),
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1,
  UNIQUE (id, trip_id)
);

CREATE INDEX trip_plans_trip_id_idx
  ON trip_plans (trip_id);

ALTER TABLE trips
  ADD CONSTRAINT trips_main_trip_plan_id_fkey
  FOREIGN KEY (main_trip_plan_id, id) REFERENCES trip_plans(id, trip_id)
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

CREATE INDEX trip_member_sessions_member_active_idx
  ON trip_member_sessions (member_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE trip_join_sessions (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  join_session_token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE INDEX trip_join_sessions_trip_active_idx
  ON trip_join_sessions (trip_id, expires_at DESC)
  WHERE consumed_at IS NULL;

CREATE TABLE trip_join_invite_tokens (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  token_hash text NOT NULL UNIQUE,
  created_by uuid REFERENCES trip_members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE INDEX trip_join_invite_tokens_trip_active_idx
  ON trip_join_invite_tokens (trip_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE INDEX trip_join_invite_tokens_active_hash_idx
  ON trip_join_invite_tokens (token_hash)
  WHERE revoked_at IS NULL;

CREATE TABLE itinerary_items (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  trip_plan_id uuid NOT NULL,
  day date NOT NULL,
  sort_order integer NOT NULL,
  start_time time,
  end_time time,
  end_offset_days integer NOT NULL DEFAULT 0
    CHECK (end_offset_days BETWEEN 0 AND 7),
  activity text NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('travel', 'food', 'shopping', 'attraction', 'experience', 'stay', 'default')),
  activity_subtype text,
  place text NOT NULL,
  map_link text NOT NULL DEFAULT '',
  address text,
  latitude numeric(10, 7) CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude numeric(10, 7) CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  transportation text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  path_group_id text,
  path_id text,
  path_name text,
  path_role text CHECK (path_role IS NULL OR path_role IN ('main', 'alternative')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  item_kind text NOT NULL DEFAULT 'activity'
    CHECK (item_kind IN ('travel', 'activity', 'lodging', 'meal', 'note', 'preparation', 'foodRecommendation')),
  time_mode text NOT NULL DEFAULT 'scheduled'
    CHECK (time_mode IN ('scheduled', 'flexible')),
  parent_item_id uuid,
  is_plan_block boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'idea'
    CHECK (status IN ('idea', 'planned', 'booked', 'confirmed', 'done', 'skipped')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'must')),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1,
  UNIQUE (id, trip_id),
  CONSTRAINT itinerary_items_activity_subtype_check CHECK (
    activity_subtype IS NULL OR
    activity_subtype IN ('flight', 'train', 'bus', 'taxi', 'ferry', 'walk', 'car', 'shuttle')
  ),
  CONSTRAINT itinerary_items_no_self_parent_check
    CHECK (parent_item_id IS NULL OR parent_item_id <> id),
  CONSTRAINT itinerary_items_end_offset_requires_end_time
    CHECK (end_time IS NOT NULL OR end_offset_days = 0),
  FOREIGN KEY (trip_plan_id, trip_id) REFERENCES trip_plans(id, trip_id),
  FOREIGN KEY (created_by, trip_id) REFERENCES trip_members(id, trip_id)
);

CREATE UNIQUE INDEX itinerary_items_parent_scope_key
  ON itinerary_items (id, trip_id, trip_plan_id, day);

ALTER TABLE itinerary_items
  ADD CONSTRAINT itinerary_items_parent_scope_fkey
  FOREIGN KEY (parent_item_id, trip_id, trip_plan_id, day)
  REFERENCES itinerary_items(id, trip_id, trip_plan_id, day);

CREATE INDEX itinerary_items_trip_plan_day_sort_idx
  ON itinerary_items (trip_id, trip_plan_id, day, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX itinerary_items_trip_plan_path_idx
  ON itinerary_items (trip_id, trip_plan_id, path_id, day, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX itinerary_items_parent_idx
  ON itinerary_items (trip_id, parent_item_id, day, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX itinerary_items_parent_scope_idx
  ON itinerary_items (trip_id, trip_plan_id, day, parent_item_id)
  WHERE parent_item_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX itinerary_items_time_window_idx
  ON itinerary_items (trip_id, trip_plan_id, day, start_time, end_time)
  WHERE deleted_at IS NULL;

CREATE TABLE suggestions (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  trip_plan_id uuid NOT NULL,
  proposer_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('add', 'edit', 'delete', 'reorder')),
  target_item_id uuid,
  proposed_patch jsonb NOT NULL,
  source_version bigint,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'conflicted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid,
  FOREIGN KEY (trip_plan_id, trip_id) REFERENCES trip_plans(id, trip_id),
  FOREIGN KEY (proposer_id, trip_id) REFERENCES trip_members(id, trip_id),
  FOREIGN KEY (target_item_id, trip_id) REFERENCES itinerary_items(id, trip_id),
  FOREIGN KEY (resolved_by, trip_id) REFERENCES trip_members(id, trip_id)
);

CREATE INDEX suggestions_trip_status_idx
  ON suggestions (trip_id, status, created_at DESC);

CREATE TABLE trip_tasks (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  trip_plan_id uuid,
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
  CONSTRAINT trip_tasks_id_trip_id_key UNIQUE (id, trip_id),
  CONSTRAINT trip_tasks_trip_plan_fkey
    FOREIGN KEY (trip_plan_id, trip_id) REFERENCES trip_plans(id, trip_id),
  FOREIGN KEY (created_by, trip_id) REFERENCES trip_members(id, trip_id),
  FOREIGN KEY (assignee_id, trip_id) REFERENCES trip_members(id, trip_id),
  FOREIGN KEY (related_item_id, trip_id) REFERENCES itinerary_items(id, trip_id)
);

CREATE INDEX trip_tasks_trip_visibility_status_idx
  ON trip_tasks (trip_id, visibility, status, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX trip_tasks_assignee_status_idx
  ON trip_tasks (assignee_id, status, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX trip_tasks_trip_plan_active_idx
  ON trip_tasks (trip_id, trip_plan_id, visibility, status, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE expenses (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  trip_plan_id uuid,
  title text NOT NULL,
  amount_minor integer NOT NULL CHECK (amount_minor >= 0),
  currency text NOT NULL DEFAULT 'HKD',
  paid_by uuid NOT NULL,
  category text NOT NULL,
  splits jsonb NOT NULL,
  itinerary_item_id uuid,
  exchange_rate_to_settlement_currency double precision NOT NULL DEFAULT 1,
  receipt_url text,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  spent_on date,
  stored_value_card_id text,
  stored_value_card_name text,
  stored_value_transaction_type text,
  settlement_allocations jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1,
  CONSTRAINT expenses_id_trip_id_key UNIQUE (id, trip_id),
  CONSTRAINT expenses_exchange_rate_to_settlement_currency_positive
    CHECK (exchange_rate_to_settlement_currency > 0),
  CONSTRAINT expenses_line_items_array
    CHECK (jsonb_typeof(line_items) = 'array'),
  CONSTRAINT expenses_comments_array
    CHECK (jsonb_typeof(comments) = 'array'),
  CONSTRAINT expenses_settlement_allocations_array
    CHECK (jsonb_typeof(settlement_allocations) = 'array'),
  CONSTRAINT expenses_stored_value_transaction_type_valid CHECK (
    stored_value_transaction_type IS NULL
    OR stored_value_transaction_type IN ('topup', 'spend', 'refund')
  ),
  CONSTRAINT expenses_stored_value_card_required CHECK (
    stored_value_transaction_type IS NULL
    OR nullif(stored_value_card_id, '') IS NOT NULL
    OR nullif(stored_value_card_name, '') IS NOT NULL
  ),
  CONSTRAINT expenses_trip_plan_fkey
    FOREIGN KEY (trip_plan_id, trip_id) REFERENCES trip_plans(id, trip_id),
  FOREIGN KEY (paid_by, trip_id) REFERENCES trip_members(id, trip_id),
  FOREIGN KEY (itinerary_item_id, trip_id) REFERENCES itinerary_items(id, trip_id)
);

CREATE INDEX expenses_trip_id_idx
  ON expenses (trip_id);

CREATE INDEX expenses_trip_plan_active_idx
  ON expenses (trip_id, trip_plan_id, created_at)
  WHERE deleted_at IS NULL;

CREATE TABLE expense_reminders (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  trip_plan_id uuid NOT NULL,
  from_member_id uuid NOT NULL,
  to_member_id uuid NOT NULL,
  amount_minor integer NOT NULL CHECK (amount_minor > 0),
  last_reminded_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1,
  CONSTRAINT expense_reminders_trip_plan_pair_key
    UNIQUE (trip_id, trip_plan_id, from_member_id, to_member_id, amount_minor),
  FOREIGN KEY (trip_plan_id, trip_id) REFERENCES trip_plans(id, trip_id),
  FOREIGN KEY (from_member_id, trip_id) REFERENCES trip_members(id, trip_id),
  FOREIGN KEY (to_member_id, trip_id) REFERENCES trip_members(id, trip_id),
  FOREIGN KEY (created_by, trip_id) REFERENCES trip_members(id, trip_id)
);

CREATE INDEX expense_reminders_trip_pair_idx
  ON expense_reminders (trip_id, from_member_id, to_member_id, amount_minor);

CREATE INDEX expense_reminders_trip_plan_pair_idx
  ON expense_reminders (trip_id, trip_plan_id, from_member_id, to_member_id, amount_minor);

CREATE TABLE stop_notes (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  trip_plan_id uuid,
  itinerary_item_id uuid NOT NULL,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1,
  CONSTRAINT stop_notes_id_trip_id_key UNIQUE (id, trip_id),
  CONSTRAINT stop_notes_trip_plan_fkey
    FOREIGN KEY (trip_plan_id, trip_id) REFERENCES trip_plans(id, trip_id),
  FOREIGN KEY (itinerary_item_id, trip_id) REFERENCES itinerary_items(id, trip_id),
  FOREIGN KEY (author_id, trip_id) REFERENCES trip_members(id, trip_id)
);

CREATE INDEX stop_notes_trip_item_created_at_idx
  ON stop_notes (trip_id, itinerary_item_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX stop_notes_trip_plan_item_idx
  ON stop_notes (trip_id, trip_plan_id, itinerary_item_id, created_at DESC)
  WHERE deleted_at IS NULL;

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

CREATE INDEX realtime_events_trip_id_idx
  ON realtime_events (trip_id, id);

CREATE UNIQUE INDEX realtime_events_client_mutation_id_idx
  ON realtime_events (trip_id, created_by, client_mutation_id)
  WHERE client_mutation_id IS NOT NULL;

CREATE TABLE account_audit_events (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  trip_id uuid REFERENCES trips(id),
  actor_user_id uuid REFERENCES users(id),
  actor_member_id uuid REFERENCES trip_members(id),
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX account_audit_events_user_created_idx
  ON account_audit_events (user_id, created_at DESC);

CREATE INDEX account_audit_events_actor_user_created_idx
  ON account_audit_events (actor_user_id, created_at DESC)
  WHERE actor_user_id IS NOT NULL;

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

CREATE INDEX account_vault_items_user_created_idx
  ON account_vault_items (user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX account_vault_items_trip_idx
  ON account_vault_items (trip_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE trip_daily_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  briefing_date date NOT NULL,
  location_key text NOT NULL,
  location_label text NOT NULL,
  coordinates jsonb,
  weather jsonb,
  holiday jsonb,
  festival jsonb,
  facts jsonb,
  outfit_advice jsonb,
  manual_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1,
  UNIQUE (trip_id, briefing_date, location_key)
);

CREATE INDEX trip_daily_briefings_trip_date_idx
  ON trip_daily_briefings (trip_id, briefing_date);

CREATE TABLE place_geocode_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_query text NOT NULL UNIQUE,
  query text NOT NULL,
  country_codes text[] NOT NULL DEFAULT '{}'::text[],
  display_name text NOT NULL,
  source text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX place_geocode_cache_country_codes_idx
  ON place_geocode_cache USING gin (country_codes);

CREATE TABLE booking_docs (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  trip_plan_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  status text NOT NULL,
  visibility text NOT NULL,
  owner_member_id uuid,
  provider_name text,
  confirmation_code text,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text,
  price_minor integer,
  currency text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1,
  CONSTRAINT booking_docs_id_trip_id_key UNIQUE (id, trip_id),
  CONSTRAINT booking_docs_type_check CHECK (type IN ('flight', 'train', 'public_transport', 'hotel', 'insurance', 'passport', 'visa', 'activity_ticket', 'other')),
  CONSTRAINT booking_docs_status_check CHECK (status IN ('draft', 'needs_action', 'booked', 'confirmed', 'paid', 'cancelled', 'expired')),
  CONSTRAINT booking_docs_visibility_check CHECK (visibility IN ('shared', 'sensitive', 'private')),
  CONSTRAINT booking_docs_price_minor_check CHECK (price_minor IS NULL OR price_minor >= 0),
  CONSTRAINT booking_docs_trip_plan_fkey FOREIGN KEY (trip_plan_id, trip_id) REFERENCES trip_plans(id, trip_id),
  CONSTRAINT booking_docs_owner_member_trip_fkey FOREIGN KEY (owner_member_id, trip_id) REFERENCES trip_members(id, trip_id),
  CONSTRAINT booking_docs_created_by_trip_fkey FOREIGN KEY (created_by, trip_id) REFERENCES trip_members(id, trip_id)
);

CREATE INDEX booking_docs_trip_active_idx
  ON booking_docs (trip_id, starts_at, created_at)
  WHERE deleted_at IS NULL;

CREATE INDEX booking_docs_owner_idx
  ON booking_docs (trip_id, owner_member_id)
  WHERE deleted_at IS NULL;

CREATE INDEX booking_docs_created_by_idx
  ON booking_docs (trip_id, created_by)
  WHERE deleted_at IS NULL;

CREATE INDEX booking_docs_trip_plan_active_idx
  ON booking_docs (trip_id, trip_plan_id, starts_at, created_at)
  WHERE deleted_at IS NULL;

CREATE TABLE booking_doc_external_links (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL,
  booking_doc_id uuid NOT NULL,
  label text NOT NULL,
  url text NOT NULL,
  provider text,
  access_note text,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT booking_doc_external_links_doc_trip_fkey
    FOREIGN KEY (booking_doc_id, trip_id) REFERENCES booking_docs(id, trip_id) ON DELETE CASCADE
);

CREATE INDEX booking_doc_external_links_doc_idx
  ON booking_doc_external_links (trip_id, booking_doc_id, sort_order);

CREATE TABLE booking_doc_travelers (
  trip_id uuid NOT NULL,
  booking_doc_id uuid NOT NULL,
  member_id uuid NOT NULL,
  PRIMARY KEY (booking_doc_id, member_id),
  CONSTRAINT booking_doc_travelers_doc_trip_fkey
    FOREIGN KEY (booking_doc_id, trip_id) REFERENCES booking_docs(id, trip_id) ON DELETE CASCADE,
  CONSTRAINT booking_doc_travelers_member_trip_fkey
    FOREIGN KEY (member_id, trip_id) REFERENCES trip_members(id, trip_id) ON DELETE CASCADE
);

CREATE INDEX booking_doc_travelers_trip_doc_idx
  ON booking_doc_travelers (trip_id, booking_doc_id);

CREATE INDEX booking_doc_travelers_member_idx
  ON booking_doc_travelers (member_id);

CREATE TABLE booking_doc_itinerary_items (
  trip_id uuid NOT NULL,
  booking_doc_id uuid NOT NULL,
  itinerary_item_id uuid NOT NULL,
  PRIMARY KEY (booking_doc_id, itinerary_item_id),
  CONSTRAINT booking_doc_itinerary_items_doc_trip_fkey
    FOREIGN KEY (booking_doc_id, trip_id) REFERENCES booking_docs(id, trip_id) ON DELETE CASCADE,
  CONSTRAINT booking_doc_itinerary_items_item_trip_fkey
    FOREIGN KEY (itinerary_item_id, trip_id) REFERENCES itinerary_items(id, trip_id) ON DELETE CASCADE
);

CREATE INDEX booking_doc_itinerary_items_trip_doc_idx
  ON booking_doc_itinerary_items (trip_id, booking_doc_id);

CREATE INDEX booking_doc_itinerary_items_item_idx
  ON booking_doc_itinerary_items (itinerary_item_id);

CREATE TABLE booking_doc_tasks (
  trip_id uuid NOT NULL,
  booking_doc_id uuid NOT NULL,
  task_id uuid NOT NULL,
  PRIMARY KEY (booking_doc_id, task_id),
  CONSTRAINT booking_doc_tasks_doc_trip_fkey
    FOREIGN KEY (booking_doc_id, trip_id) REFERENCES booking_docs(id, trip_id) ON DELETE CASCADE,
  CONSTRAINT booking_doc_tasks_task_trip_fkey
    FOREIGN KEY (task_id, trip_id) REFERENCES trip_tasks(id, trip_id) ON DELETE CASCADE
);

CREATE INDEX booking_doc_tasks_trip_doc_idx
  ON booking_doc_tasks (trip_id, booking_doc_id);

CREATE INDEX booking_doc_tasks_task_idx
  ON booking_doc_tasks (task_id);

CREATE TABLE booking_doc_expenses (
  trip_id uuid NOT NULL,
  booking_doc_id uuid NOT NULL,
  expense_id uuid NOT NULL,
  PRIMARY KEY (booking_doc_id, expense_id),
  CONSTRAINT booking_doc_expenses_doc_trip_fkey
    FOREIGN KEY (booking_doc_id, trip_id) REFERENCES booking_docs(id, trip_id) ON DELETE CASCADE,
  CONSTRAINT booking_doc_expenses_expense_trip_fkey
    FOREIGN KEY (expense_id, trip_id) REFERENCES expenses(id, trip_id) ON DELETE CASCADE
);

CREATE INDEX booking_doc_expenses_trip_doc_idx
  ON booking_doc_expenses (trip_id, booking_doc_id);

CREATE INDEX booking_doc_expenses_expense_idx
  ON booking_doc_expenses (expense_id);

CREATE TABLE booking_doc_stop_notes (
  trip_id uuid NOT NULL,
  booking_doc_id uuid NOT NULL,
  stop_note_id uuid NOT NULL,
  PRIMARY KEY (booking_doc_id, stop_note_id),
  CONSTRAINT booking_doc_stop_notes_doc_trip_fkey
    FOREIGN KEY (booking_doc_id, trip_id) REFERENCES booking_docs(id, trip_id) ON DELETE CASCADE,
  CONSTRAINT booking_doc_stop_notes_note_trip_fkey
    FOREIGN KEY (stop_note_id, trip_id) REFERENCES stop_notes(id, trip_id) ON DELETE CASCADE
);

CREATE INDEX booking_doc_stop_notes_trip_doc_idx
  ON booking_doc_stop_notes (trip_id, booking_doc_id);

CREATE INDEX booking_doc_stop_notes_note_idx
  ON booking_doc_stop_notes (stop_note_id);

CREATE TABLE photo_album_links (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title text NOT NULL,
  provider text NOT NULL,
  url text NOT NULL,
  access text NOT NULL,
  owner_member_id uuid,
  day date,
  description text,
  access_note text,
  cover_url text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1,
  CONSTRAINT photo_album_links_id_trip_id_key UNIQUE (id, trip_id),
  CONSTRAINT photo_album_links_provider_check CHECK (provider IN ('google_photos', 'icloud', 'google_drive', 'dropbox', 'onedrive', 'custom')),
  CONSTRAINT photo_album_links_access_check CHECK (access IN ('view_only', 'collaborative', 'upload_request')),
  CONSTRAINT photo_album_links_owner_member_trip_fkey FOREIGN KEY (owner_member_id, trip_id) REFERENCES trip_members(id, trip_id),
  CONSTRAINT photo_album_links_created_by_trip_fkey FOREIGN KEY (created_by, trip_id) REFERENCES trip_members(id, trip_id)
);

CREATE INDEX photo_album_links_trip_active_idx
  ON photo_album_links (trip_id, day, created_at)
  WHERE deleted_at IS NULL;

CREATE INDEX photo_album_links_owner_idx
  ON photo_album_links (trip_id, owner_member_id)
  WHERE deleted_at IS NULL;

CREATE INDEX photo_album_links_created_by_idx
  ON photo_album_links (trip_id, created_by)
  WHERE deleted_at IS NULL;

CREATE TABLE photo_album_link_itinerary_items (
  trip_id uuid NOT NULL,
  photo_album_link_id uuid NOT NULL,
  itinerary_item_id uuid NOT NULL,
  PRIMARY KEY (photo_album_link_id, itinerary_item_id),
  CONSTRAINT photo_album_link_itinerary_items_album_trip_fkey
    FOREIGN KEY (photo_album_link_id, trip_id) REFERENCES photo_album_links(id, trip_id) ON DELETE CASCADE,
  CONSTRAINT photo_album_link_itinerary_items_item_trip_fkey
    FOREIGN KEY (itinerary_item_id, trip_id) REFERENCES itinerary_items(id, trip_id) ON DELETE CASCADE
);

CREATE INDEX photo_album_link_itinerary_items_trip_album_idx
  ON photo_album_link_itinerary_items (trip_id, photo_album_link_id);

CREATE INDEX photo_album_link_itinerary_items_item_idx
  ON photo_album_link_itinerary_items (itinerary_item_id);

CREATE TABLE plan_checks (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  trip_plan_id uuid,
  created_by uuid NOT NULL,
  itinerary_fingerprint text NOT NULL,
  language_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'complete' CHECK (status IN ('running', 'complete', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  version bigint NOT NULL DEFAULT 1,
  UNIQUE (trip_id, id),
  CONSTRAINT plan_checks_trip_plan_fkey
    FOREIGN KEY (trip_plan_id, trip_id) REFERENCES trip_plans(id, trip_id)
    DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (created_by, trip_id) REFERENCES trip_members(id, trip_id)
);

CREATE INDEX plan_checks_trip_created_idx
  ON plan_checks (trip_id, created_at DESC);

CREATE INDEX plan_checks_trip_plan_created_idx
  ON plan_checks (trip_id, trip_plan_id, created_at DESC)
  WHERE trip_plan_id IS NOT NULL;

CREATE TABLE plan_suggestions (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  plan_check_id uuid NOT NULL REFERENCES plan_checks(id),
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  scope text NOT NULL CHECK (scope IN ('item', 'betweenItems', 'day', 'trip')),
  target_item_ids uuid[] NOT NULL DEFAULT '{}',
  explanation_i18n jsonb NOT NULL,
  recommended_action_i18n jsonb NOT NULL,
  action_kind text CHECK (action_kind IS NULL OR action_kind IN ('accept', 'dismiss', 'snooze', 'convertToItem', 'editItem')),
  action_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed', 'snoozed')),
  snoozed_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1,
  FOREIGN KEY (trip_id, plan_check_id) REFERENCES plan_checks(trip_id, id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX plan_suggestions_check_idx
  ON plan_suggestions (plan_check_id, status, severity);

CREATE FUNCTION trip_owner_member_is_active_owner(check_trip_id uuid, check_owner_member_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM trip_members
    WHERE id = check_owner_member_id
      AND trip_id = check_trip_id
      AND role = 'owner'
      AND access_status = 'active'
  );
$$;

CREATE FUNCTION enforce_trip_owner_member()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT trip_owner_member_is_active_owner(NEW.id, NEW.owner_member_id) THEN
    RAISE EXCEPTION 'trip owner_member_id must reference an active owner member'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE FUNCTION enforce_referenced_trip_owner_member()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (
      SELECT 1
      FROM trips
      WHERE id = OLD.trip_id
        AND owner_member_id = OLD.id
    ) THEN
      RAISE EXCEPTION 'trip owner_member_id must reference an active owner member'
        USING ERRCODE = '23514';
    END IF;

    RETURN OLD;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM trips
    WHERE id = OLD.trip_id
      AND owner_member_id = OLD.id
      AND NOT trip_owner_member_is_active_owner(id, owner_member_id)
  ) THEN
    RAISE EXCEPTION 'trip owner_member_id must reference an active owner member'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM trips
    WHERE id = NEW.trip_id
      AND owner_member_id = NEW.id
      AND NOT trip_owner_member_is_active_owner(id, owner_member_id)
  ) THEN
    RAISE EXCEPTION 'trip owner_member_id must reference an active owner member'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER trips_owner_member_must_be_active_owner
  AFTER INSERT OR UPDATE OF owner_member_id, id ON trips
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION enforce_trip_owner_member();

CREATE CONSTRAINT TRIGGER trip_members_referenced_owner_must_remain_active_owner
  AFTER UPDATE OF role, access_status, trip_id, id OR DELETE ON trip_members
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION enforce_referenced_trip_owner_member();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sagittarius') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE plan_checks TO sagittarius;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE plan_suggestions TO sagittarius;
  END IF;
END
$$;
