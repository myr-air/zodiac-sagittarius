# Trip Sheets Design

## Goal

Add named planner sheets inside one trip without confusing them with activity
paths. A Trip Sheet is a full-trip planning workspace. Each sheet has its own
itinerary rows, and those rows continue to support the existing activity path
model: `main`, generated alternatives such as `Plan A`, and named paths such as
`Rain plan`.

## Naming Decision

Use **Trip Sheet** for the user-facing whole-trip planner container.

Do not use `Plan` for this feature in visible copy. The product already uses
plan-like language for activity-level path choices, and the code already has
`PlanVariant` as the persistence model. Trip Sheet gives organizers a familiar
spreadsheet/tab metaphor while keeping activity paths distinct.

## Architecture

Reuse the existing `planVariants` domain model as the data source for Trip
Sheets.

`planVariants` already represent whole-trip itinerary containers:

- `Trip.activePlanVariantId` selects the active whole-trip container.
- `ItineraryItem.planVariantId` assigns each activity to one container.
- Activity paths remain item-level fields: `pathGroupId`, `pathId`, `pathName`,
  and `pathRole`.

This avoids a new database table, keeps API mode aligned with existing backend
routes, and lets the first implementation focus on a usable sheet selector and
create flow.

## Product Behavior

The itinerary workspace shows the current Trip Sheet near the itinerary toolbar.
Organizers can create a new named Trip Sheet. Switching sheets changes the active
whole-trip itinerary container and updates the visible rows.

Creating a sheet does not copy rows by default. A new sheet starts empty so the
organizer can build a separate version of the trip. Existing import and activity
creation flows should target the currently active sheet.

Activity path controls stay nested inside the selected Trip Sheet. A row moved
to `Plan A` or `Rain plan` remains an activity alternative inside that sheet; it
does not create or switch Trip Sheets.

## Local Mode

Local mode updates the trip draft through the existing local commit/history
flow:

- create a new `PlanVariant` with a generated id, name, kind, description, and
  version;
- set `activePlanVariantId` to the new sheet id;
- leave existing itinerary rows unchanged.

## API Mode

API mode uses existing backend behavior:

- create the sheet through the plan-variant create endpoint;
- publish the created variant so the trip active sheet changes;
- reload or merge the returned active trip state using existing cockpit state
  patterns.

Version conflicts use the existing API error handling pattern for trip and plan
variant mutations.

## UI

Add a compact Trip Sheet selector to the itinerary toolbar area. It should be
visually separate from activity-path inspection filters and day path controls.

Expected controls:

- a select/menu for existing Trip Sheets;
- a small create action;
- a simple name prompt or inline input for the new sheet name.

Visible copy should use `Trip Sheet`, `New sheet`, or `Sheet name`. Avoid using
`Plan` for this UI.

## Non-Goals

- Do not rename internal `PlanVariant` types or database tables in this pass.
- Do not add a new `trip_sheets` table.
- Do not duplicate or clone itinerary rows into a new sheet by default.
- Do not change activity path resolution, import path fields, or generated
  activity plan names.
- Do not redesign the itinerary table.

## Acceptance Criteria

- A user can see the current Trip Sheet name in the itinerary workspace.
- An organizer can create a named Trip Sheet inside the same trip.
- Creating a sheet switches the trip to that sheet.
- Switching sheets changes the active itinerary container.
- New itinerary activities still receive the current sheet id as
  `planVariantId`.
- Activity path fields are preserved when creating, editing, importing, moving,
  or resolving activities.
- Local mode and API mode both support create and switch.
- Focused tests cover sheet creation, sheet switching, and activity path
  preservation.

## Verification

Focused checks:

- `bun test src/trip/itinerary.test.ts src/trip/itinerary-paths.test.ts`
- `bun test src/trip/api-client.test.ts`
- `bun test src/components/SmartItineraryTable.test.tsx`
- `bun test src/components/SagittariusApp.test.tsx`

If the UI changes are visible, run one browser flow for desktop and mobile to
verify the selector, create action, console errors, and overflow behavior.
