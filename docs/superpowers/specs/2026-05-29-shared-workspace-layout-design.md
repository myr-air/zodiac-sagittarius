# Shared Workspace Layout Design

## Goal

Make `overview`, `members`, `itinerary`, `map`, and `timeline` feel like one Sagittarius workspace instead of two visual systems.

## Current State

All routes already render through `SagittariusApp`, but the app branches into two outer layouts:

- `overview` and `members` skip `CommandBar` and render their own full-height pages.
- `itinerary`, `map`, and `timeline` render under `CommandBar`, `workspace-grid`, and `planning-main`.

This creates different page chrome, scroll behavior, height rules, and visual hierarchy between the two route groups.

## Approved Direction

Use the existing planning workspace chrome as the shared layout:

- `AppShell`
- `CommandBar`
- `workspace-grid`
- `planning-main`

Every view should sit inside this same outer structure.

## UX Behavior

The side rail remains unchanged.

`CommandBar` appears on every view, but its controls are view-aware:

- `overview`: shows trip title and trip metadata, with planner actions only when they make sense.
- `members`: shows trip title and trip metadata, but hides itinerary-only actions such as add stop, details panel, undo, and redo.
- `itinerary`: keeps the current add stop, details panel, undo, and redo controls.
- `map`: keeps the current map behavior and continues hiding the details panel toggle.
- `timeline`: keeps the current timeline behavior and details panel support.

`overview` and `members` keep their internal content hierarchy, summary cards, filters, and management panels. Only their outer page chrome and scroll container change.

## Component Changes

`SagittariusApp` becomes responsible for rendering a single workspace path:

- Always render `CommandBar` inside `workspace-shell` after join/auth is satisfied.
- Always render a `workspace-grid`.
- Render the active page inside `planning-main`.
- Render `ContextRail` only for views that support it.

`CommandBar` gains view-aware props or equivalent configuration so actions can be hidden without duplicating command bar markup.

## Styling Changes

`overview-page` and `members-page` should no longer own viewport height or independent scroll behavior. They should become content surfaces inside `planning-main`:

- remove `height: 100vh`;
- avoid independent `overflow-y: auto`;
- keep the muted workspace background and page padding;
- use `min-height: 100%` so pages fill the workspace when content is short.

Responsive rules should align with the shared workspace:

- desktop uses sticky `CommandBar` and internal `planning-main` scroll;
- tablet/mobile can keep existing relaxed height behavior where `workspace-grid` becomes auto height;
- no horizontal scroll should be introduced on members or overview.

## Testing

Update or add component tests to prove:

- `overview` renders under the shared command bar.
- `members` renders under the shared command bar.
- itinerary-only controls are not shown on `members`.
- existing itinerary/map/timeline behavior remains intact.

Run the existing unit tests and lint/type checks. Because this changes rendered layout, run a browser smoke check for desktop and mobile across at least `overview`, `members`, and one planning view.

## Out Of Scope

- Redesigning the visual content of overview or members.
- Changing trip auth, participant roles, invite behavior, storage, itinerary editing, map rendering, or timeline data.
- Replacing the side rail navigation.
