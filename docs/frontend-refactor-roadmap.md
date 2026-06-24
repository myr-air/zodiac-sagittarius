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
- [x] Centralized context rail item surface styles locally
- [x] Moved generic booking document type labels to trip domain
- [x] Audited workspace page composition line bands
- [x] Audited extracted shared component Storybook coverage
- [x] Centralized repeated workspace badge frame styles
- [x] Removed obsolete expense category/split option aliases
- [x] Centralized trip plan status select helpers
- [x] Removed obsolete itinerary display/detail aliases
- [x] Added shared CheckboxGroup Storybook coverage
- [x] Audited feature wrappers for domain semantics
- [x] Added executable test coverage audit contract

## Milestone 1: Shared UI Primitives

Goal: Move repeated, feature-neutral UI patterns into `frontend/src/shared/components` while preserving feature wrappers where they carry domain meaning.

- [x] Extract common icon+text rendering into `shared/components/icon-text`.
- [x] Extract compact workspace panel headings into `shared/components/workspace-panel-heading`.
- [x] Extract shared copy-feedback labels into `shared/components/copy-feedback`.
- [x] Audit remaining repeated button/badge/header patterns in workspace pages.
- [x] Add or update Storybook stories for each new shared component.
- [x] Keep feature wrappers only when they add domain-specific props, labels, or accessibility semantics.

## Milestone 2: Domain Single Source Of Truth

Goal: Keep canonical trip data rules in `frontend/src/trip/**`, with feature code acting as UI adapters.

- [x] Move expense category select options to `trip/expenses`.
- [x] Move member select options to `trip/members`.
- [x] Use booking doc value arrays directly from `trip/booking-docs`.
- [x] Review photo album provider/access options for removable aliases.
- [x] Review member role/status filter values for domain-vs-page ownership.
- [x] Review trip plan, path, and itinerary option builders for duplicated value order.

## Milestone 3: Workspace Feature Structure

Goal: Keep each workspace page split into page composition, components, hooks, model, content, storybook, and tests.

- [x] Expenses page has separated model display helpers and component wrappers.
- [x] Bookings/docs page has separated display, options, folders, and dialog fields.
- [x] Photos page has separated page options, display helpers, and dialog fields.
- [x] Check large page files and split files above the project 400/600-line review bands.
- [x] Move reusable page-level patterns into shared workspace components only when at least two features use them.
- [x] Remove obsolete feature-local aliases after shared/domain helpers exist.

## Milestone 4: Architecture Contracts And Tests

Goal: Keep architectural intent executable so future refactors do not drift back into duplication.

- [x] Update scaffold catalogs when new shared/domain files are added.
- [x] Update architecture contracts when ownership changes are intentional.
- [x] Add focused pure tests for each new domain utility or shared UI helper.
- [x] Prefer feature tests that assert user-visible output over private call order.
- [x] Run full unit tests after contract or shared-module changes.

## Milestone 5: Storybook Alignment

Goal: Storybook should reflect reusable components and important page states after structural changes.

- [x] Added Storybook coverage for `WorkspacePanelHeading`.
- [x] Audit shared component stories for newly extracted or renamed components.
- [x] Add stories for reusable workspace controls that currently only appear inside page stories.
- [x] Run `rtk bun run test:storybook` after story or shared UI changes.

## Atomic Refactor Queue

Use one checklist item per commit unless a test failure proves the item must be split smaller.

- [x] Remove photo provider/access aliases if call sites can import canonical trip photo album values directly.
- [x] Review member role/status filters; keep page-only filters local and use canonical trip invite role values directly.
- [x] Audit `TripExpensesPage.styles.ts`; centralize expense-only overview row shells locally.
- [x] Audit `context-rail.styles.ts`; centralize context-rail-only item surface shells locally.
- [x] Audit bookings/docs option labels; keep localized page copy local and move generic booking type fallback labels to trip domain.
- [x] Audit large page composition files; current workspace pages stay below the 400-line review band.
- [x] Re-run Storybook catalog checks after any shared component move.
- [x] Remove obsolete expense category/split aliases after domain expense helpers exist.
- [x] Move Trip Plan status option order and labels to the trip domain display helpers.
- [x] Remove pass-through itinerary aliases for booking docs, stop detail options, and travel subtypes.
- [x] Add Storybook coverage for the shared `CheckboxGroup` workspace control.
- [x] Add architecture coverage for feature wrappers around shared copy/link primitives.
- [x] Add architecture coverage for pure helper tests and user-visible feature tests.

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
