# Storybook UX/UI QA

Sagittarius uses Storybook as the visible QA catalog for the travel planning cockpit. The goal is to keep UI review close to the components that ship: roles, responsive layouts, bilingual labels, itinerary path planning, dense data, empty states, and access-gated routes.

## Local Checks

Run from `frontend/`:

```bash
bun run storybook
bun run test:storybook
bun run build-storybook
```

Use these Storybook viewports for UI review:

- `mobile320`: mobile overflow, sticky table time column, mobile itinerary inspector.
- `tablet768`: collapsed rail and stacked workspace behavior.
- `desktop1024`: constrained desktop cockpit.
- `desktop1440`: full cockpit with table and context space.

## AGY Review

Run from `frontend/` after code or visual changes:

```bash
bun run test:storybook:agy
```

The script builds `storybook-static/` when needed, asks `agy` to review the Storybook UX/UI catalog, and writes the report to `docs/audits/storybook-agy-ux-ui-review.md`.

## Required Coverage

- App routes: public entry, account login/register/portal, trip access, trip subroutes.
- Cockpit shell: owner, Thai, mobile, tablet, desktop.
- Itinerary: owner, viewer, dense, branch graph, Plan A, requested plan, stress paths.
- Component states: buttons, badges, language switch, page header, people panel, suggestion panel.
- Page surfaces: overview, itinerary, timeline, map, members, expenses, photos, landing.

When a new cockpit UI state ships, add a Storybook story and a play assertion before relying on manual browser QA.
