CREATE TABLE auth_attempt_locks (
  scope text NOT NULL,
  attempt_key text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, attempt_key)
);

CREATE INDEX auth_attempt_locks_locked_until_idx
  ON auth_attempt_locks (locked_until)
  WHERE locked_until IS NOT NULL;
