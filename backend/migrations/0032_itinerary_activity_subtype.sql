ALTER TABLE itinerary_items
  ADD COLUMN IF NOT EXISTS activity_subtype text;

UPDATE itinerary_items
SET activity_subtype = coalesce(
  nullif(details->>'subtype', ''),
  CASE
    WHEN lower(nullif(details->>'mode', '')) IN ('flight', 'train', 'bus', 'taxi', 'ferry', 'walk', 'car', 'shuttle')
      THEN lower(details->>'mode')
    ELSE NULL
  END
)
WHERE activity_subtype IS NULL
  AND activity_type = 'travel';

ALTER TABLE itinerary_items
  DROP CONSTRAINT IF EXISTS itinerary_items_activity_subtype_check;

ALTER TABLE itinerary_items
  ADD CONSTRAINT itinerary_items_activity_subtype_check
  CHECK (
    activity_subtype IS NULL OR
    activity_subtype IN ('flight', 'train', 'bus', 'taxi', 'ferry', 'walk', 'car', 'shuttle')
  );
