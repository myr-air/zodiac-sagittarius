ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS receipt_url text,
  ADD COLUMN IF NOT EXISTS line_items jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'expenses_line_items_array'
  ) THEN
    ALTER TABLE expenses
      ADD CONSTRAINT expenses_line_items_array
      CHECK (jsonb_typeof(line_items) = 'array');
  END IF;
END $$;
