# Sagittarius Commands

Use `rtk` for shell commands. Working directory matters: frontend commands run from `frontend/`, backend package tests run from `backend/`, and Makefile targets run from the repository root unless noted.

## Orientation

| Purpose | Working directory | Command |
| --- | --- | --- |
| Show repo state | Repository root | `rtk git status --short --branch` |
| List files fast | Repository root | `rtk rg --files` |
| Find text | Repository root | `rtk rg "pattern" path` |
| Read project map | Repository root | `rtk sed -n '1,220p' docs/MAP.md` |
| Read command map | Repository root | `rtk sed -n '1,220p' docs/COMMANDS.md` |
| Read itinerary completion audit | Repository root | `rtk sed -n '1,240p' docs/itinerary-trip-plan-completion-audit.md` |

## Local Development

| Purpose | Working directory | Command |
| --- | --- | --- |
| Start backend API with local DB init | Repository root | `rtk make backend-dev` |
| Start frontend dev server | Repository root | `rtk make frontend-dev` |
| Initialize development DB | Repository root | `rtk make db-init` |
| Initialize test DB | Repository root | `rtk make db-init-test` |
| Run database migrations | Repository root | `rtk make db-migrate` |
| Run test database migrations | Repository root | `rtk make db-migrate-test` |

## Frontend

| Purpose | Working directory | Command |
| --- | --- | --- |
| Run all unit tests | `frontend/` | `rtk bun run test` |
| Run targeted unit tests | `frontend/` | `rtk bun run test path/to/test.ts` |
| Typecheck | `frontend/` | `rtk bun run typecheck` |
| Lint | `frontend/` | `rtk bun run lint` |
| Build | `frontend/` | `rtk bun run build` |
| Storybook | `frontend/` | `rtk bun run storybook` |
| Storybook tests | `frontend/` | `rtk bun run test:storybook` |
| Full frontend verify | `frontend/` | `rtk bun run verify:frontend` |

## Backend

| Purpose | Working directory | Command |
| --- | --- | --- |
| Run all backend tests | Repository root | `rtk make backend-test` |
| Run package tests directly | `backend/` | `rtk cargo test -p sagittarius-api` |
| Run a backend contract test | `backend/` | `rtk cargo test -p sagittarius-api --test schema_contract -- --nocapture` |
| Compile e2e seed binary | `backend/` | `rtk cargo test -p sagittarius-api --bin seed_e2e --no-run` |
| Run embedded migration guard test | `backend/` | `rtk cargo test -p sagittarius-api embedded_migrations_include_latest_plan_scope_migration` |

## Itinerary And Trip Plan Phase 0/1 Gates

The source of truth is [docs/itinerary-trip-plan-phase-0-1-implementation-spec.md](./itinerary-trip-plan-phase-0-1-implementation-spec.md). These are the current command lanes from that spec.

| Layer | Working directory | Command |
| --- | --- | --- |
| Backend schema/contracts | `backend/` | `rtk cargo test -p sagittarius-api --test schema_contract -- --nocapture` |
| Backend Trip Plan API | `backend/` | `rtk cargo test -p sagittarius-api --test plan_variants_contract -- --nocapture` |
| Backend cockpit/account/join/realtime | `backend/` | `rtk cargo test -p sagittarius-api --test trip_load_contract --test account_trip_contract --test join_session_contract --test realtime_contract -- --nocapture` |
| Backend itinerary import | `backend/` | `rtk cargo test -p sagittarius-api --test itinerary_import_contract -- --nocapture` |
| Backend Plan Check scope | `backend/` | `rtk cargo test -p sagittarius-api --test plan_checks_contract -- --nocapture` |
| API documentation contract | Repository root | `rtk rg "tripPlans|mainTripPlanId|/trip-plans|activePlanVariantId|planVariants|/plan-variants" docs/api-data-spec.md docs/openapi-itinerary-table-v1.yaml` |
| Frontend API mapping/routes/import-export | `frontend/` | `rtk bun run test src/trip/api-client.test.ts src/trip/api-contract.test.ts src/trip/itinerary-import-export.test.ts` |
| Frontend local UI/table copy | `frontend/` | `rtk bun run test src/components/SagittariusApp.test.tsx src/components/SmartItineraryTable.test.tsx src/project-contract.test.ts` |
| Frontend type safety | `frontend/` | `rtk bun run typecheck` |
| Real API e2e compatibility | Repository root | `rtk make frontend-e2e-local` |

## Real-system And Browser QA

| Purpose | Working directory | Command |
| --- | --- | --- |
| Local real API e2e | Repository root | `rtk make frontend-e2e-local` |
| Local auth browser e2e | Repository root | `rtk make frontend-e2e-auth-browser` |
| Itinerary import browser QA | `frontend/` | `rtk bun run test:itinerary-import-browser-qa` |
| Trip Plan selector/set-main browser QA | `frontend/` | `rtk bun run test:trip-plan-browser-qa` |
| Create-trip UX QA | `frontend/` | `rtk bun run test:create-trip-ux-qa` |
| API trace smoke | Repository root | `rtk make api-trace-smoke` |
| Perf smoke | Repository root | `rtk make perf-smoke` |
| Production browser QA script | `frontend/` | `rtk bun run test:production-browser-qa` |
| Storybook UX QA | `frontend/` | `rtk bun run test:storybook:agy` |

## Project-wide Gates

| Purpose | Working directory | Command |
| --- | --- | --- |
| Frontend plus backend verify | Repository root | `rtk make verify` |
| Fast local production readiness | Repository root | `rtk make production-readiness-fast` |
| Full local production readiness | Repository root | `rtk make production-readiness-local` |
| Aries profile gate before strong claims | `/Users/xiivth/.codex/aries` | `rtk python3 scripts/check_all.py` |

## Production And Staging

| Purpose | Working directory | Command |
| --- | --- | --- |
| Production env file check | Repository root | `rtk make production-env-file-check` |
| Release signoff check | Repository root | `rtk make release-signoff-check` |
| Staging preflight | Repository root | `rtk make staging-preflight` |
| Production deploy gate | Repository root | `rtk make production-deploy-gate` |
| Build production containers | Repository root | `rtk make container-production-build` |
| Run production migrations | Repository root | `rtk make container-production-migrate` |
| Check production containers | Repository root | `rtk make container-production-check` |

## Command Notes

- Prefer Makefile targets for workflows that need DB setup, API startup, or coordinated frontend/backend steps.
- Use direct `backend/` cargo commands for focused backend contract work.
- Use direct `frontend/` bun commands for focused UI, mapper, and typecheck work.
- Some real-system targets need local PostgreSQL and open ports. If sandboxing blocks those resources, rerun the same command with the required approval path instead of changing the test scope.
- Before reporting broad completion, match the claim to fresh command evidence and run the Aries claim gate from `/Users/xiivth/.codex/aries` when making strong claims.
