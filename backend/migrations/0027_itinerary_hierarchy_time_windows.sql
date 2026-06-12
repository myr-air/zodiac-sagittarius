ALTER TABLE itinerary_items
  ADD COLUMN IF NOT EXISTS end_time time,
  ADD COLUMN IF NOT EXISTS end_offset_days integer NOT NULL DEFAULT 0
    CHECK (end_offset_days BETWEEN 0 AND 7);

ALTER TABLE itinerary_items
  ADD CONSTRAINT itinerary_items_no_self_parent_check
  CHECK (parent_item_id IS NULL OR parent_item_id <> id) NOT VALID;

ALTER TABLE itinerary_items
  VALIDATE CONSTRAINT itinerary_items_no_self_parent_check;

CREATE INDEX IF NOT EXISTS itinerary_items_time_window_idx
  ON itinerary_items (trip_id, plan_variant_id, day, start_time, end_time)
  WHERE deleted_at IS NULL;
