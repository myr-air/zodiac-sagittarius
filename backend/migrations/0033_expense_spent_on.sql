ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS spent_on date;

UPDATE expenses
SET spent_on = created_at::date
WHERE spent_on IS NULL;
