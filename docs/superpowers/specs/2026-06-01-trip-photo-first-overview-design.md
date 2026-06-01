# Trip Photo-First Overview Design

Date: 2026-06-01
Status: Approved direction, pending implementation plan

## Goal

Redesign `/trips/<id>` into a travel cockpit with a photo-first overview. The page should make the destination and upcoming plan feel immediate, while preserving the existing workspace power features: itinerary editing, map, timeline, members, expenses, suggestions, and role-aware permissions.

## Research Inputs

- getdesign.md Airbnb: travel marketplace patterns with warm coral accents, photography-driven layout, and rounded UI.
- getdesign.md Pinterest: visual discovery patterns with image-first masonry grids and a strong red accent.
- getdesign.md Notion and Airtable: workspace patterns for soft surfaces, structured data, and calm productivity.
- Pinterest travel planner references: dashboard/map compositions, photo-led itinerary screens, and mobile travel detail views.
- Travel Dynamo, Triply, and WanderPlan references: trip planning products should keep day-wise itinerary, map, budget, tasks, collaboration, and bookings discoverable without making the overview feel like a spreadsheet.

## Product Direction

Use a "travel cockpit, photo-first overview" model:

- The first screen should answer: Where are we going, when, who is coming, and what is next?
- The overview should feel more like a trip home than an admin dashboard.
- Itinerary/table surfaces should stay compact and legible for editing.
- The existing side navigation remains the persistent shell.
- The existing context rail remains the detail inspector, but should visually integrate with the new cockpit.

## Visual System

The redesign should combine:

- Airbnb-inspired destination hero: large scenic surface, warm accent, trip identity, date range, destination, member count, and current role.
- Pinterest-inspired highlight board: image-forward cards for food, attractions, shopping, and key trip moments.
- Workspace clarity from Notion/Airtable: soft panels, clear grouping, readable labels, and structured status cards.

The palette should avoid becoming one-note. Use warm travel accents sparingly over neutral surfaces, with secondary status colors for budget, warnings, tasks, and suggestions.

## Page Structure

### App Shell

Keep `AppShell` as the route-level frame:

- Existing sidebar navigation stays.
- Collapsed state remains.
- Language switch, member card, and expense shortcut remain.
- Sidebar styling can be softened to fit the new overview, but navigation behavior should not change.

### Overview Hero

Replace the current generic `PageHeader` feel on overview with a destination-first hero:

- Large photo or generated scenic treatment.
- Trip name and destination are primary.
- Date range, active members, itinerary count, and budget summary appear as compact metadata.
- Current user/role appears as a small identity chip.
- Hero must remain useful without a real remote image, using a deterministic destination visual fallback.

### Cockpit Cards

Below the hero, show a cockpit grid:

- Next stop card: activity, time, place, transport/note, and quick access to details.
- Trip readiness cards: open tasks, pending suggestions, warnings, and settlement count.
- Budget card: group spend and current user's net label.
- Member card: active members and role lens.

Cards should be operational, not decorative. Existing expense open actions and task toggles must continue to work.

### Highlight Board

Add a visual board for trip highlights:

- Use existing itinerary data to group food, attractions, shopping, and experiences.
- Cards include activity, day/time, place, and a destination-inspired visual.
- Masonry-like rhythm is acceptable, but layout must remain stable and readable on mobile.
- Do not add fake runtime copy that is unrelated to the selected trip.

### Itinerary, Map, Timeline, Members

Do not redesign every workspace view at once. Keep these views structurally intact, with small styling alignment only where needed:

- `SmartItineraryTable` remains the editing surface.
- `RouteMapView` remains map-focused.
- `TimelineView` remains chronological.
- `TripMembersPage` remains permission/member-focused.

The implementation should avoid duplicating route markup. Storybook stories should use the same extracted components as production.

## Data And Behavior

Use existing trip state:

- `trip.name`, `destinationLabel`, `startDate`, `endDate`, members, itinerary items, expenses, suggestions, tasks.
- Role lens remains manager/traveler/viewer.
- Existing permission gates remain intact.
- API mode and demo mode should render the same visual structure.

No new backend API is required for the initial redesign.

## Components

Expected component changes:

- Extract an overview hero component from `OverviewPage`.
- Extract reusable cockpit cards where they reduce duplication between manager/traveler/viewer lenses.
- Keep existing task dialog and undo toast behavior.
- Update or add Storybook coverage for the new overview surface before wiring route behavior.

## Accessibility And Responsive Rules

- Hero text must have sufficient contrast over imagery.
- All image-like cards need meaningful text labels from trip data.
- Interactive cards must have clear hover and focus states.
- Mobile layout should show hero, next stop, readiness, and highlights in a single readable column.
- No button text should overflow its container.
- Avoid layout shift on hover.

## Testing And QA

Minimum verification before completion:

- Storybook story for the overview redesign.
- Component tests for role-lens critical rendering if logic changes.
- Existing route tests should continue passing.
- Browser check of `/trips/<id>` in desktop and mobile viewport.
- Real System Feature QA applies before claiming done because this changes a frontend URL route and user-facing workflow.

## Non-Goals

- No new backend API.
- No new trip image upload flow.
- No complete redesign of itinerary/map/timeline/members in this pass.
- No AI itinerary generation changes.
- No change to auth, account session, or trip membership permissions.

## Open Decisions

The initial implementation should use deterministic local visual treatments rather than adding external image dependencies. A later pass can add user-uploaded or destination-sourced cover images if the product needs them.
