alter table trip_tasks
  add constraint trip_tasks_id_trip_id_key unique (id, trip_id);

alter table expenses
  add constraint expenses_id_trip_id_key unique (id, trip_id);

alter table stop_notes
  add constraint stop_notes_id_trip_id_key unique (id, trip_id);

create table booking_docs (
  id uuid primary key,
  trip_id uuid not null references trips(id) on delete cascade,
  type text not null,
  title text not null,
  status text not null,
  visibility text not null,
  owner_member_id uuid,
  provider_name text,
  confirmation_code text,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text,
  price_minor integer,
  currency text,
  notes text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version bigint not null default 1,
  constraint booking_docs_id_trip_id_key unique (id, trip_id),
  constraint booking_docs_type_check check (type in ('flight', 'train', 'public_transport', 'hotel', 'insurance', 'passport', 'visa', 'activity_ticket', 'other')),
  constraint booking_docs_status_check check (status in ('draft', 'needs_action', 'booked', 'confirmed', 'paid', 'cancelled', 'expired')),
  constraint booking_docs_visibility_check check (visibility in ('shared', 'sensitive', 'private')),
  constraint booking_docs_price_minor_check check (price_minor is null or price_minor >= 0),
  constraint booking_docs_owner_member_trip_fkey foreign key (owner_member_id, trip_id) references trip_members(id, trip_id),
  constraint booking_docs_created_by_trip_fkey foreign key (created_by, trip_id) references trip_members(id, trip_id)
);

create index booking_docs_trip_active_idx on booking_docs (trip_id, starts_at, created_at) where deleted_at is null;
create index booking_docs_owner_idx on booking_docs (trip_id, owner_member_id) where deleted_at is null;
create index booking_docs_created_by_idx on booking_docs (trip_id, created_by) where deleted_at is null;

create table booking_doc_external_links (
  id uuid primary key,
  trip_id uuid not null,
  booking_doc_id uuid not null,
  label text not null,
  url text not null,
  provider text,
  access_note text,
  sort_order integer not null default 0,
  constraint booking_doc_external_links_doc_trip_fkey foreign key (booking_doc_id, trip_id) references booking_docs(id, trip_id) on delete cascade
);

create index booking_doc_external_links_doc_idx on booking_doc_external_links (trip_id, booking_doc_id, sort_order);

create table booking_doc_travelers (
  trip_id uuid not null,
  booking_doc_id uuid not null,
  member_id uuid not null,
  primary key (booking_doc_id, member_id),
  constraint booking_doc_travelers_doc_trip_fkey foreign key (booking_doc_id, trip_id) references booking_docs(id, trip_id) on delete cascade,
  constraint booking_doc_travelers_member_trip_fkey foreign key (member_id, trip_id) references trip_members(id, trip_id) on delete cascade
);

create index booking_doc_travelers_trip_doc_idx on booking_doc_travelers (trip_id, booking_doc_id);

create table booking_doc_itinerary_items (
  trip_id uuid not null,
  booking_doc_id uuid not null,
  itinerary_item_id uuid not null,
  primary key (booking_doc_id, itinerary_item_id),
  constraint booking_doc_itinerary_items_doc_trip_fkey foreign key (booking_doc_id, trip_id) references booking_docs(id, trip_id) on delete cascade,
  constraint booking_doc_itinerary_items_item_trip_fkey foreign key (itinerary_item_id, trip_id) references itinerary_items(id, trip_id) on delete cascade
);

create index booking_doc_itinerary_items_trip_doc_idx on booking_doc_itinerary_items (trip_id, booking_doc_id);

create table booking_doc_tasks (
  trip_id uuid not null,
  booking_doc_id uuid not null,
  task_id uuid not null,
  primary key (booking_doc_id, task_id),
  constraint booking_doc_tasks_doc_trip_fkey foreign key (booking_doc_id, trip_id) references booking_docs(id, trip_id) on delete cascade,
  constraint booking_doc_tasks_task_trip_fkey foreign key (task_id, trip_id) references trip_tasks(id, trip_id) on delete cascade
);

create index booking_doc_tasks_trip_doc_idx on booking_doc_tasks (trip_id, booking_doc_id);

create table booking_doc_expenses (
  trip_id uuid not null,
  booking_doc_id uuid not null,
  expense_id uuid not null,
  primary key (booking_doc_id, expense_id),
  constraint booking_doc_expenses_doc_trip_fkey foreign key (booking_doc_id, trip_id) references booking_docs(id, trip_id) on delete cascade,
  constraint booking_doc_expenses_expense_trip_fkey foreign key (expense_id, trip_id) references expenses(id, trip_id) on delete cascade
);

create index booking_doc_expenses_trip_doc_idx on booking_doc_expenses (trip_id, booking_doc_id);

create table booking_doc_stop_notes (
  trip_id uuid not null,
  booking_doc_id uuid not null,
  stop_note_id uuid not null,
  primary key (booking_doc_id, stop_note_id),
  constraint booking_doc_stop_notes_doc_trip_fkey foreign key (booking_doc_id, trip_id) references booking_docs(id, trip_id) on delete cascade,
  constraint booking_doc_stop_notes_note_trip_fkey foreign key (stop_note_id, trip_id) references stop_notes(id, trip_id) on delete cascade
);

create index booking_doc_stop_notes_trip_doc_idx on booking_doc_stop_notes (trip_id, booking_doc_id);
