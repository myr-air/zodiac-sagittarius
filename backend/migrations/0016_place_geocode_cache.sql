CREATE TABLE place_geocode_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_query text NOT NULL UNIQUE,
  query text NOT NULL,
  country_codes text[] NOT NULL DEFAULT '{}'::text[],
  display_name text NOT NULL,
  source text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX place_geocode_cache_country_codes_idx
  ON place_geocode_cache USING gin (country_codes);
