CREATE TABLE trip_daily_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  briefing_date date NOT NULL,
  location_key text NOT NULL,
  location_label text NOT NULL,
  coordinates jsonb,
  weather jsonb,
  holiday jsonb,
  festival jsonb,
  facts jsonb,
  outfit_advice jsonb,
  manual_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1,
  UNIQUE (trip_id, briefing_date, location_key)
);

CREATE INDEX trip_daily_briefings_trip_date_idx
  ON trip_daily_briefings (trip_id, briefing_date);
