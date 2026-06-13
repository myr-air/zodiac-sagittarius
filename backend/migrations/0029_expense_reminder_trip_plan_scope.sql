ALTER TABLE expense_reminders
  ADD COLUMN IF NOT EXISTS trip_plan_id uuid;

UPDATE expense_reminders reminder
SET trip_plan_id = trips.active_plan_variant_id
FROM trips
WHERE reminder.trip_id = trips.id
  AND reminder.trip_plan_id IS NULL;

ALTER TABLE expense_reminders
  ALTER COLUMN trip_plan_id SET NOT NULL;

ALTER TABLE expense_reminders
  ADD CONSTRAINT expense_reminders_trip_plan_fkey
  FOREIGN KEY (trip_plan_id, trip_id) REFERENCES plan_variants(id, trip_id) NOT VALID;

ALTER TABLE expense_reminders VALIDATE CONSTRAINT expense_reminders_trip_plan_fkey;

ALTER TABLE expense_reminders
  DROP CONSTRAINT IF EXISTS expense_reminders_trip_id_from_member_id_to_member_id_amount_minor_key;

ALTER TABLE expense_reminders
  ADD CONSTRAINT expense_reminders_trip_plan_pair_key
  UNIQUE (trip_id, trip_plan_id, from_member_id, to_member_id, amount_minor);

CREATE INDEX IF NOT EXISTS expense_reminders_trip_plan_pair_idx
  ON expense_reminders (trip_id, trip_plan_id, from_member_id, to_member_id, amount_minor);
