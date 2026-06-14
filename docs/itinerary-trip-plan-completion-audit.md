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
| `REQ-PLAN-03` | Plans may have different dates, transport, tickets, and records; data should be plan-scoped instead of globally mixed. | Partly proved | DDL `0026`; schema contract; frontend import target tests; set-main no-record-move tests. | Phase 2 service behavior remains: strict create/patch defaults, same-plan relation validation, repair/audit of nullable or inferred `trip_plan_id` rows. |
| `REQ-EXP-01` | Actual Expenses are real money and must not automatically move to a new plan. | Proved for set-main; incomplete for full Phase 2 behavior | `CONTEXT.md`; ADR `0003`; `plan_variants_contract.rs` set-main record-stability assertions; expense copy clarified in UI/docs. | Explicit user-driven move/cancel/refund/duplicate-as-estimate flows are not yet fully implemented as a product workflow. |
| `REQ-HIER-01` | Itinerary shape is Plan Day -> Activity -> Sub-activity, with one sub-activity level and Activity Blocks for grouped journeys. | Partly proved | ADR `0004`; DDL `0027`; backend create/patch hierarchy contracts; frontend itinerary ordering and hierarchy tests; Storybook `HierarchyBlocks`. | Full Phase 3 service/UI sign-off still needs complete browser QA and policy coverage for all move/reparent sequences. |
| `REQ-HIER-02` | Sibling overlaps and child-outside-parent are warnings, not automatic Alternative Paths or automatic fixes. | Proved for current frontend behavior | `frontend/src/trip/itinerary.test.ts`; `SmartItineraryTable.test.tsx`; `ItineraryTemplate.stories.tsx` hierarchy warning story. | Backend import/create/patch policy should remain aligned as Phase 3 hardens hierarchy behavior. |
| `REQ-HIER-03` | When the system catches a hierarchy issue, the user chooses the correction. | Proved for current table UI | `SmartItineraryTable.tsx` row fix menu; `SmartItineraryTable.test.tsx`; `ItineraryTemplate.stories.tsx`; commit `f50ec9ff`. | Re-run Storybook/browser smoke before final UX sign-off. |
| `REQ-TIME-01` | Users enter start and optional end time; duration is derived/displayed, not the main input. | Proved for frontend table/dialog | `StopDialog.tsx`; `SmartItineraryTable.tsx`; `StopDialog.test.tsx`; `SmartItineraryTable.test.tsx`. | Backend raw drift hardening for all read paths remains part of Phase 3 guard coverage. |
| `REQ-TIME-02` | End time can be omitted and can cross days; next-day endings show `+1` after the end time. | Proved for frontend display and contracts | `itineraryDisplay.test.ts`; `StopDialog.test.tsx`; `SmartItineraryTable.test.tsx`; DDL `0027` with `end_offset_days`. | Browser visual QA should be rerun for the superscript-like display before broad UX sign-off. |
| `REQ-JOURNEY-01` | A flight/train/etc. can be modeled as a broader journey block with ticketed segment and buffer steps as sub-activities. | Partly proved | `CONTEXT.md` Journey Block/Ticketed Segment language; Storybook `HierarchyBlocks`; hierarchy/time UI. | Dedicated itinerary quick-create templates for flight/hotel/train commitments are not yet fully implemented. |
| `REQ-INLINE-01` | Itinerary page is the primary planning surface with inline edits and optional details hidden behind quick controls. | Partly proved | `SmartItineraryTable.tsx` inline fields; `StopDialog.tsx`; current component tests. | Full commitment/ticket/hotel quick-edit flow from the itinerary surface needs a separate Phase 2/3 implementation slice. |
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

## Completion Decision

Phase 0/1 Trip Plan compatibility is strongly evidenced by the current command
matrix. The full requested product end state is not yet fully proved because
Phase 2 plan-scoped record behavior, explicit Actual Expense move/estimate
flows, itinerary-first commitment/ticket quick-create workflows, and full
Phase 3 hierarchy/time browser QA remain later or partially implemented slices.

Do not mark the persistent goal complete until those remaining rows either have
direct implementation and verification evidence or are explicitly removed from
the requested end state by a new user decision and ADR/spec update.
