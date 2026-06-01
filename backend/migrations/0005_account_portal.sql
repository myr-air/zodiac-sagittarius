CREATE TABLE account_vault_items (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  trip_id uuid REFERENCES trips(id),
  kind text NOT NULL CHECK (kind IN ('note', 'file')),
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  external_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX account_vault_items_user_created_idx
  ON account_vault_items (user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX account_vault_items_trip_idx
  ON account_vault_items (trip_id, created_at DESC)
  WHERE deleted_at IS NULL;
