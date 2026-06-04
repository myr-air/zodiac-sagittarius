# Itinerary Activity Paths Design

## Goal

Support itinerary alternatives at activity/day level without forcing every backup
plan to exist across the whole trip. The feature must support two planning modes:

- Day-specific alternatives, such as rain plans, late starts, or closed venues.
- Whole-trip paths, such as Plan 1, Plan 2, family plan, or relaxed plan.

The import flow must ask the user where imported activities should land before
changing itinerary data.

## Current Context

Sagittarius currently stores itinerary rows with `tripId`, `planVariantId`,
`day`, `startTime`, `endTime`, and `sortOrder`. Import currently normalizes a
JSON document and replaces the active plan variant's itinerary rows in the
frontend. Existing plan variants are whole-plan variants, not activity-level
branches.

The new design should not overload the existing import behavior with silent
merge or silent replacement. Import is a decision point because an imported file
can represent the main plan, a backup for one day, or a whole-trip alternative.

## Concepts

### Main Path

`main` is the default path for each day. If no alternative is selected for a day,
the UI shows main activities.

Main is also the fallback for any time slot that has no selected-path
alternative. A partial path does not hide the rest of the day's main plan.

### Named Path

A named path is an organizer-created label such as `Rain plan`, `Slow morning`,
`Plan 1`, or `Plan 2`.

Named paths can be used in two scopes:

- `day`: exists only for one trip day.
- `trip`: can be selected as a whole-trip path, but each day may still fall back
  to main if that path has no activities on that day.

The same path name may appear on multiple days. The UI can group those names for
whole-trip filtering, but the actual alternatives remain day-aware so a rain
plan on Day 2 does not imply rain-plan rows on every day.

### Day Override

A day override picks a path for one day only. It wins over the whole-trip path.

Example:

```text
Trip path: Plan 1

Day 1: Plan 1
Day 2: Rain plan
Day 3: Plan 1
```

Here Day 2 uses `Rain plan`; the rest of the trip follows `Plan 1`, falling back
to main on days where `Plan 1` has no rows.

Overrides are view state. They do not move, merge, replace, or delete itinerary
rows.

## Filtering Rules

The UI has two filter levels:

- Trip path filter: chooses the preferred path for the whole trip.
- Day path filter: overrides one day.

Resolution per day:

1. If the day has an override, use that path for matching time slots where it
   exists.
2. Otherwise use the selected trip path.
3. If the selected path has no activity for a time slot, show main for that time
   slot.
4. `Show all` shows main and all alternatives for inspection.

This allows both practical travel use and planning comparison:

- Practical travel: override only today to `Rain plan`.
- Planning comparison: switch whole trip between `Plan 1` and `Plan 2`.

## Import Rules

Import must ask the user before applying imported activities.

The import dialog should offer:

- `Import to Main`: imported activities become main activities.
- `Import to Existing Path`: user picks a path name and scope.
- `Create New Path`: organizer names a new path and chooses scope.
- `Replace Current Path`: replaces activities in the selected target path only.

Target scope options:

- `This day only`: imported rows apply to a single day/path.
- `Whole trip path`: imported rows keep their days and attach to the selected
  path name across the trip.

When imported activities overlap existing visible activities, the UI must not
auto-push them into `sub A` or `sub B`. It should show a preview and ask the
organizer whether to:

- keep both as alternatives,
- replace the target path rows,
- cancel import.

The labels `sub A`, `sub B`, and so on may be used as generated fallback names,
but organizer-defined names are preferred.

Import apply should operate on a target path and time/day scope, not on the
currently visible filtered view. This prevents a day override from accidentally
changing the wrong path.

## Clear And Delete Rules

Clear must never secretly delete itinerary rows.

- `Clear day override`: removes that day's override and returns to the trip path.
- `Clear all overrides`: removes all day overrides and returns every day to the
  trip path.
- `Show all`: changes only the view.
- `Delete path` or `Delete activities`: deletes data and must ask for
  confirmation with the number of affected activities and path/day scope.

Example confirmation:

```text
Delete 5 activities from Rain plan on Day 2?
```

## Data Model Direction

Add an activity-path layer rather than treating every alternative as a full plan
variant.

Activities that compete for the same time window should share a logical group.
The group lets the UI decide which item to show for a selected path while keeping
unrelated main activities visible.

Suggested frontend/domain shape:

```ts
type ItineraryPathScope = "day" | "trip";

type ItineraryPath = {
  id: string;
  tripId: string;
  name: string;
  scope: ItineraryPathScope;
  day?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type ItineraryItem = {
  // existing fields
  pathGroupId?: string;
  pathId?: string;
  pathRole?: "main" | "alternative";
};
```

The exact database shape can evolve during implementation, but the behavior
must stay day-aware and path-aware.

## API Direction

Keep import normalization separate from applying changes:

- `POST /api/v1/trips/:tripId/itinerary-imports` normalizes file/text/AI input
  and returns a preview document.
- A later apply endpoint should persist the user's chosen target, scope, and
  conflict decision.

Possible apply endpoint:

```text
POST /api/v1/trips/:tripId/itinerary-imports/:importId/applications
```

If imports remain stateless, the apply endpoint can instead receive the preview
document plus the selected target.

## UI Components

The itinerary surface should add:

- Trip path selector near the itinerary header.
- Per-day path selector beside each day group.
- Import preview dialog with target path, scope, conflict summary, and apply
  choices.
- Clear/delete controls with distinct labels and confirmations.

The first implementation can keep the table layout and add compact controls.
The feature does not require a full visual redesign.

## Error Handling

- If AI import cannot confidently map dates/times, mark rows as warnings in the
  preview instead of applying them directly.
- If an import target path is missing or was deleted, ask the user to pick a new
  target.
- If imported rows are outside the trip date range, reject or require explicit
  correction before apply.
- If a delete action would remove path data, always require confirmation.

## Testing

Add pure logic tests for:

- resolving visible rows from trip path plus day overrides,
- fallback from missing path rows to main,
- `Show all` returning main and alternatives,
- import target decisions,
- clear override versus delete behavior.

Add UI tests for:

- switching whole-trip path,
- overriding one day,
- clearing override without deleting rows,
- import preview asking before apply,
- delete confirmation showing count and scope.

Backend tests should cover import normalization and, when added, apply endpoint
authorization plus conflict behavior.

## Out Of Scope

- Automatic AI generation of full plan alternatives.
- Auto-pushing conflicts into generated sub paths without user approval.
- Replacing the existing plan variant system in this design pass.
- Full visual redesign of itinerary, map, or timeline.
