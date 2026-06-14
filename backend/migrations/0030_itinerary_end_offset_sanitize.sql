update itinerary_items
set end_offset_days = 0,
    updated_at = now()
where end_time is null
  and end_offset_days <> 0;

alter table itinerary_items
  drop constraint if exists itinerary_items_end_offset_requires_end_time;

alter table itinerary_items
  add constraint itinerary_items_end_offset_requires_end_time
  check (end_time is not null or end_offset_days = 0);
