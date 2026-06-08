WITH ranked AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY user_id, label
      ORDER BY coalesce(last_seen_at, created_at) DESC, created_at DESC, id ASC
    ) AS kept_id,
    row_number() OVER (
      PARTITION BY user_id, label
      ORDER BY coalesce(last_seen_at, created_at) DESC, created_at DESC, id ASC
    ) AS duplicate_rank
  FROM trusted_devices
  WHERE revoked_at IS NULL
),
duplicates AS (
  SELECT id, kept_id
  FROM ranked
  WHERE duplicate_rank > 1
)
UPDATE user_sessions
SET trusted_device_id = duplicates.kept_id
FROM duplicates
WHERE user_sessions.trusted_device_id = duplicates.id;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, label
      ORDER BY coalesce(last_seen_at, created_at) DESC, created_at DESC, id ASC
    ) AS duplicate_rank
  FROM trusted_devices
  WHERE revoked_at IS NULL
)
UPDATE trusted_devices
SET revoked_at = now()
FROM ranked
WHERE trusted_devices.id = ranked.id
  AND ranked.duplicate_rank > 1;

CREATE UNIQUE INDEX trusted_devices_user_active_label_key
  ON trusted_devices (user_id, label)
  WHERE revoked_at IS NULL;
