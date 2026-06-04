CREATE TABLE trip_join_invite_tokens (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  token_hash text NOT NULL UNIQUE,
  created_by uuid REFERENCES trip_members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE INDEX trip_join_invite_tokens_trip_active_idx
  ON trip_join_invite_tokens (trip_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE INDEX trip_join_invite_tokens_active_hash_idx
  ON trip_join_invite_tokens (token_hash)
  WHERE revoked_at IS NULL;
