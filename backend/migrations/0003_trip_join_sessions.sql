CREATE TABLE trip_join_sessions (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  join_session_token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE INDEX trip_join_sessions_trip_active_idx
  ON trip_join_sessions (trip_id, expires_at DESC)
  WHERE consumed_at IS NULL;
