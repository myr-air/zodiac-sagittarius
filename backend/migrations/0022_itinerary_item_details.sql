alter table itinerary_items
  add column if not exists details jsonb not null default '{}'::jsonb;
