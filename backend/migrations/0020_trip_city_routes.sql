ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS origin_label text NOT NULL DEFAULT 'Bangkok, Thailand',
  ADD COLUMN IF NOT EXISTS origin_city text NOT NULL DEFAULT 'Bangkok',
  ADD COLUMN IF NOT EXISTS origin_country text NOT NULL DEFAULT 'Thailand',
  ADD COLUMN IF NOT EXISTS origin_country_code text NOT NULL DEFAULT 'TH',
  ADD COLUMN IF NOT EXISTS destination_cities jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS home_city text,
  ADD COLUMN IF NOT EXISTS home_country text;
