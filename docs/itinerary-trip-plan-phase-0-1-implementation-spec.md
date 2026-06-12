# Itinerary Trip Plan Phase 0/1 Implementation Spec

This spec is the contract for the first itinerary redesign slice. Phase 0 records language and decisions; Phase 1 adds canonical Trip Plan API names while keeping the existing `plan_variants` storage and compatibility fields.

## Phase Boundaries

### Phase 0: Language And Decision Freeze

- `Trip Plan` is the canonical name for a complete named itinerary version.
- `Main Plan` is a selected Trip Plan, not the original plan.
- `Plan Status` is separate from the plan name and uses `main`, `draft`, `proposal`, or `backup`.
- `Actual Expense` is real paid or committed money and must not move automatically when the Main Plan changes.
- ADRs for this slice live in:
  - [0001 Trip Plan Language Over Plan Variants](./adr/0001-trip-plan-language-over-plan-variants.md)
  - [0002 Main Plan Is A Selection](./adr/0002-main-plan-is-a-selection.md)
  - [0003 Plan-scoped Records And Actual Expenses](./adr/0003-plan-scoped-records-and-actual-expenses.md)

### Phase 1: Compatibility API

- Add canonical response aliases: `tripPlans`, `mainTripPlanId`, and `status`.
- Keep legacy response fields: `planVariants`, `activePlanVariantId`, and `kind`.
- Add canonical `/trip-plans` routes as facades over the current plan variant service.
- Add `plan_variants.status` without renaming `plan_variants`.
- Update frontend API mapping so canonical-only, legacy-only, and mixed payloads normalize to the same local trip state.

## Non-goals

- Do not rename `plan_variants` or `PlanVariant` storage/service internals in Phase 0/1.
- Do not remove `planVariants`, `activePlanVariantId`, or `kind`.
- Do not finish plan-scoping every booking, task, note, or expense in Phase 1. That is Phase 2, though its DDL draft is included below for review.
- Do not rebuild the itinerary hierarchy UI in Phase 0/1.
- Do not remove automatic overlap-to-path behavior in Phase 0/1. That belongs to Phase 4 after explicit Alternative Path controls are ready.

## Canonical Compatibility Map

| Domain term | Canonical API | Legacy compatibility | Rule |
| --- | --- | --- | --- |
| Trip Plan | `tripPlans[]`, `/trip-plans` | `planVariants[]`, `/plan-variants` | Canonical fields/routes are preferred; legacy remains valid. |
| Main Plan | `mainTripPlanId`, `/set-main` | `activePlanVariantId`, `/publications` | Values mirror each other during Phase 1; the stored pointer is authoritative if status disagrees. |
| Plan Status | `status` | `kind` | `split` maps to `proposal`; `proposal` maps back to legacy `split`. |
| Plan-scoped Record | `tripPlanId` | none | Phase 2 makes this durable for records. |

Compatibility boundary:

- Storage, legacy routes, and realtime event names may keep `plan_variant` in Phase 1.
- Product copy, new route helpers, API mappers, docs, and new domain-facing code should use Trip Plan language.
- New `PlanVariant` references should stay inside compatibility modules unless the surrounding file has not yet been migrated.
- `TripPlanSummary` and `TripPlan` may be aliases in Phase 1, but the alias is a migration bridge, not the long-term domain model.

## API Response Diffs

### Load Cockpit

Route:

```text
GET /api/v1/trips/:tripId
```

Legacy response:

```json
{
  "trip": {
    "id": "trip-1",
    "activePlanVariantId": "plan-main"
  },
  "planVariants": [
    {
      "id": "plan-main",
      "tripId": "trip-1",
      "name": "Main",
      "kind": "main",
      "description": "",
      "version": 1
    }
  ]
}
```

Phase 1 response:

```json
{
  "trip": {
    "id": "trip-1",
    "activePlanVariantId": "plan-main",
    "mainTripPlanId": "plan-main"
  },
  "planVariants": [
    {
      "id": "plan-main",
      "tripId": "trip-1",
      "name": "Main",
      "kind": "main",
      "status": "main",
      "description": "",
      "version": 1
    }
  ],
  "tripPlans": [
    {
      "id": "plan-main",
      "tripId": "trip-1",
      "name": "Main",
      "kind": "main",
      "status": "main",
      "description": "",
      "version": 1
    }
  ]
}
```

Required compatibility behavior:

- `trip.mainTripPlanId` mirrors `trip.activePlanVariantId`.
- `tripPlans[]` mirrors `planVariants[]` in Phase 1.
- `tripPlans[].status` is required in new backend responses.
- If `trip.mainTripPlanId` and a plan's `status: "main"` disagree, readers use `trip.mainTripPlanId` as the Main Plan and treat status as repairable metadata.
- Frontend mapping must accept:
  - canonical mixed payload with both `tripPlans` and `planVariants`;
  - legacy payload with only `planVariants`;
  - canonical-only test payload with `tripPlans` and an empty or missing legacy list where local code permits it.

### Create Trip Plan

Canonical route:

```text
POST /api/v1/trips/:tripId/trip-plans
```

Legacy route kept:

```text
POST /api/v1/trips/:tripId/plan-variants
```

Canonical request:

```json
{
  "clientMutationId": "web-trip-plan-1",
  "name": "Rain route",
  "status": "draft",
  "description": "Indoor route for heavy rain",
  "sourceTripPlanId": "plan-main",
  "creationMode": "duplicate-current"
}
```

Legacy-compatible request:

```json
{
  "clientMutationId": "web-plan-variant-1",
  "name": "Rain route",
  "kind": "draft",
  "description": "Indoor route for heavy rain"
}
```

Phase 1 response from either route:

```json
{
  "id": "plan-rain",
  "tripId": "trip-1",
  "name": "Rain route",
  "kind": "draft",
  "status": "draft",
  "description": "Indoor route for heavy rain",
  "version": 1
}
```

Rules:

- `status` is canonical.
- `kind` is accepted as deprecated input.
- If both `kind` and `status` are present, they must agree after mapping.
- `kind: "split"` maps to `status: "proposal"`.
- `status: "proposal"` writes compatibility `kind: "split"`.
- Phase 1 supports only blank creation semantics. Omitted `creationMode` and `creationMode: "blank"` create an empty Trip Plan.
- `creationMode: "duplicate-current"` and `creationMode: "import"` must return `400 invalid_request` until copy/import semantics are implemented; silently creating a blank plan for those modes is not allowed.
- `sourceTripPlanId` is accepted only with a supported non-blank creation mode; with Phase 1 blank creation it must be ignored when absent and rejected when present.

### Patch Trip Plan

Canonical route:

```text
PATCH /api/v1/trips/:tripId/trip-plans/:tripPlanId
```

Legacy route kept:

```text
PATCH /api/v1/trips/:tripId/plan-variants/:planVariantId
```

Request:

```json
{
  "clientMutationId": "web-trip-plan-patch-1",
  "expectedVersion": 3,
  "patch": {
    "name": "Premium hotels proposal",
    "status": "proposal",
    "description": "Client-facing upgrade option"
  }
}
```

Response:

```json
{
  "id": "plan-premium",
  "tripId": "trip-1",
  "name": "Premium hotels proposal",
  "kind": "split",
  "status": "proposal",
  "description": "Client-facing upgrade option",
  "version": 4
}
```

Rules:

- `expectedVersion` is required.
- Version conflict returns the latest plan payload using the same summary shape.
- `patch.kind` remains accepted and maps to canonical `status`.
- Mismatched `kind/status` in the same patch is invalid.

### Set Main Plan

Canonical route:

```text
POST /api/v1/trips/:tripId/trip-plans/:tripPlanId/set-main
```

Legacy route kept:

```text
POST /api/v1/trips/:tripId/plan-variants/:planVariantId/publications
```

Request:

```json
{
  "clientMutationId": "web-main-plan-1",
  "previousMainNextStatus": "backup"
}
```

Phase 1 HTTP response:

```json
{
  "id": "trip-1",
  "activePlanVariantId": "plan-rain",
  "mainTripPlanId": "plan-rain",
  "version": 12
}
```

Realtime event payload must include enough canonical and legacy identity for subscribers:

```json
{
  "activePlanVariantId": "plan-rain",
  "mainTripPlanId": "plan-rain",
  "tripPlan": {
    "id": "plan-rain",
    "kind": "main",
    "status": "main"
  },
  "trip": {
    "id": "trip-1",
    "activePlanVariantId": "plan-rain",
    "mainTripPlanId": "plan-rain"
  }
}
```

Rules:

- The selected Trip Plan becomes `status: "main"` and compatibility `kind: "main"`.
- The previous Main Plan becomes `backup` by default, or `previousMainNextStatus` if provided.
- `previousMainNextStatus` cannot be `main`.
- The transaction must not move or rewrite Actual Expenses, Plan Commitments, booking docs, tasks, stop notes, or itinerary items.
- A no-op set-main on the current Main Plan may still refresh that plan status to `main`, but must not demote it first.
- Set-main has no `expectedVersion` in Phase 1. Concurrency is last-writer-wins after row locks, with duplicate `clientMutationId` rejected by the existing mutation guard.
- A later hardening phase may add `expectedTripVersion`; Phase 1 tests should document the current idempotency and last-writer behavior rather than implying stale set-main conflicts.

## Migration DDL Draft

### Phase 1: Trip Plan Compatibility

```sql
-- 0025_trip_plan_compatibility.sql

ALTER TABLE plan_variants
  ADD COLUMN IF NOT EXISTS status text;

UPDATE plan_variants
SET status = CASE
  WHEN kind = 'split' THEN 'proposal'
  WHEN kind IN ('main', 'draft', 'backup') THEN kind
  ELSE 'draft'
END
WHERE status IS NULL;

ALTER TABLE plan_variants
  ADD CONSTRAINT plan_variants_status_check
  CHECK (status IS NULL OR status IN ('main', 'draft', 'proposal', 'backup')) NOT VALID;

ALTER TABLE plan_variants
  VALIDATE CONSTRAINT plan_variants_status_check;
```

Notes:

- Keep `status` nullable in Phase 1 so legacy fixtures and raw support scripts do not fail before they are migrated.
- New application writes must set both `status` and legacy `kind`.
- Do not add a unique partial index for `status = 'main'` until the set-main code transactionally demotes the previous Main Plan and existing data is audited.
- Do not rename or drop `kind` in Phase 1.

### Phase 2 Draft: Plan-scoped Records

This DDL is included here because Phase 0/1 API decisions depend on the boundary, but it should be shipped as Phase 2.

```sql
-- 0026_plan_scoped_records.sql

ALTER TABLE trip_tasks ADD COLUMN IF NOT EXISTS trip_plan_id uuid;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS trip_plan_id uuid;
ALTER TABLE stop_notes ADD COLUMN IF NOT EXISTS trip_plan_id uuid;
ALTER TABLE booking_docs ADD COLUMN IF NOT EXISTS trip_plan_id uuid;

UPDATE trip_tasks task
SET trip_plan_id = trips.active_plan_variant_id
FROM trips
WHERE task.trip_id = trips.id
  AND task.trip_plan_id IS NULL;

UPDATE expenses expense
SET trip_plan_id = trips.active_plan_variant_id
FROM trips
WHERE expense.trip_id = trips.id
  AND expense.trip_plan_id IS NULL;

UPDATE stop_notes note
SET trip_plan_id = item.plan_variant_id
FROM itinerary_items item
WHERE note.trip_id = item.trip_id
  AND note.itinerary_item_id = item.id
  AND note.trip_plan_id IS NULL;

UPDATE booking_docs booking
SET trip_plan_id = trips.active_plan_variant_id
FROM trips
WHERE booking.trip_id = trips.id
  AND booking.trip_plan_id IS NULL;

ALTER TABLE trip_tasks
  ADD CONSTRAINT trip_tasks_trip_plan_fkey
  FOREIGN KEY (trip_plan_id, trip_id) REFERENCES plan_variants(id, trip_id) NOT VALID;

ALTER TABLE expenses
  ADD CONSTRAINT expenses_trip_plan_fkey
  FOREIGN KEY (trip_plan_id, trip_id) REFERENCES plan_variants(id, trip_id) NOT VALID;

ALTER TABLE stop_notes
  ADD CONSTRAINT stop_notes_trip_plan_fkey
  FOREIGN KEY (trip_plan_id, trip_id) REFERENCES plan_variants(id, trip_id) NOT VALID;

ALTER TABLE booking_docs
  ADD CONSTRAINT booking_docs_trip_plan_fkey
  FOREIGN KEY (trip_plan_id, trip_id) REFERENCES plan_variants(id, trip_id) NOT VALID;

ALTER TABLE trip_tasks VALIDATE CONSTRAINT trip_tasks_trip_plan_fkey;
ALTER TABLE expenses VALIDATE CONSTRAINT expenses_trip_plan_fkey;
ALTER TABLE stop_notes VALIDATE CONSTRAINT stop_notes_trip_plan_fkey;
ALTER TABLE booking_docs VALIDATE CONSTRAINT booking_docs_trip_plan_fkey;

CREATE INDEX IF NOT EXISTS trip_tasks_trip_plan_active_idx
  ON trip_tasks (trip_id, trip_plan_id, visibility, status, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS expenses_trip_plan_active_idx
  ON expenses (trip_id, trip_plan_id, created_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS stop_notes_trip_plan_item_idx
  ON stop_notes (trip_id, trip_plan_id, itinerary_item_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS booking_docs_trip_plan_active_idx
  ON booking_docs (trip_id, trip_plan_id, starts_at, created_at)
  WHERE deleted_at IS NULL;
```

Phase 2 rules:

- Existing Actual Expenses are backfilled to the Main Plan active at migration time.
- Switching Main Plan after migration must not update existing `trip_plan_id` values.
- Stop notes linked to itinerary items inherit the item's plan.
- Create flows should default to the linked itinerary item's plan when present, otherwise to the current Main Plan.
- A plan-scoped record that links an itinerary item must have `trip_plan_id = itinerary_items.plan_variant_id` unless a future explicit cross-plan reference type exists.
- Columns may remain nullable until legacy raw inserts and support scripts are migrated.

## Implementation Touchpoints

### Backend

- [domain/types.rs](../backend/crates/sagittarius-api/src/domain/types.rs)
  - Add `TripSummary.main_trip_plan_id`.
  - Keep `PlanVariantSummary` and expose `TripPlanSummary` as a Phase 1 alias.
  - Add `TripCockpit.trip_plans`.
- [domain/patches.rs](../backend/crates/sagittarius-api/src/domain/patches.rs)
  - Accept `status`, legacy `kind`, `sourceTripPlanId`, and `creationMode`.
  - Validate `kind/status` agreement.
  - Reject unsupported non-blank `creationMode` values until duplicate/import semantics exist.
  - Validate `previousMainNextStatus` and reject `main`.
- [api/plan_variants.rs](../backend/crates/sagittarius-api/src/api/plan_variants.rs)
  - Keep legacy handlers.
  - Add canonical handlers returning `TripPlanSummary` aliases.
- [app/plan_variants.rs](../backend/crates/sagittarius-api/src/app/plan_variants.rs)
  - Write both `kind` and `status`.
  - Make set-main transactional.
  - Do not touch plan-scoped records in set-main.
- [db/queries.rs](../backend/crates/sagittarius-api/src/db/queries.rs)
  - Read/write `status`.
  - Keep `active_plan_variant_id` as the stored Main Plan pointer in Phase 1.

### Frontend

- [trip/types.ts](../frontend/src/trip/types.ts)
  - Add `PlanStatus`.
  - Keep `PlanVariant`; expose `TripPlan` as a compatibility alias.
  - Add `Trip.mainTripPlanId` and `Trip.tripPlans`.
- [trip/api-routes.ts](../frontend/src/trip/api-routes.ts)
  - Add `tripPlans`, `tripPlan`, and `setMainTripPlan`.
  - Keep legacy route helpers until callers are fully migrated.
- [trip/api-client.ts](../frontend/src/trip/api-client.ts)
  - Use canonical `/trip-plans` routes for create/patch/set-main.
  - Map mixed and legacy payloads consistently.
  - Preserve `tripPlanId` for plan-scoped records.
- [app/SagittariusApp.tsx](../frontend/src/app/SagittariusApp.tsx), [components/SmartItineraryTable.tsx](../frontend/src/components/SmartItineraryTable.tsx), [i18n/messages.ts](../frontend/src/i18n/messages.ts)
  - Change visible copy from Trip Sheet to Trip Plan.
  - Keep UI dense and itinerary-workspace focused.

## Exact Test Matrix

### Phase 0/1 Required

| Phase | Layer | Test file | Exact scenario |
| --- | --- | --- | --- |
| 0 | Docs | `CONTEXT.md` | Glossary contains Trip Plan, Main Plan, Backup Plan, Plan Status, Actual Expense, Plan Estimate, Plan Commitment. |
| 0 | ADR | `docs/adr/0001-trip-plan-language-over-plan-variants.md` | Records why API language changes before storage rename and where compatibility names may remain. |
| 0 | ADR | `docs/adr/0002-main-plan-is-a-selection.md` | Records that the Main Plan pointer is authoritative over repairable status metadata. |
| 1 | Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | `plan_variants.status` exists and has `main/draft/proposal/backup` check. |
| 1 | Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | Existing `kind = 'split'` rows are backfilled to `status = 'proposal'`. |
| 1 | Backend route | `backend/crates/sagittarius-api/tests/route_contract.rs` | Canonical `/trip-plans`, `/trip-plans/:id`, and `/trip-plans/:id/set-main` routes exist while legacy `/plan-variants`, `/plan-variants/:id`, and `/plan-variants/:id/publications` routes remain. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Canonical create route accepts omitted `creationMode` or `creationMode: "blank"` with `status: "draft"` and returns `kind: "draft"` plus `status: "draft"`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Canonical create route rejects `creationMode: "duplicate-current"` or `"import"` until copy/import semantics are implemented. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Legacy create route accepts `kind: "split"` and returns `status: "proposal"`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Request with conflicting `kind: "draft"` and `status: "proposal"` is rejected. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Patch route requires `expectedVersion`; stale version returns latest plan summary. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Patch `status: "proposal"` returns compatibility `kind: "split"`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main returns `TripSummary` with `activePlanVariantId`, `mainTripPlanId`, and updated trip `version`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main updates selected plan status to `main` and previous main status to `backup` by default. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main rejects `previousMainNextStatus: "main"`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Reusing the same `clientMutationId` on set-main is rejected by duplicate mutation guard. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Same-plan set-main does not demote the current Main Plan before refreshing selected status. |
| 1 | Backend cockpit | `backend/crates/sagittarius-api/tests/trip_load_contract.rs` | Cockpit response includes `trip.mainTripPlanId`, `trip.activePlanVariantId`, `tripPlans[]`, and `planVariants[]`. |
| 1 | Backend realtime | `backend/crates/sagittarius-api/tests/realtime_contract.rs` | Set-main event payload includes `mainTripPlanId`, `activePlanVariantId`, and `tripPlan.status`. |
| 1 | Frontend route | `frontend/src/trip/api-contract.test.ts` | Route helpers produce canonical `/trip-plans` paths and keep legacy helpers. |
| 1 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Mixed cockpit payload maps `tripPlans/mainTripPlanId` and legacy fields to consistent `Trip`. |
| 1 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Legacy-only cockpit payload maps `status` from `kind` and mirrors `mainTripPlanId`. |
| 1 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Canonical create/patch/set-main client methods call `/trip-plans` and `/set-main`. |
| 1 | Frontend UI | `frontend/src/components/SagittariusApp.test.tsx` | Visible selector/copy says Trip Plan, not Trip Sheet. |
| 1 | Frontend table | `frontend/src/components/SmartItineraryTable.test.tsx` | Itinerary plan selector behavior remains stable with Trip Plan wording. |
| 1 | Import/export | `frontend/src/trip/itinerary-import-export.test.ts` | Transitional export includes both `mainTripPlanId` and deprecated `activePlanVariantId`. |
| 1 | E2E/API | `frontend/src/trip/real-api.e2e.test.ts` | Create blank, patch, reload, and set-main Trip Plan through real API compatibility path. |

### Phase 2 Preview

These are not Phase 0/1 release requirements. They document the next slice so Phase 1 does not block the later model.

| Phase | Layer | Test file | Exact scenario |
| --- | --- | --- | --- |
| 2 | Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | `trip_plan_id` exists on expenses, booking docs, trip tasks, and stop notes with composite FK to `plan_variants(id, trip_id)`. |
| 2 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main leaves existing Actual Expense `trip_plan_id` unchanged when Phase 2 schema is present. |
| 2 | Backend API | `backend/crates/sagittarius-api/tests/tasks_contract.rs`, `stop_notes_contract.rs`, `bookings_contract.rs` | Create flows default `trip_plan_id` from linked itinerary item plan, otherwise current Main Plan. |
| 2 | Backend API | `backend/crates/sagittarius-api/tests/tasks_contract.rs`, `stop_notes_contract.rs`, `bookings_contract.rs` | Linked itinerary item mismatch is rejected when record `trip_plan_id` differs from item `plan_variant_id`. |
| 2 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Expenses, tasks, stop notes, and booking docs preserve `tripPlanId`. |
| 2 | Frontend UI | `frontend/src/components/SagittariusApp.test.tsx` | Switching Main Plan does not relabel or move expenses in local mode. |

## Rollout Order

1. Phase 0: update glossary and ADRs.
2. Add `plan_variants.status` migration and model/query fields.
3. Add canonical DTO aliases and cockpit response aliases.
4. Add canonical `/trip-plans` route facades.
5. Update frontend API routes, types, and response mappers.
6. Switch frontend create/patch/set-main calls to canonical routes while keeping legacy helpers.
7. Rename visible UI copy from Trip Sheet to Trip Plan.
8. Run the exact test matrix above for Phase 1.
9. Start Phase 2 plan-scoped record behavior only after Phase 1 compatibility is green.

## Acceptance Criteria

- Product-facing copy uses Trip Plan wording.
- Cockpit payload includes `tripPlans` and `mainTripPlanId`.
- Legacy `planVariants` and `activePlanVariantId` still work.
- Trip Plan summary responses include both `status` and `kind`.
- `kind/status` mapping is deterministic and validated.
- Canonical create/patch/set-main routes exist and legacy routes remain valid.
- Setting Main Plan does not move Actual Expenses or other plan-scoped records.
- Tests prove mixed canonical/legacy payload compatibility.

## Handoff Notes For Later Phases

- Phase 2: ship plan-scoped record DDL and create-flow defaults for expenses, tasks, stop notes, and booking docs.
- Phase 3: store itinerary Time Windows as `start_time`, optional `end_time`, and `end_offset_days`.
- Phase 4: remove automatic overlap-to-path behavior only after explicit Alternative Path actions exist.
- Phase 5: keep the itinerary page as the primary planning surface and use booking/ticket pages for detail editing.
