CREATE TABLE stop_notes (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  itinerary_item_id uuid NOT NULL,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1,
  FOREIGN KEY (itinerary_item_id, trip_id) REFERENCES itinerary_items(id, trip_id),
  FOREIGN KEY (author_id, trip_id) REFERENCES trip_members(id, trip_id)
);

CREATE INDEX stop_notes_trip_item_created_at_idx
  ON stop_notes (trip_id, itinerary_item_id, created_at DESC)
  WHERE deleted_at IS NULL;
