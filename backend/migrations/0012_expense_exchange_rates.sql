ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS exchange_rate_to_settlement_currency double precision NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'expenses_exchange_rate_to_settlement_currency_positive'
  ) THEN
    ALTER TABLE expenses
      ADD CONSTRAINT expenses_exchange_rate_to_settlement_currency_positive
      CHECK (exchange_rate_to_settlement_currency > 0);
  END IF;
END $$;
