# Itinerary Trip Plan Completion Audit

This audit tracks progress toward the requested end state for the itinerary
redesign. It is not a release sign-off by itself. A row is `Proved` only when
the current repository has direct code, documentation, and command evidence for
the stated scope.

Last audited on 2026-06-14 from branch `codex/itinerary-hierarchy-docs`.

## Requirement Ledger

| ID | Requirement | Current status | Evidence | Remaining work |
| --- | --- | --- | --- | --- |
| `REQ-DOC-01` | Project routing must have `docs/MAP.md` and `docs/COMMANDS.md` so agents do not infer Sagittarius routing from scattered specs. | Proved | `docs/MAP.md`; `docs/COMMANDS.md`; `rtk ls docs` shows both files. | Keep both updated when adding major routes, commands, or specs. |
| `REQ-LANG-01` | Product language uses Trip Plan, Main Plan, Plan Status, Actual Expense, Activity Block, Sub-activity, and Time Window consistently. | Proved for Phase 0/1 | `CONTEXT.md`; ADRs `0001` through `0006`; `frontend/src/project-contract.test.ts`; command evidence from frontend UI/table/copy lane. | Continue guarding legacy docs under `docs/superpowers/` as historical-only references. |
| `REQ-PLAN-01` | A trip can have multiple named Trip Plans for real use, drafts, backups, or proposals. | Proved for Phase 1 compatibility | `docs/itinerary-trip-plan-phase-0-1-implementation-spec.md`; backend `plan_variants_contract.rs`; frontend `SagittariusApp.test.tsx` and `SmartItineraryTable.test.tsx`; real API e2e. | Phase 2/3 can add richer copy/import plan creation modes after explicit ADR/spec update. |
| `REQ-PLAN-02` | Any Trip Plan can be selected as the Main Plan, and Main Plan selection is separate from the plan currently being edited/viewed. | Proved for Phase 1 compatibility | Backend set-main contract; frontend selector/set-main tests; real API e2e; API docs and OpenAPI routes. | Browser smoke for the complete Trip Plan selector + set-main flow should be rerun before broad UX sign-off. |
| `REQ-PLAN-03` | Plans may have different dates, transport, tickets, and records; data should be plan-scoped instead of globally mixed. | Proved for current Phase 2 service scope | DDL `0026`; schema contract; backend `expenses_contract.rs`, `tasks_contract.rs`, `stop_notes_contract.rs`, and `bookings_contract.rs`; frontend API/app tests; set-main no-record-move tests. | Dedicated organizer audit UX for inferred compatibility scopes remains future work. |
| `REQ-EXP-01` | Actual Expenses are real money and must not automatically move to a new plan. | Proved for scope, summary, reminders, explicit API move of unlinked expenses, organizer-selected UI move of unlinked expenses, cancel/refund UI flows, duplicate-as-estimate UI flow, and no automatic Main Plan moves | `CONTEXT.md`; ADR `0003`; `expenses_contract.rs`; `plan_variants_contract.rs` set-main record-stability assertions; frontend API/app tests; expense copy clarified in UI/docs. | Browser QA remains before broad UX sign-off. |
| `REQ-HIER-01` | Itinerary shape is Plan Day -> Activity -> Sub-activity, with one sub-activity level and Activity Blocks for grouped journeys. | Partly proved | ADR `0004`; DDL `0027`; backend create/patch hierarchy contracts; frontend itinerary ordering and hierarchy tests; Storybook `HierarchyBlocks`. | Full Phase 3 service/UI sign-off still needs complete browser QA and policy coverage for all move/reparent sequences. |
| `REQ-HIER-02` | Sibling overlaps and child-outside-parent are warnings, not automatic Alternative Paths or automatic fixes. | Proved for current frontend behavior | `frontend/src/trip/itinerary.test.ts`; `SmartItineraryTable.test.tsx`; `ItineraryTemplate.stories.tsx` hierarchy warning story. | Backend import/create/patch policy should remain aligned as Phase 3 hardens hierarchy behavior. |
| `REQ-HIER-03` | When the system catches a hierarchy issue, the user chooses the correction. | Proved for current table UI | `SmartItineraryTable.tsx` row fix menu; `SmartItineraryTable.test.tsx`; `ItineraryTemplate.stories.tsx`; commit `f50ec9ff`. | Re-run Storybook/browser smoke before final UX sign-off. |
| `REQ-TIME-01` | Users enter start and optional end time; duration is derived/displayed, not the main input. | Proved for frontend table/dialog | `StopDialog.tsx`; `SmartItineraryTable.tsx`; `StopDialog.test.tsx`; `SmartItineraryTable.test.tsx`. | Backend raw drift hardening for all read paths remains part of Phase 3 guard coverage. |
| `REQ-TIME-02` | End time can be omitted and can cross days; next-day endings show `+1` after the end time. | Proved for frontend display and contracts | `itineraryDisplay.test.ts`; `StopDialog.test.tsx`; `SmartItineraryTable.test.tsx`; DDL `0027` with `end_offset_days`. | Browser visual QA should be rerun for the superscript-like display before broad UX sign-off. |
| `REQ-JOURNEY-01` | A flight/train/etc. can be modeled as a broader journey block with ticketed segment and buffer steps as sub-activities. | Proved for frontend modeling and booking-template quick-create | `CONTEXT.md` Journey Block/Ticketed Segment language; Storybook `HierarchyBlocks`; hierarchy/time UI; itinerary booking template tests. | Browser QA and backend policy hardening remain before broad Phase 3 sign-off. |
| `REQ-INLINE-01` | Itinerary page is the primary planning surface with inline edits and optional details hidden behind quick controls. | Partly proved; itinerary-first booking template quick-create is covered | `SmartItineraryTable.tsx` inline fields; `StopDialog.tsx`; itinerary booking template menu; current component tests. | Full browser QA and any deeper paid/committed booking lifecycle workflows remain separate Phase 3 slices. |
| `REQ-API-01` | Phase 1 API adds canonical Trip Plan aliases and routes while retaining legacy compatibility aliases and routes. | Proved | Backend contract lanes, frontend mapper lanes, docs/OpenAPI grep, real API e2e. | None for Phase 1 compatibility; storage rename remains explicitly out of scope. |
| `REQ-DB-01` | Migration DDL draft matches additive migrations `0025` through `0029`, and DB limits are documented. | Proved for documented migration contract | `docs/itinerary-trip-plan-phase-0-1-implementation-spec.md`; backend `schema_contract.rs`; schema test lane. | Future DB hardening needs new ADR/spec before changing already-shipped migration intent. |
| `REQ-IMPORT-01` | Import/export preserves Trip Plan aliases, selected destination plan, hierarchy/time/path fields, and does not switch Main Plan. | Proved for Phase 1 compatibility | `itinerary-import-export.test.ts`; `itinerary_import_contract.rs`; import target tests; frontend mapper lane. | Full copy/import creation modes and record clone/reference/reject policy are later-phase work. |

## Fresh Command Evidence

These commands were run from the current worktree during the audit continuation:

| Layer | Command | Result |
| --- | --- | --- |
| Frontend API mapping/routes/import-export | `rtk bun run test src/trip/api-client.test.ts src/trip/api-contract.test.ts src/trip/itinerary-import-export.test.ts` | Passed: 3 files, 58 tests. |
| Frontend local UI/table/copy | `rtk bun run test src/components/SagittariusApp.test.tsx src/components/SmartItineraryTable.test.tsx src/project-contract.test.ts` | Passed: 3 files, 208 tests. |
| Backend schema/contracts | `rtk cargo test -p sagittarius-api --test schema_contract -- --nocapture` | Passed: 16 tests. |
| Backend Trip Plan API | `rtk cargo test -p sagittarius-api --test plan_variants_contract -- --nocapture` | Passed: 12 tests. |
| Backend cockpit/account/join/realtime | `rtk cargo test -p sagittarius-api --test trip_load_contract --test account_trip_contract --test join_session_contract --test realtime_contract -- --nocapture` | Passed: 56 tests. |
| Backend itinerary import | `rtk cargo test -p sagittarius-api --test itinerary_import_contract -- --nocapture` | Passed: 7 tests. |
| Backend Plan Check scope | `rtk cargo test -p sagittarius-api --test plan_checks_contract -- --nocapture` | Passed: 4 tests. |
| Backend route and permissions contracts | `rtk cargo test -p sagittarius-api --test route_contract -- --nocapture`; `rtk cargo test -p sagittarius-api --test permissions_contract -- --nocapture` | Passed: 6 tests total. |
| API docs contract | `rtk rg "tripPlans|mainTripPlanId|/trip-plans|activePlanVariantId|planVariants|/plan-variants" docs/api-data-spec.md docs/openapi-itinerary-table-v1.yaml` | Found canonical and legacy docs/OpenAPI entries. |
| Real API compatibility | `rtk make frontend-e2e-local` | Passed: 2 e2e tests. |
| Frontend type safety | `rtk bun run typecheck` | Passed. |
| Aries global profile | `rtk python3 ~/.codex/aries/scripts/check_global.py` | Passed. |
| Backend Phase 2 expenses | `rtk cargo test -p sagittarius-api --test expenses_contract -- --nocapture` | Passed: 8 tests. |
| Backend Phase 2 records | `rtk cargo test -p sagittarius-api --test tasks_contract --test stop_notes_contract --test bookings_contract -- --nocapture` | Passed: 25 tests. |
| Frontend Phase 2 API/app scope | `rtk bun run test src/trip/api-client.test.ts src/components/SagittariusApp.test.tsx` | Passed: 2 files, 161 tests. |
| Backend explicit Actual Expense move | `rtk cargo test -p sagittarius-api --test expenses_contract -- --nocapture` | Passed: 10 tests, including explicit unlinked expense move and linked-item conflict rejection. |
| Frontend explicit Actual Expense move request | `rtk bun run test src/trip/api-client.test.ts` | Passed: 1 file, 37 tests. |
| Frontend Actual Expense plan correction UI | `rtk bun run test src/components/TripExpensesPage.test.tsx` | Passed: 1 file, 17 tests, including Trip Plan selection for unlinked expenses and linked-stop plan lock. |
| Frontend local app Actual Expense plan correction | `rtk bun run test src/components/SagittariusApp.test.tsx --testNamePattern "expense\|Trip Plan"` | Passed: 1 file, 18 tests, including local unlinked expense move to an organizer-selected Trip Plan. |
| Frontend itinerary booking templates | `rtk bun run test src/components/SmartItineraryTable.test.tsx src/components/SagittariusApp.test.tsx --testNamePattern "booking draft\|booking template\|Trip Plan"` | Passed: 2 files, 29 selected tests, including template menu choices and hotel/flight booking draft creation from itinerary rows. |
| Frontend Actual Expense duplicate-as-estimate | `rtk bun run test src/components/TripExpensesPage.test.tsx src/components/SagittariusApp.test.tsx --testNamePattern "estimate\|expense\|Trip Plan"` | Passed: 2 files, 30 selected tests, including creating a booking estimate draft without adding an Actual Expense. |
| Frontend Actual Expense cancel/refund | `rtk bun run test src/components/TripExpensesPage.test.tsx src/components/SagittariusApp.test.tsx --testNamePattern "refund\|cancel\|estimate\|expense\|Trip Plan"` | Passed: 2 files, 34 selected tests, including cancel action and refund settlement creation without removing the source expense. |

## Completion Decision

Phase 0/1 Trip Plan compatibility is strongly evidenced by the current command
matrix. Current Phase 2 service behavior for expenses, tasks, stop notes, and
booking docs is also strongly evidenced by backend and frontend tests. The full
requested product end state is not yet fully proved because full Phase 3
hierarchy/time browser QA remains a later slice.

Do not mark the persistent goal complete until those remaining rows either have
direct implementation and verification evidence or are explicitly removed from
the requested end state by a new user decision and ADR/spec update.
