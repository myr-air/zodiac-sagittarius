CREATE TABLE expense_reminders (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  from_member_id uuid NOT NULL,
  to_member_id uuid NOT NULL,
  amount_minor integer NOT NULL CHECK (amount_minor > 0),
  last_reminded_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1,
  UNIQUE (trip_id, from_member_id, to_member_id, amount_minor),
  FOREIGN KEY (from_member_id, trip_id) REFERENCES trip_members(id, trip_id),
  FOREIGN KEY (to_member_id, trip_id) REFERENCES trip_members(id, trip_id),
  FOREIGN KEY (created_by, trip_id) REFERENCES trip_members(id, trip_id)
);

CREATE INDEX expense_reminders_trip_pair_idx
  ON expense_reminders (trip_id, from_member_id, to_member_id, amount_minor);
