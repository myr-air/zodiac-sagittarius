ALTER TABLE plan_checks
  ADD COLUMN IF NOT EXISTS trip_plan_id uuid;

ALTER TABLE plan_checks
  DROP CONSTRAINT IF EXISTS plan_checks_trip_plan_fkey;

ALTER TABLE plan_checks
  ADD CONSTRAINT plan_checks_trip_plan_fkey
  FOREIGN KEY (trip_plan_id, trip_id) REFERENCES plan_variants(id, trip_id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX IF NOT EXISTS plan_checks_trip_plan_created_idx
  ON plan_checks (trip_id, trip_plan_id, created_at DESC)
  WHERE trip_plan_id IS NOT NULL;
