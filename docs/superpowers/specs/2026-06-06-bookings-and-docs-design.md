# Bookings & Docs Design

## Status

Approved for design on 2026-06-06. Ready for implementation planning after user
review.

## Context

Sagittarius needs a trip-level source of truth for tickets, reservations, and
travel documents. These items often contain price, time, confirmation, traveler,
and action state that cannot live cleanly in only itinerary rows, expenses,
tasks, or notes.

The feature must not store files on the server. Most users already keep booking
PDFs, vouchers, passport scans, or policy documents at the source provider,
Google Drive, or another cloud location. Sagittarius should store external
links and user-entered metadata only.

Pinterest references used as directional input:

- [Travel Itinerary App UI Design](https://www.pinterest.com/pin/666814288549697824/):
  useful mobile grouping and trip-day scan patterns.
- [Innap - Hotel Booking Dashboard UI](https://in.pinterest.com/pin/620019073719020575/):
  useful dashboard filters and reservation status patterns.
- [TripAxis - Hotel Booking Dashboard SaaS UX/UI Design](https://www.pinterest.com/pin/tripaxis-hotel-booking-dashboard-saas-uxui-design-in-2025--959759370589899466/):
  useful booking management composition signals.
- [Flight Booking Dashboard - UI Design](https://www.pinterest.com/pin/flight-booking-dashboard-ui-design--927319379512951624/):
  useful route, time, and confirmation-code visual grammar.

These are inspiration references only. The Sagittarius page should remain a
calm travel operations cockpit, not a booking marketplace or decorative travel
gallery.

## Decision

Create a new trip workspace page named `Bookings & Docs`.

Use an operational ledger as the primary surface, with a contextual inspector on
desktop and a stacked detail view on mobile. This combines the organizer value
of a dense table with enough document-vault affordance to keep links,
confirmation data, and related trip context easy to inspect.

The route should be short and predictable:

- UI label: `Bookings & Docs`
- Route: `/trips/:tripId/bookings`
- Planning view id: `bookings`

`BookingDoc` is the source of truth. It links outward to itinerary items,
tasks, notes, expenses, and members. Those related domains may show backlinks in
the UI, but they should not duplicate booking metadata.

## Entity Model

Add a `BookingDoc` entity to the trip domain.

```ts
export type BookingDocType =
  | "flight"
  | "train"
  | "public_transport"
  | "hotel"
  | "insurance"
  | "passport"
  | "visa"
  | "activity_ticket"
  | "other";

export type BookingDocStatus =
  | "draft"
  | "needs_action"
  | "booked"
  | "confirmed"
  | "paid"
  | "cancelled"
  | "expired";

export type BookingDocVisibility = "shared" | "sensitive" | "private";

export interface BookingDocExternalLink {
  id: string;
  label: string;
  url: string;
  provider?: string | null;
  accessNote?: string | null;
}

export interface BookingDoc {
  id: string;
  tripId: string;
  type: BookingDocType;
  title: string;
  status: BookingDocStatus;
  visibility: BookingDocVisibility;
  ownerMemberId?: string | null;
  providerName?: string | null;
  confirmationCode?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  timezone?: string | null;
  priceAmount?: number | null;
  currency?: string | null;
  travelerIds: string[];
  externalLinks: BookingDocExternalLink[];
  relatedItineraryItemIds: string[];
  relatedTaskIds: string[];
  relatedExpenseIds: string[];
  noteIds: string[];
  notes?: string | null;
  createdBy: string;
  updatedAt: string;
  version: number;
}
```

Passport, visa, and insurance records should support traveler-level and
trip-level use:

- Traveler-level examples: one member's passport, one member's visa.
- Trip-level examples: group insurance policy, shared transport pass purchase.

Use `travelerIds` for affected members and `ownerMemberId` for private or
member-owned documents.

## Relations

Relations are normalized ids from `BookingDoc` to other trip objects:

- `relatedItineraryItemIds`: stop, travel row, hotel stay, or activity tied to
  the booking.
- `relatedTaskIds`: prep or booking todos such as "Add passport number" or
  "Confirm hotel guest names".
- `relatedExpenseIds`: one or more deposits, balance payments, refunds, or
  settlement records.
- `noteIds`: existing notes when available.
- `notes`: short inline note fallback until the note model is expanded beyond
  stop notes.

UX should be bidirectional. Opening an itinerary row, task, or expense can show
linked bookings. Data should stay single-sourced by querying relations rather
than copying booking details into every related object.

## Page Layout

Desktop layout:

- Reuse the existing app shell and `PageHeader` pattern.
- Add `Bookings & Docs` to the left rail between `Timeline` and `Expenses`.
- Summary strip:
  - total booking cost
  - upcoming booking/document date
  - items needing action
  - sensitive docs readiness
- Filter/search bar:
  - search title, provider, confirmation code, linked stop, member
  - type filter
  - status filter
  - traveler filter
  - date/day filter
- Main ledger:
  - type
  - title/provider
  - time or due date
  - travelers
  - linked context
  - cost
  - status
  - actions
- Right inspector:
  - external links
  - confirmation/provider fields
  - sensitive visibility marker
  - linked itinerary, todos, notes, and expenses
  - quick actions such as copy confirmation, open link, add todo, link expense

Tablet/mobile layout:

- The page itself must not horizontally scroll.
- Use compact row cards when the ledger cannot compress cleanly.
- Inspector content stacks under the selected item or opens as a focused
  detail surface.
- External link and confirmation actions remain visible without requiring a
  desktop-only rail.

## Interaction

Create/edit booking:

- Use a task dialog for full create/edit because the form crosses metadata,
  links, travelers, and relations.
- Use inline row actions only for quick status changes and opening links.
- The external URL field must be a URL only. Do not upload, proxy, embed, or
  fetch the remote file.

Status behavior:

- `needs_action` highlights missing required metadata or open related tasks.
- `expired` applies when document expiry or travel date has passed and the item
  is not useful anymore.
- `cancelled` keeps historical context for related refunds or notes.
- `paid` can coexist with linked expenses, but linked expenses are the payment
  evidence.

Relations behavior:

- A booking can link to multiple expenses, because deposits, balances, refunds,
  and currency corrections are common.
- A booking can link to multiple tasks, because one hotel booking may require
  passport names, deposit payment, and cancellation review.
- A booking can link to multiple itinerary items for multi-leg transport or
  multi-night stays.

## Permissions

Use this default visibility rule:

- `owner` and `organizer`: can view shared and sensitive items.
- `traveler`: can view shared items and sensitive items where they are in
  `travelerIds` or are the `ownerMemberId`.
- `viewer`: can view shared items only.
- `private`: visible to the creator or `ownerMemberId`, plus owners if the
  implementation needs owner-level recovery.

Editing should follow capability flags rather than raw role checks where
possible. Add or reuse a capability such as `editBookings` when implementation
begins.

Sensitive records should not expose full confirmation codes or document notes
to roles that cannot view them. Show a locked row state instead of omitting the
row entirely when the existence of the item is useful for trip readiness.

## Data And API Boundary

Local mode:

- Add `bookingDocs` to the `Trip` draft shape.
- Mutations use the existing local commit/history pattern.
- Seed data should include flight, hotel, activity ticket, passport,
  insurance, and one item needing action.

API mode:

- Add future REST endpoints:
  - `POST /trips/:tripId/bookings`
  - `PATCH /trips/:tripId/bookings/:bookingId`
  - `DELETE /trips/:tripId/bookings/:bookingId`
  - `POST /trips/:tripId/bookings/:bookingId/links`
  - `DELETE /trips/:tripId/bookings/:bookingId/links/:linkId`
- Use `expectedVersion` for updates.
- On `version_conflict`, reload the latest cockpit before retrying or merging
  relation changes.

Future WebSocket events:

- `booking.created`
- `booking.updated`
- `booking.deleted`
- `booking.linked`
- `booking.unlinked`

## Components

Likely frontend units:

- `BookingsDocsPage`: page layout, filters, summary, ledger, inspector state.
- `BookingsDocsLedger`: table/row-card rendering.
- `BookingDocInspector`: selected item detail and relation display.
- `BookingDocDialog`: create/edit form.
- `booking-docs.ts`: filtering, summary, visibility, formatting helpers.
- `booking-docs.test.ts`: unit coverage for helper behavior.

Use existing `Button`, `Icon`, `PageHeader`, dialog, table, and i18n patterns.
Do not introduce a separate visual vocabulary for this page.

## Accessibility

- External links need clear labels such as "Open Google Drive voucher".
- Icon-only actions need accessible names and tooltips.
- Sensitive hidden values need text alternatives that explain why they are not
  visible.
- Status must not rely on color alone.
- Keyboard users must be able to open the inspector, create/edit an item, change
  filters, and open external links.
- Mixed Thai/English labels must remain readable with `Noto Sans Thai`.

## Testing And QA

Focused test coverage should include:

- `frontend/src/trip/booking-docs.test.ts` for filtering, summaries, visibility,
  and relation lookups.
- `frontend/src/trip/types.ts` type coverage through compile checks.
- `frontend/src/components/BookingsDocsPage.test.tsx` for filters, ledger,
  inspector, and sensitive visibility.
- `frontend/src/components/SagittariusApp.test.tsx` for route/nav wiring and
  local mutation flow.
- API contract/client tests when backend wiring is added.

Real browser QA is required before shipping the implemented feature:

- desktop ledger and inspector at 1440px
- tablet rail relocation or stacked inspector at 768px/1024px
- mobile row-card layout at 320px
- no page-level horizontal scroll
- external link controls visible and keyboard reachable
- console/page errors checked

## Open Implementation Notes

- If existing `StopNote` cannot represent trip-level notes cleanly, use inline
  `notes` for the first implementation and create a follow-up issue for
  trip-level notes.
- If passport numbers are ever stored, treat them as sensitive metadata and
  consider redaction-by-default in the UI. The first implementation can avoid
  storing full document numbers unless explicitly needed.
