ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS comments jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'expenses_comments_array'
  ) THEN
    ALTER TABLE expenses
      ADD CONSTRAINT expenses_comments_array
      CHECK (jsonb_typeof(comments) = 'array');
  END IF;
END $$;
