# Bookings & Docs Backend Integration Design

## Status

Approved direction from user: use the long-term normalized data model, not JSON
relation arrays.

## Context

The frontend now has a `Bookings & Docs` workspace for flights, trains, hotels,
activity tickets, insurance, passports, visas, and other trip records. It works
as the source of truth in local mode, but API mode still treats booking docs as
read-only because the backend does not yet expose booking mutation endpoints.

The backend must support this as a real trip domain, not as uploaded files.
Sagittarius stores metadata and external URLs only. Files stay at providers,
Google Drive, or other cloud storage.

## Goals

- Persist booking docs in PostgreSQL as first-class trip records.
- Normalize all relations so itinerary, todo, note, expense, member, and link
  relationships are queryable and maintainable long term.
- Include booking docs in `TripCockpit`.
- Allow API-mode create, update, and delete from the existing frontend page.
- Enforce backend permissions and visibility, especially for sensitive and
  private records.
- Emit realtime events for booking mutations.

## Non-Goals

- No file upload.
- No server-side file storage.
- No remote document fetching, previewing, proxying, or antivirus scanning.
- No standalone account-level vault migration in this step.
- No relation backlink UI outside the Bookings & Docs page in this step.

## Data Model

Add `booking_docs`:

- `id uuid primary key`
- `trip_id uuid not null references trips(id)`
- `type text not null`
- `title text not null`
- `status text not null`
- `visibility text not null`
- `owner_member_id uuid null references trip_members(id)`
- `provider_name text null`
- `confirmation_code text null`
- `starts_at timestamptz null`
- `ends_at timestamptz null`
- `timezone text null`
- `price_minor integer null`
- `currency text null`
- `notes text null`
- `created_by uuid not null references trip_members(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`
- `version bigint not null default 1`

Use `price_minor` in backend for money correctness. The frontend can keep
`priceAmount` and convert through API mapping.

Add normalized child tables:

- `booking_doc_external_links`
  - `id uuid primary key`
  - `booking_doc_id uuid not null references booking_docs(id)`
  - `label text not null`
  - `url text not null`
  - `provider text null`
  - `access_note text null`
  - `sort_order integer not null default 0`

- `booking_doc_travelers`
  - `booking_doc_id uuid not null references booking_docs(id)`
  - `member_id uuid not null references trip_members(id)`
  - primary key `(booking_doc_id, member_id)`

- `booking_doc_itinerary_items`
  - `booking_doc_id uuid not null references booking_docs(id)`
  - `itinerary_item_id uuid not null references itinerary_items(id)`
  - primary key `(booking_doc_id, itinerary_item_id)`

- `booking_doc_tasks`
  - `booking_doc_id uuid not null references booking_docs(id)`
  - `task_id uuid not null references trip_tasks(id)`
  - primary key `(booking_doc_id, task_id)`

- `booking_doc_expenses`
  - `booking_doc_id uuid not null references booking_docs(id)`
  - `expense_id uuid not null references expenses(id)`
  - primary key `(booking_doc_id, expense_id)`

- `booking_doc_stop_notes`
  - `booking_doc_id uuid not null references booking_docs(id)`
  - `stop_note_id uuid not null references stop_notes(id)`
  - primary key `(booking_doc_id, stop_note_id)`

Each relation table is constrained by app-level validation so the related row
belongs to the same trip. PostgreSQL cannot express all cross-table trip
matching through a simple foreign key without extra composite keys, so the app
service validates before insert/update.

## Domain Types

Backend `BookingDocSummary` serializes to the frontend contract:

- `id`
- `tripId`
- `type`
- `title`
- `status`
- `visibility`
- `ownerMemberId`
- `providerName`
- `confirmationCode`
- `startsAt`
- `endsAt`
- `timezone`
- `priceAmount`
- `currency`
- `travelerIds`
- `externalLinks`
- `relatedItineraryItemIds`
- `relatedTaskIds`
- `relatedExpenseIds`
- `noteIds`
- `notes`
- `createdBy`
- `updatedAt`
- `version`

`externalLinks` contains `BookingDocExternalLinkSummary`.

## API

Add endpoints:

- `POST /api/v1/trips/{trip_id}/bookings`
- `PATCH /api/v1/trips/{trip_id}/bookings/{booking_id}`
- `DELETE /api/v1/trips/{trip_id}/bookings/{booking_id}`

Create request:

- `clientMutationId`
- all editable booking doc fields except `id`, `tripId`, `createdBy`,
  `updatedAt`, and `version`

Patch request:

- `clientMutationId`
- `expectedVersion`
- `patch` object with nullable fields where clearing is allowed

Delete returns the soft-deleted booking summary so realtime consumers can remove
the local item by id and version.

## Permissions

Add capability `EditBookings`.

- `owner`: view all, edit all
- `organizer`: view shared and sensitive, edit all non-deleted booking docs
- `traveler`: view shared, plus sensitive/private records where they are a
  traveler, owner, or creator
- `viewer`: view shared only

Create/update/delete requires `EditBookings`.

Visibility filtering must happen before `TripCockpit` serialization. Users who
cannot view a booking do not receive sensitive metadata from the API. The
frontend may show locked sensitive local records in local mode, but API mode
does not leak hidden records. A separate redacted-read endpoint can be designed
later if the product needs locked rows in API mode.

## Validation

Validate:

- `clientMutationId` is present.
- `title` is non-empty and bounded.
- `type`, `status`, and `visibility` are known values.
- external link URLs are valid `http` or `https`.
- linked members, itinerary items, tasks, expenses, and stop notes exist in the
  same trip.
- `ownerMemberId`, when present, belongs to the trip.
- `travelerIds` contains only trip members.
- `currency`, when present, is a short uppercase currency code.
- `priceAmount` from frontend maps to non-negative `priceMinor`.
- patch `expectedVersion` matches the locked record version.

## Backend Architecture

Follow existing backend patterns:

- `domain/types.rs`: add DTOs and `Capability::EditBookings`.
- `domain/patches.rs`: add create/patch request structs and validation.
- `db/models.rs`: add booking record models and new-record structs.
- `db/queries.rs`: add SQL functions for list, lock, insert, update,
  soft-delete, and relation replacement.
- `app/bookings.rs`: implement auth, transaction, validation, event writing,
  and DTO assembly.
- `api/bookings.rs`: expose handlers.
- `api/mod.rs`: register routes.
- `app/trips.rs`: include visible booking docs in `TripCockpit`.
- `migrations/0017_booking_docs.sql`: create tables and indexes.

## Frontend Integration

Update `frontend/src/trip/api-client.ts`:

- add `CreateBookingDocApiRequest`
- add `PatchBookingDocApiRequest`
- add `createBookingDoc`
- add `patchBookingDoc`
- add `deleteBookingDoc`
- map backend `priceMinor`/`priceAmount` consistently

Update `SagittariusApp`:

- `canEditBookings` allows API mode when the current role has booking edit
  capability.
- create/update/delete handlers call backend in API mode.
- on successful mutation, replace the local cockpit booking list with returned
  booking docs.
- on `version_conflict`, reload cockpit using the existing conflict pattern.

Keep local mode behavior unchanged.

## Realtime

Emit events:

- `booking.created`
- `booking.updated`
- `booking.deleted`

Payload includes the serialized `BookingDocSummary`.

## Testing

Backend:

- request validation tests
- permission tests for owner/organizer/traveler/viewer
- visibility filtering tests for `TripCockpit`
- create/update/delete integration tests against the local test database
- relation validation tests for cross-trip ids

Frontend:

- API client tests for create/patch/delete request shapes
- `SagittariusApp` API-mode tests for create/update/delete bookings
- existing `BookingsDocsPage` tests continue to cover UI behavior

Real QA:

- run backend + frontend local stack
- join a trip through API mode
- open `/trips/:tripId/bookings`
- create, edit, and delete one booking doc
- verify reload preserves server data
- verify viewer cannot mutate bookings
- check desktop/mobile page overflow and console errors

## Implementation Order

1. Backend migration and domain DTO/request types.
2. Backend queries and app service.
3. API routes and cockpit serialization.
4. Backend tests.
5. Frontend API client methods.
6. API-mode wiring in `SagittariusApp`.
7. Frontend tests.
8. Real API and browser QA.
