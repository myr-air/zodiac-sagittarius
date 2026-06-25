# Sagittarius Map

Sagittarius is a group-trip planning cockpit. Use this map as the first project-side routing document before opening detailed specs.

## Start Here

- [AGENTS.md](../AGENTS.md): repository-specific product, frontend, API/state, QA, completion, deployment, and issue-tracking rules.
- [CONTEXT.md](../CONTEXT.md): canonical domain language for Trip Plan, Main Plan, Actual Expense, Journey Block, Activity, Sub-activity, Time Window, and related itinerary terms.
- [docs/COMMANDS.md](./COMMANDS.md): copy-paste command routing with the correct working directory.

## Product And Domain Decisions

- [docs/itinerary-trip-plan-phase-0-1-implementation-spec.md](./itinerary-trip-plan-phase-0-1-implementation-spec.md): Trip Plan compatibility API, DDL draft, exact test matrix, and implementation touchpoints.
- [docs/itinerary-trip-plan-completion-audit.md](./itinerary-trip-plan-completion-audit.md): current requirement-by-requirement completion audit for the requested itinerary redesign end state.
- [docs/adr/](./adr/): architecture decision records for Trip Plan language, Main Plan selection, plan-scoped records, hierarchy/time windows, and compatibility-first rollout.
- [docs/itinerary-json-format.md](./itinerary-json-format.md): import/export file format for itinerary data.
- [docs/api-data-spec.md](./api-data-spec.md): API behavior and data-contract notes.
- [docs/openapi-itinerary-table-v1.yaml](./openapi-itinerary-table-v1.yaml): OpenAPI contract for itinerary-table and Trip Plan surfaces.

## Code Areas

### Frontend

- [frontend/app/](../frontend/app): Next App Router route entrypoints.
- [frontend/src/app/](../frontend/src/app): compatibility exports and app-level Storybook entrypoints.
- [frontend/src/features/](../frontend/src/features): feature-owned UI modules such as itinerary components, stories, domain helpers, and tests.
- [frontend/src/shared/components/](../frontend/src/shared/components): reusable UI building blocks shared across features, such as page headers, date/time pickers, and travel motifs.
- [frontend/src/ui/](../frontend/src/ui): shared primitive UI components, icons, tests, and design-system stories.
- [frontend/src/trip/](../frontend/src/trip): trip domain types, API client/routes, itinerary logic, import/export, and real API e2e tests.
- [frontend/src/account/](../frontend/src/account): account and portal API/client logic.
- [frontend/src/i18n/](../frontend/src/i18n): product copy and labels.
- [frontend/scripts/](../frontend/scripts): local real-system QA and browser/e2e runners.

### Backend

- [backend/crates/sagittarius-api/src/api/](../backend/crates/sagittarius-api/src/api): HTTP route handlers.
- [backend/crates/sagittarius-api/src/app/](../backend/crates/sagittarius-api/src/app): application services and mutation flows.
- [backend/crates/sagittarius-api/src/db/](../backend/crates/sagittarius-api/src/db): database queries and persistence adapters.
- [backend/crates/sagittarius-api/src/domain/](../backend/crates/sagittarius-api/src/domain): DTOs, patches, validation, and capability rules.
- [backend/crates/sagittarius-api/src/realtime/](../backend/crates/sagittarius-api/src/realtime): realtime event payloads and compatibility wrappers.
- [backend/crates/sagittarius-api/src/bin/](../backend/crates/sagittarius-api/src/bin): API server, migrator, and local e2e seeding binaries.
- [backend/migrations/](../backend/migrations): SQL migrations. Current Trip Plan work depends on additive migrations `0025` through `0029`.
- [backend/crates/sagittarius-api/tests/](../backend/crates/sagittarius-api/tests): backend contract tests.

## Common Task Routes

### Itinerary Or Trip Plan Work

Read in this order:

1. [CONTEXT.md](../CONTEXT.md)
2. [docs/itinerary-trip-plan-phase-0-1-implementation-spec.md](./itinerary-trip-plan-phase-0-1-implementation-spec.md)
3. Relevant ADRs in [docs/adr/](./adr/)
4. [docs/api-data-spec.md](./api-data-spec.md) and [docs/openapi-itinerary-table-v1.yaml](./openapi-itinerary-table-v1.yaml) when API shape changes

Likely code areas:

- Frontend: [frontend/src/trip/](../frontend/src/trip), [frontend/src/trip/workspace/sagittarius-app/](../frontend/src/trip/workspace/sagittarius-app), [frontend/src/features/itinerary/components/SmartItineraryTable.tsx](../frontend/src/features/itinerary/components/SmartItineraryTable.tsx)
- Backend: [backend/crates/sagittarius-api/src/api/](../backend/crates/sagittarius-api/src/api), [backend/crates/sagittarius-api/src/app/](../backend/crates/sagittarius-api/src/app), [backend/crates/sagittarius-api/src/domain/](../backend/crates/sagittarius-api/src/domain), [backend/crates/sagittarius-api/src/db/](../backend/crates/sagittarius-api/src/db)
- Database: [backend/migrations/](../backend/migrations)

### Frontend UI Work

Start with [AGENTS.md](../AGENTS.md) frontend conventions. Use existing components, Tailwind utilities, design tokens, and i18n messages first.

Likely files:

- [frontend/src/features/](../frontend/src/features)
- [frontend/src/shared/components/](../frontend/src/shared/components)
- [frontend/src/ui/](../frontend/src/ui)
- [frontend/src/i18n/](../frontend/src/i18n)
- [frontend/src/trip/](../frontend/src/trip)
- [docs/storybook-ux-ui-qa.md](./storybook-ux-ui-qa.md)
- [docs/real-system-feature-qa.md](./real-system-feature-qa.md)

### Backend API Or Database Work

Read API docs and current migration reality before changing code:

- [docs/api-data-spec.md](./api-data-spec.md)
- [docs/openapi-itinerary-table-v1.yaml](./openapi-itinerary-table-v1.yaml)
- [backend/migrations/](../backend/migrations)
- [backend/crates/sagittarius-api/tests/](../backend/crates/sagittarius-api/tests)

### Import, Export, Booking, Expense, Or Plan-scoped Records

Read:

- [docs/itinerary-json-format.md](./itinerary-json-format.md)
- [docs/itinerary-trip-plan-phase-0-1-implementation-spec.md](./itinerary-trip-plan-phase-0-1-implementation-spec.md)
- [docs/adr/0003-plan-scoped-records-and-actual-expenses.md](./adr/0003-plan-scoped-records-and-actual-expenses.md)

Likely tests:

- [frontend/src/trip/itinerary-import-export.test.ts](../frontend/src/trip/itinerary-import-export.test.ts)
- [backend/crates/sagittarius-api/tests/itinerary_import_contract.rs](../backend/crates/sagittarius-api/tests/itinerary_import_contract.rs)

## QA And Release Docs

- [docs/real-system-feature-qa.md](./real-system-feature-qa.md): real-system feature QA expectations.
- [docs/release-verification-workflow.md](./release-verification-workflow.md): pre-merge, post-merge, CI, and production deploy workflow.
- [docs/frontend-refactor-roadmap.md](./frontend-refactor-roadmap.md): milestone checklist for ongoing frontend structure, SSoT, test, and Storybook refactors.
- [docs/test-staging-verification-runbook.md](./test-staging-verification-runbook.md): staging verification flow.
- [docs/production-freeze-checklist.md](./production-freeze-checklist.md): production freeze checks.
- [docs/production-docker-cloudflare.md](./production-docker-cloudflare.md): production Docker and Cloudflare deployment.
- [docs/production-cloudflare-post-deploy.md](./production-cloudflare-post-deploy.md): post-deploy checks.
- [docs/production-readiness-wave-tracker.md](./production-readiness-wave-tracker.md): readiness wave tracking.

## Maintenance Notes

- Keep this map factual and short. Put behavior contracts in specs or ADRs, not here.
- When adding a major code area, command, or spec, update this file and [docs/COMMANDS.md](./COMMANDS.md) together when relevant.
