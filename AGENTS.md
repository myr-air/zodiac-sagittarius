# Sagittarius Project Instructions

This file contains repository-specific guidance only. Global Codex workflow,
debugging, command, QA, and communication rules are defined outside this repo.

## Product Context

Sagittarius is a travel planning cockpit for group trips. The core user
experience is an operational workspace, not a marketing site. Prefer calm,
scan-friendly, work-focused UI that helps organizers compare plans, edit
itinerary details, track members, and resolve trip decisions quickly.

The itinerary domain supports activity-level path planning:

- `main` is the default path.
- Overlapping activities can be assigned to generated day plans such as
  `Plan A`, `Plan B`, etc.
- Day-level filtering and trip-level filtering are separate concerns.
- Import/export and automatic overlap resolution must preserve the itinerary
  path model instead of flattening activities back into one list.

## Frontend Conventions

Use existing Tailwind utilities, component classes, design tokens, and Storybook
patterns first. Add custom CSS only after checking that the current
Tailwind/design-system vocabulary cannot express the behavior clearly.

For Tailwind utilities whose value is a simple CSS variable token, prefer the
canonical shorthand form, such as `text-(--color-text-muted)`,
`bg-(--color-surface)`, `border-(--color-border)`, and
`rounded-(--radius-md)`. Keep bracketed arbitrary values for expressions that
are not a single token, such as `rgb(...)`, `color-mix(...)`, gradients,
fallback vars, shadows, and arbitrary properties.

Keep cockpit surfaces dense but readable. Avoid landing-page patterns inside the
workspace: oversized hero composition, decorative card stacks, gradient-only
sections, or explanatory in-app marketing copy.

When adding controls:

- Use existing `Button`, `Icon`, i18n messages, and table/dialog patterns.
- Keep table and toolbar controls stable across desktop and mobile.
- Check that context rail, table scroll, and mobile viewport behavior do not
  block itinerary toolbar actions.

## API And State

The app can run in local mode and API mode. Any itinerary mutation that changes
activity paths should handle both:

- Local mode: update the trip draft through the local commit/history flow.
- API mode: patch backend items with current `expectedVersion` values and handle
  `version_conflict` by reloading the latest cockpit before retrying or
  recomputing local placement.

Do not assume generated path fields are cosmetic. `pathGroupId`, `pathId`,
`pathName`, and `pathRole` are part of the data contract and must stay in sync
between UI, import/export, API patches, and tests.

## Tests And QA

For itinerary/path changes, prefer focused coverage in:

- `frontend/src/trip/itinerary-paths.test.ts`
- `frontend/src/trip/itinerary.test.ts`
- `frontend/src/components/SmartItineraryTable.test.tsx`
- `frontend/src/components/SagittariusApp.test.tsx` when API/local app wiring is
  involved

When a user-facing feature touches the itinerary table, verify at least one real
browser flow for the visible control, context rail interaction, console/page
errors, and mobile overflow.

## Issue Tracking

If you find project issues that are not fixed in the current turn, record them
in `issues.md` with date found, evidence, impact, and a suggested fix path.
When fixed, update the same entry with the fix summary and verification
evidence.
