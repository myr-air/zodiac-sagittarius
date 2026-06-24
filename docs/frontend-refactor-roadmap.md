# Frontend Refactor Roadmap

## Intent

Refactor the frontend structure incrementally so shared UI, domain rules, option builders, copy helpers, and feature-specific code live in the right ownership layer. Each slice should keep behavior stable, update tests and Storybook when affected, and finish with a verified commit.

## Current Progress

- [x] Shared page header date metadata: `0cbaa23bd`
- [x] Shared icon text primitive: `b8fac09f6`
- [x] Shared people panel role labels: `7704bbbed`
- [x] People panel roles sourced from i18n: `958841380`
- [x] Centralized external link props: `42f441d90`
- [x] Shared all-filter select options: `9359c8fb7`
- [x] Shared common copy feedback labels: `2053733de`
- [x] Shared workspace panel headings: `48d57b681`
- [x] Centralized expense category options: `b3d972c6d`
- [x] Centralized member select options: `ff524eff5`
- [x] Removed duplicate booking option aliases: `d730743ed`
- [x] Reviewed member filter ownership and removed invite role alias
- [x] Centralized expense overview row styles locally

## Milestone 1: Shared UI Primitives

Goal: Move repeated, feature-neutral UI patterns into `frontend/src/shared/components` while preserving feature wrappers where they carry domain meaning.

- [x] Extract common icon+text rendering into `shared/components/icon-text`.
- [x] Extract compact workspace panel headings into `shared/components/workspace-panel-heading`.
- [x] Extract shared copy-feedback labels into `shared/components/copy-feedback`.
- [ ] Audit remaining repeated button/badge/header patterns in workspace pages.
- [ ] Add or update Storybook stories for each new shared component.
- [ ] Keep feature wrappers only when they add domain-specific props, labels, or accessibility semantics.

## Milestone 2: Domain Single Source Of Truth

Goal: Keep canonical trip data rules in `frontend/src/trip/**`, with feature code acting as UI adapters.

- [x] Move expense category select options to `trip/expenses`.
- [x] Move member select options to `trip/members`.
- [x] Use booking doc value arrays directly from `trip/booking-docs`.
- [ ] Review photo album provider/access options for removable aliases.
- [x] Review member role/status filter values for domain-vs-page ownership.
- [ ] Review trip plan, path, and itinerary option builders for duplicated value order.

## Milestone 3: Workspace Feature Structure

Goal: Keep each workspace page split into page composition, components, hooks, model, content, storybook, and tests.

- [x] Expenses page has separated model display helpers and component wrappers.
- [x] Bookings/docs page has separated display, options, folders, and dialog fields.
- [x] Photos page has separated page options, display helpers, and dialog fields.
- [ ] Check large page files and split files above the project 400/600-line review bands.
- [ ] Move reusable page-level patterns into shared workspace components only when at least two features use them.
- [ ] Remove obsolete feature-local aliases after shared/domain helpers exist.

## Milestone 4: Architecture Contracts And Tests

Goal: Keep architectural intent executable so future refactors do not drift back into duplication.

- [x] Update scaffold catalogs when new shared/domain files are added.
- [x] Update architecture contracts when ownership changes are intentional.
- [ ] Add focused pure tests for each new domain utility or shared UI helper.
- [ ] Prefer feature tests that assert user-visible output over private call order.
- [ ] Run full unit tests after contract or shared-module changes.

## Milestone 5: Storybook Alignment

Goal: Storybook should reflect reusable components and important page states after structural changes.

- [x] Added Storybook coverage for `WorkspacePanelHeading`.
- [ ] Audit shared component stories for newly extracted or renamed components.
- [ ] Add stories for reusable workspace controls that currently only appear inside page stories.
- [ ] Run `rtk bun run test:storybook` after story or shared UI changes.

## Atomic Refactor Queue

Use one checklist item per commit unless a test failure proves the item must be split smaller.

- [x] Remove photo provider/access aliases if call sites can import canonical trip photo album values directly.
- [x] Review member role/status filters; keep page-only filters local and use canonical trip invite role values directly.
- [x] Audit `TripExpensesPage.styles.ts`; centralize expense-only overview row shells locally.
- [ ] Audit `context-rail.styles.ts` for repeated note/expense/suggestion row styles that can become local style groups or shared primitives.
- [ ] Audit bookings/docs option labels and itinerary booking labels for possible shared formatting without mixing page copy into trip domain.
- [ ] Audit large page composition files and split only where behavior boundaries are clear.
- [ ] Re-run Storybook catalog checks after any shared component move.

## Draft Acceptance Criteria

- Given a repeated helper exists in two or more feature areas, when it is feature-neutral or domain-owned, then one canonical helper exists in `shared` or `trip` and all callers use it.
- Given a helper needs page copy or UI-specific labels, when refactored, then it remains in the feature model as an adapter over canonical domain values.
- Given a shared component is extracted, when it has visual or interaction states, then it has focused tests and Storybook coverage.
- Given a domain helper is extracted, when it is used by features, then focused tests cover its stable ordering and output shape.
- Given a scaffold or architecture contract references moved ownership, when the refactor lands, then the contract reflects the new intended boundary.
- Given a refactor slice is complete, when verification runs, then focused tests, typecheck, lint, diff check, and relevant broader tests pass.

## Verification Gates

Run the smallest useful gate first, then broaden based on touched files.

- Focused unit tests for changed files.
- `rtk bun run typecheck`
- `rtk bun run lint`
- `rtk git diff --check`
- `rtk bun run test` after shared/domain/contract changes.
- `rtk bun run test:storybook` after shared UI or Storybook changes.

## Progress Rule

Update this roadmap when a milestone item is completed, added, split, or intentionally deferred. Each completed implementation slice should end in a commit with the relevant verification evidence recorded in the final report.
