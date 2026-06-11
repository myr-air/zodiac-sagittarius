ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS party_size integer NOT NULL DEFAULT 1 CHECK (party_size > 0),
  ADD COLUMN IF NOT EXISTS default_timezone text NOT NULL DEFAULT 'Asia/Bangkok';

ALTER TABLE itinerary_items
  ADD COLUMN IF NOT EXISTS item_kind text NOT NULL DEFAULT 'activity'
    CHECK (item_kind IN ('travel', 'activity', 'lodging', 'meal', 'note', 'preparation', 'foodRecommendation')),
  ADD COLUMN IF NOT EXISTS time_mode text NOT NULL DEFAULT 'scheduled'
    CHECK (time_mode IN ('scheduled', 'flexible')),
  ADD COLUMN IF NOT EXISTS parent_item_id uuid,
  ADD COLUMN IF NOT EXISTS is_plan_block boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'idea'
    CHECK (status IN ('idea', 'planned', 'booked', 'confirmed', 'done', 'skipped')),
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'must'));

ALTER TABLE itinerary_items
  DROP CONSTRAINT IF EXISTS itinerary_items_parent_item_id_trip_id_fkey;

ALTER TABLE itinerary_items
  ADD CONSTRAINT itinerary_items_parent_item_id_trip_id_fkey
  FOREIGN KEY (parent_item_id, trip_id) REFERENCES itinerary_items(id, trip_id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX IF NOT EXISTS itinerary_items_parent_idx
  ON itinerary_items (trip_id, parent_item_id, day, sort_order)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS plan_checks (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  created_by uuid NOT NULL,
  itinerary_fingerprint text NOT NULL,
  language_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'complete' CHECK (status IN ('running', 'complete', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  version bigint NOT NULL DEFAULT 1,
  UNIQUE (trip_id, id),
  FOREIGN KEY (created_by, trip_id) REFERENCES trip_members(id, trip_id)
);

CREATE INDEX IF NOT EXISTS plan_checks_trip_created_idx
  ON plan_checks (trip_id, created_at DESC);

CREATE TABLE IF NOT EXISTS plan_suggestions (
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

CREATE INDEX IF NOT EXISTS plan_suggestions_check_idx
  ON plan_suggestions (plan_check_id, status, severity);
