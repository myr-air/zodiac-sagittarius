ALTER TABLE trip_tasks
  ADD COLUMN IF NOT EXISTS trip_plan_id uuid;

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS trip_plan_id uuid;

ALTER TABLE stop_notes
  ADD COLUMN IF NOT EXISTS trip_plan_id uuid;

ALTER TABLE booking_docs
  ADD COLUMN IF NOT EXISTS trip_plan_id uuid;

UPDATE trip_tasks task
SET trip_plan_id = trips.active_plan_variant_id
FROM trips
WHERE task.trip_id = trips.id
  AND task.trip_plan_id IS NULL;

UPDATE expenses expense
SET trip_plan_id = item.plan_variant_id
FROM itinerary_items item
WHERE expense.trip_id = item.trip_id
  AND expense.itinerary_item_id = item.id
  AND expense.trip_plan_id IS NULL;

UPDATE expenses expense
SET trip_plan_id = trips.active_plan_variant_id
FROM trips
WHERE expense.trip_id = trips.id
  AND expense.itinerary_item_id IS NULL
  AND expense.trip_plan_id IS NULL;

UPDATE stop_notes note
SET trip_plan_id = item.plan_variant_id
FROM itinerary_items item
WHERE note.trip_id = item.trip_id
  AND note.itinerary_item_id = item.id
  AND note.trip_plan_id IS NULL;

UPDATE booking_docs booking
SET trip_plan_id = trips.active_plan_variant_id
FROM trips
WHERE booking.trip_id = trips.id
  AND booking.trip_plan_id IS NULL;

ALTER TABLE trip_tasks
  ADD CONSTRAINT trip_tasks_trip_plan_fkey
  FOREIGN KEY (trip_plan_id, trip_id) REFERENCES plan_variants(id, trip_id) NOT VALID;

ALTER TABLE expenses
  ADD CONSTRAINT expenses_trip_plan_fkey
  FOREIGN KEY (trip_plan_id, trip_id) REFERENCES plan_variants(id, trip_id) NOT VALID;

ALTER TABLE stop_notes
  ADD CONSTRAINT stop_notes_trip_plan_fkey
  FOREIGN KEY (trip_plan_id, trip_id) REFERENCES plan_variants(id, trip_id) NOT VALID;

ALTER TABLE booking_docs
  ADD CONSTRAINT booking_docs_trip_plan_fkey
  FOREIGN KEY (trip_plan_id, trip_id) REFERENCES plan_variants(id, trip_id) NOT VALID;

ALTER TABLE trip_tasks VALIDATE CONSTRAINT trip_tasks_trip_plan_fkey;
ALTER TABLE expenses VALIDATE CONSTRAINT expenses_trip_plan_fkey;
ALTER TABLE stop_notes VALIDATE CONSTRAINT stop_notes_trip_plan_fkey;
ALTER TABLE booking_docs VALIDATE CONSTRAINT booking_docs_trip_plan_fkey;

CREATE INDEX IF NOT EXISTS trip_tasks_trip_plan_active_idx
  ON trip_tasks (trip_id, trip_plan_id, visibility, status, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS expenses_trip_plan_active_idx
  ON expenses (trip_id, trip_plan_id, created_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS stop_notes_trip_plan_item_idx
  ON stop_notes (trip_id, trip_plan_id, itinerary_item_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS booking_docs_trip_plan_active_idx
  ON booking_docs (trip_id, trip_plan_id, starts_at, created_at)
  WHERE deleted_at IS NULL;
