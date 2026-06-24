ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS stored_value_card_id text,
  ADD COLUMN IF NOT EXISTS stored_value_card_name text,
  ADD COLUMN IF NOT EXISTS stored_value_transaction_type text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'expenses_stored_value_transaction_type_valid'
  ) THEN
    ALTER TABLE expenses
      ADD CONSTRAINT expenses_stored_value_transaction_type_valid
      CHECK (
        stored_value_transaction_type IS NULL
        OR stored_value_transaction_type IN ('topup', 'spend', 'refund')
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'expenses_stored_value_card_required'
  ) THEN
    ALTER TABLE expenses
      ADD CONSTRAINT expenses_stored_value_card_required
      CHECK (
        stored_value_transaction_type IS NULL
        OR nullif(stored_value_card_id, '') IS NOT NULL
        OR nullif(stored_value_card_name, '') IS NOT NULL
      );
  END IF;
END $$;
