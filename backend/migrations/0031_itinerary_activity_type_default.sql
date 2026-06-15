ALTER TABLE itinerary_items
  DROP CONSTRAINT itinerary_items_activity_type_check,
  ADD CONSTRAINT itinerary_items_activity_type_check
  CHECK (activity_type IN ('travel', 'food', 'shopping', 'attraction', 'experience', 'stay', 'default'));
