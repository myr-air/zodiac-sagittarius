ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS settlement_allocations jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'expenses_settlement_allocations_array'
  ) THEN
    ALTER TABLE expenses
      ADD CONSTRAINT expenses_settlement_allocations_array
      CHECK (jsonb_typeof(settlement_allocations) = 'array');
  END IF;
END $$;
