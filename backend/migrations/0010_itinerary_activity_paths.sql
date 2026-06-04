ALTER TABLE itinerary_items
  ADD COLUMN path_group_id text,
  ADD COLUMN path_id text,
  ADD COLUMN path_name text,
  ADD COLUMN path_role text CHECK (path_role IS NULL OR path_role IN ('main', 'alternative'));

CREATE INDEX itinerary_items_trip_plan_path_idx
  ON itinerary_items (trip_id, plan_variant_id, path_id, day, sort_order)
  WHERE deleted_at IS NULL;
