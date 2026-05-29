CREATE TABLE users (
  id uuid PRIMARY KEY,
  display_name text NOT NULL,
  avatar_color text NOT NULL,
  locale text NOT NULL DEFAULT 'th-TH',
  timezone text NOT NULL DEFAULT 'Asia/Bangkok',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz
);

CREATE TABLE user_emails (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  email text NOT NULL,
  normalized_email text NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX user_emails_normalized_email_idx
  ON user_emails (normalized_email);

CREATE TABLE email_login_challenges (
  id uuid PRIMARY KEY,
  normalized_email text NOT NULL,
  code_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE INDEX email_login_challenges_email_active_idx
  ON email_login_challenges (normalized_email, expires_at DESC)
  WHERE consumed_at IS NULL;

CREATE TABLE webauthn_challenges (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  challenge text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('register', 'login')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE INDEX webauthn_challenges_challenge_active_idx
  ON webauthn_challenges (challenge, expires_at DESC)
  WHERE consumed_at IS NULL;

CREATE TABLE webauthn_credentials (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  credential_id text NOT NULL,
  public_key jsonb NOT NULL,
  sign_count bigint NOT NULL DEFAULT 0,
  nickname text NOT NULL DEFAULT 'Passkey',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE UNIQUE INDEX webauthn_credentials_credential_id_idx
  ON webauthn_credentials (credential_id);

CREATE TABLE trusted_devices (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  label text NOT NULL,
  user_agent text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  revoked_at timestamptz
);

CREATE INDEX trusted_devices_user_active_idx
  ON trusted_devices (user_id, last_seen_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE user_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  trusted_device_id uuid REFERENCES trusted_devices(id),
  session_token_hash text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('temporary', 'trusted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE UNIQUE INDEX user_sessions_token_hash_idx
  ON user_sessions (session_token_hash);

CREATE INDEX user_sessions_user_active_idx
  ON user_sessions (user_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE account_audit_events (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  trip_id uuid REFERENCES trips(id),
  actor_user_id uuid REFERENCES users(id),
  actor_member_id uuid REFERENCES trip_members(id),
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX account_audit_events_user_created_idx
  ON account_audit_events (user_id, created_at DESC);

ALTER TABLE trip_members
  ADD CONSTRAINT trip_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id);

CREATE INDEX trip_members_user_id_idx
  ON trip_members (user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX trip_members_one_owner_per_trip_idx
  ON trip_members (trip_id)
  WHERE role = 'owner';
