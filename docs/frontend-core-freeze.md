# Frontend Core Freeze

**Status: frozen for backend integration.**

The frontend UI surface is frozen to stabilize the backend integration phase. Changes are limited to bug fixes, backend-driven adjustments, and critical accessibility fixes.

## Frozen Surface

The following areas are frozen and should not receive new frontend-only changes:

- Workspace layout and navigation structure
- Itinerary table core interactions and data model
- Trip Plan creation and management flows
- Context rail and inspector panels
- Activity path graph visualization
- Mobile viewport layouts (Phase 4 scope)

## Allowed Changes During Backend Integration

Changes are permitted when:

- Driven by a backend API contract or data model requirement
- Fixing a critical bug that blocks production use
- Addressing accessibility violations (WCAG 2.1 AA)
- Adjusting copy or labels to match backend terminology (see `docs/api-data-spec.md`)

All changes must pass `rtk make frontend-verify` before merge.

## Deferred Until After Backend Slice

The following work is deferred until the backend integration is complete:

- New top-level frontend pages or major page re-layouts unrelated to the backend contract
- New client-only planning features that are not driven by a backend contract.
- Visual design exploration or theme changes
- Performance optimization beyond critical path fixes

Prefer vertical slices over more frontend-only polish during this phase.

## Verification

Run the full frontend verification suite:

```bash
rtk make frontend-verify
```

This executes lint, typecheck, unit tests, Storybook tests, and production build.
