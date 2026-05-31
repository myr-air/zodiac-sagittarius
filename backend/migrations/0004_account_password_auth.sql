ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash text;

CREATE INDEX IF NOT EXISTS users_password_enabled_idx
  ON users (id)
  WHERE password_hash IS NOT NULL AND disabled_at IS NULL;
