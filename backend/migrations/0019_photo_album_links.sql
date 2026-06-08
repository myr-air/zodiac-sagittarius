create table photo_album_links (
  id uuid primary key,
  trip_id uuid not null references trips(id) on delete cascade,
  title text not null,
  provider text not null,
  url text not null,
  access text not null,
  owner_member_id uuid,
  day date,
  description text,
  access_note text,
  cover_url text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version bigint not null default 1,
  constraint photo_album_links_id_trip_id_key unique (id, trip_id),
  constraint photo_album_links_provider_check check (provider in ('google_photos', 'icloud', 'google_drive', 'dropbox', 'onedrive', 'custom')),
  constraint photo_album_links_access_check check (access in ('view_only', 'collaborative', 'upload_request')),
  constraint photo_album_links_owner_member_trip_fkey foreign key (owner_member_id, trip_id) references trip_members(id, trip_id),
  constraint photo_album_links_created_by_trip_fkey foreign key (created_by, trip_id) references trip_members(id, trip_id)
);

create index photo_album_links_trip_active_idx on photo_album_links (trip_id, day, created_at) where deleted_at is null;
create index photo_album_links_owner_idx on photo_album_links (trip_id, owner_member_id) where deleted_at is null;
create index photo_album_links_created_by_idx on photo_album_links (trip_id, created_by) where deleted_at is null;

create table photo_album_link_itinerary_items (
  trip_id uuid not null,
  photo_album_link_id uuid not null,
  itinerary_item_id uuid not null,
  primary key (photo_album_link_id, itinerary_item_id),
  constraint photo_album_link_itinerary_items_album_trip_fkey foreign key (photo_album_link_id, trip_id) references photo_album_links(id, trip_id) on delete cascade,
  constraint photo_album_link_itinerary_items_item_trip_fkey foreign key (itinerary_item_id, trip_id) references itinerary_items(id, trip_id) on delete cascade
);

create index photo_album_link_itinerary_items_trip_album_idx on photo_album_link_itinerary_items (trip_id, photo_album_link_id);
