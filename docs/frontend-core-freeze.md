# Frontend Core Freeze

Status: frozen for backend integration.

The Sagittarius frontend core is now integration-ready. The current UI, design
system, Storybook catalog, fixture-backed states, and page shell should be
treated as the stable baseline while backend work begins.

## Frozen Surface

- App shell, navigation, page routes, and responsive workspace layout.
- Design tokens, watercolor-paper visual treatment, motifs, and shared page
  header language.
- Storybook taxonomy: `Design System/*`, `Templates/*`, `Pages/*`, and the
  fixture-backed `Sagittarius/App` stories.
- Fixture module shape in `src/trip/fixtures.ts`, used by app seed state,
  tests, and Storybook.
- Core role surfaces for owner, traveler, viewer, empty, dense, and mobile
  states.

## Allowed Changes During Backend Integration

- API client wiring, request state, mutation state, optimistic updates, and
  backend error handling.
- MSW handlers that mirror real backend contracts for Storybook and browser
  tests.
- Loading, empty, permission-denied, offline, stale-data, and conflict states
  required by real API behavior.
- Accessibility, responsive, and bug fixes that preserve the current page and
  component boundaries.
- Small copy adjustments when backend terminology becomes exact.

## Deferred Until After Backend Slice

- New top-level frontend pages or major page re-layouts.
- New visual themes, large palette changes, or illustration systems outside
  the current watercolor-paper treatment.
- New client-only planning features that are not driven by a backend contract.
- Replacing the Storybook taxonomy without first updating the contract tests.

## Frontend Freeze Gate

Run this command before backend integration branches merge frontend-touching
changes:

```bash
rtk bun run verify:frontend
```

The command expands to:

- `rtk bun run lint`
- `rtk bun run typecheck`
- `rtk bun run test`
- `rtk bun run test:storybook`
- `rtk bun run build`
- `rtk bun run build-storybook`

For visual or layout changes, also run rendered smoke against the relevant app
routes and Storybook stories. Storybook should remain the template source of
truth for component and page states.

## Backend Handoff Notes

- `docs/api-data-spec.md` is the current frontend contract draft for Rust and
  PostgreSQL backend design.
- Keep fixtures deterministic until API-backed state replaces each slice.
- Move mocks into `.storybook/msw-handlers.ts` as backend endpoints become
  real; avoid broad catch-all handlers.
- Prefer vertical slices over more frontend-only polish: join/session, trip
  load, itinerary mutation, suggestions/tasks, and permissions are the first
  integration path.
