ALTER TABLE itinerary_items
  ADD COLUMN IF NOT EXISTS end_time time,
  ADD COLUMN IF NOT EXISTS end_offset_days integer NOT NULL DEFAULT 0
    CHECK (end_offset_days BETWEEN 0 AND 7);

ALTER TABLE itinerary_items
  ADD CONSTRAINT itinerary_items_no_self_parent_check
  CHECK (parent_item_id IS NULL OR parent_item_id <> id) NOT VALID;

ALTER TABLE itinerary_items
  VALIDATE CONSTRAINT itinerary_items_no_self_parent_check;

CREATE UNIQUE INDEX IF NOT EXISTS itinerary_items_parent_scope_key
  ON itinerary_items (id, trip_id, plan_variant_id, day);

ALTER TABLE itinerary_items
  ADD CONSTRAINT itinerary_items_parent_scope_fkey
  FOREIGN KEY (parent_item_id, trip_id, plan_variant_id, day)
  REFERENCES itinerary_items(id, trip_id, plan_variant_id, day)
  NOT VALID;

ALTER TABLE itinerary_items
  VALIDATE CONSTRAINT itinerary_items_parent_scope_fkey;

CREATE INDEX IF NOT EXISTS itinerary_items_parent_scope_idx
  ON itinerary_items (trip_id, plan_variant_id, day, parent_item_id)
  WHERE parent_item_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS itinerary_items_time_window_idx
  ON itinerary_items (trip_id, plan_variant_id, day, start_time, end_time)
  WHERE deleted_at IS NULL;
