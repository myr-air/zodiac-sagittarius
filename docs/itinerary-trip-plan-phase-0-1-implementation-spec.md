# Itinerary Trip Plan Phase 0/1 Implementation Spec

This spec covers the first implementation slice for the itinerary redesign. It freezes the new domain contract and introduces compatibility names before larger database, backend, and frontend behavior changes.

## Goals

- Use Trip Plan language in product-facing contracts while keeping `plan_variants` as transitional storage.
- Add canonical `tripPlans` and `mainTripPlanId` fields without removing `planVariants` or `activePlanVariantId`.
- Make Plan Status explicit as `main`, `draft`, `proposal`, or `backup`.
- Prepare plan-scoped records without silently moving Actual Expenses.
- Keep API/local behavior compatible while tests migrate.

## Current Conflicts To Resolve

- `Trip Sheet` is still visible copy in frontend messages and tests; Phase 1 replaces user-facing copy with `Trip Plan`.
- `PlanVariant` and `plan_variants` remain acceptable internal compatibility names, but new API/docs should prefer `TripPlan`.
- `activePlanVariantId` currently means the selected editable plan; the new language treats the same pointer as `mainTripPlanId`.
- Current overlap helpers can auto-create generated `Plan A/B` paths. Phase 1 must not deepen this behavior; Phase 4 replaces it with explicit Alternative Path actions.
- Current records such as expenses and booking documents are mostly trip-scoped or itinerary-linked. Phase 1 must not claim plan-scoped safety until Phase 2 migrations and service checks exist.

## Non-goals

- Do not rename the `plan_variants` table in Phase 0/1.
- Do not migrate expenses, bookings, tasks, or notes fully in Phase 0/1.
- Do not rebuild the itinerary table UI in Phase 0/1.
- Do not remove legacy request/response fields until downstream code is migrated.

## Canonical Language

Use the glossary in [CONTEXT.md](../CONTEXT.md) as the source of truth.

| Canonical term | Transitional implementation name | Notes |
| --- | --- | --- |
| Trip Plan | `PlanVariant`, `plan_variants` | Keep storage, expose canonical API aliases. |
| Main Plan | `activePlanVariantId` | Add `mainTripPlanId`; keep the old field as deprecated compatibility. |
| Plan Status | `kind` | Add status semantics; replace `split` with `proposal`. |
| Alternative Path | `path_id`, `path_name`, `path_role` | Explicit route option, not auto-created from overlap. |
| Activity Block | `isPlanBlock`, `parentItemId` | User-facing label becomes Activity Block. |

## API Response Diffs

### Cockpit load

Current shape:

```json
{
  "trip": {
    "id": "trip-1",
    "activePlanVariantId": "plan-main",
    "planVariants": [
      { "id": "plan-main", "name": "Main", "kind": "main" }
    ]
  },
  "planVariants": [
    { "id": "plan-main", "name": "Main", "kind": "main" }
  ]
}
```

Phase 1 additive shape:

```json
{
  "trip": {
    "id": "trip-1",
    "activePlanVariantId": "plan-main",
    "mainTripPlanId": "plan-main",
    "planVariants": [
      { "id": "plan-main", "name": "Main", "kind": "main" }
    ],
    "tripPlans": [
      { "id": "plan-main", "name": "Main", "status": "main" }
    ]
  },
  "planVariants": [
    { "id": "plan-main", "name": "Main", "kind": "main" }
  ],
  "tripPlans": [
    { "id": "plan-main", "name": "Main", "status": "main" }
  ]
}
```

Compatibility rules:

- `trip.mainTripPlanId` mirrors `trip.activePlanVariantId`.
- `tripPlans[].status` maps from `planVariants[].kind`.
- `planVariants[]` remains present until frontend, tests, import/export, and account join flows have migrated.
- `kind: "split"` maps to `status: "proposal"` during read compatibility.

### Create Trip Plan

Keep existing route:

```text
POST /api/v1/trips/:tripId/plan-variants
```

Add canonical route as a facade:

```text
POST /api/v1/trips/:tripId/trip-plans
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

Compatibility request stays valid:

```json
{
  "clientMutationId": "web-plan-variant-1",
  "name": "Rain route",
  "kind": "draft",
  "description": "Indoor route for heavy rain"
}
```

Phase 1 behavior:

- `status` is canonical; `kind` is accepted as deprecated input.
- `creationMode` is accepted but only `blank` and current behavior are implemented in Phase 1 unless duplicate support is already safe.
- Response returns both `status` and `kind`.

### Patch Trip Plan

Canonical route:

```text
PATCH /api/v1/trips/:tripId/trip-plans/:tripPlanId
```

Canonical request:

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

Compatibility:

- Existing `PATCH /plan-variants/:planVariantId` remains.
- `patch.kind` remains accepted and maps to `status`.

### Set Main Plan

Keep existing publish route as compatibility:

```text
POST /api/v1/trips/:tripId/plan-variants/:planVariantId/publish
```

Add canonical route:

```text
POST /api/v1/trips/:tripId/trip-plans/:tripPlanId/set-main
```

Canonical request:

```json
{
  "clientMutationId": "web-main-plan-1",
  "previousMainNextStatus": "backup"
}
```

Behavior:

- Update the trip's main plan pointer.
- Set the selected Trip Plan status to `main`.
- Set the previous Main Plan status to `backup` by default unless `previousMainNextStatus` is provided.
- Do not move Actual Expenses, Plan Commitments, bookings, documents, tasks, or notes.
- Return the full trip/cockpit payload with both canonical and compatibility fields.

## Migration DDL Draft

Phase 1 should add aliases and prepare status values without renaming tables.

```sql
-- 0024_trip_plan_compatibility.sql

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
  ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE plan_variants
  ADD CONSTRAINT plan_variants_status_check
  CHECK (status IN ('main', 'draft', 'proposal', 'backup')) NOT VALID;

ALTER TABLE plan_variants
  VALIDATE CONSTRAINT plan_variants_status_check;

CREATE UNIQUE INDEX IF NOT EXISTS plan_variants_one_main_per_trip_idx
  ON plan_variants (trip_id)
  WHERE status = 'main';
```

Notes:

- Keep `kind` during Phase 1.
- New writes should set both `status` and compatibility `kind`.
- If `kind = 'split'` must remain accepted, map it to `status = 'proposal'` and write back `kind = 'draft'` or keep `kind = 'split'` only for legacy rows until Phase 2 decides.
- The unique main status index should be added only after code updates previous main status transactionally.

Phase 2 preparation draft:

```sql
-- 0025_plan_scoped_records_prepare.sql

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS trip_plan_id uuid;
ALTER TABLE booking_docs ADD COLUMN IF NOT EXISTS trip_plan_id uuid;
ALTER TABLE trip_tasks ADD COLUMN IF NOT EXISTS trip_plan_id uuid;
ALTER TABLE stop_notes ADD COLUMN IF NOT EXISTS trip_plan_id uuid;

UPDATE expenses e
SET trip_plan_id = COALESCE(i.plan_variant_id, t.active_plan_variant_id)
FROM trips t
LEFT JOIN itinerary_items i
  ON i.id = e.itinerary_item_id AND i.trip_id = e.trip_id
WHERE t.id = e.trip_id
  AND e.trip_plan_id IS NULL;

-- Repeat the same backfill pattern for bookings/tasks/notes after confirming table names and nullable item links.
```

Phase 2 constraints should wait until service code enforces cross-plan integrity.

## Backend Implementation Notes

Primary files:

- [domain/types.rs](../backend/crates/sagittarius-api/src/domain/types.rs)
- [domain/patches.rs](../backend/crates/sagittarius-api/src/domain/patches.rs)
- [api/plan_variants.rs](../backend/crates/sagittarius-api/src/api/plan_variants.rs)
- [app/plan_variants.rs](../backend/crates/sagittarius-api/src/app/plan_variants.rs)
- [db/models.rs](../backend/crates/sagittarius-api/src/db/models.rs)
- [db/queries.rs](../backend/crates/sagittarius-api/src/db/queries.rs)
- [app/trips.rs](../backend/crates/sagittarius-api/src/app/trips.rs)

Required changes:

- Add `TripPlanSummary` as the canonical DTO. It may wrap or mirror `PlanVariantSummary` in Phase 1.
- Add `PlanStatus` validation with `main | draft | proposal | backup`.
- Keep existing `PlanVariantSummary.kind` for compatibility.
- Add canonical request structs or accept both `status` and `kind` on the existing structs.
- Add facade routes under `/trip-plans`.
- Ensure setting Main Plan is transactional:
  - validate trip membership/capability;
  - load current main plan;
  - set previous main status;
  - set new main status;
  - update `trips.active_plan_variant_id`;
  - emit realtime event once.
- Do not mutate plan-scoped records in the set-main transaction.

## Frontend Implementation Notes

Primary files:

- [trip/types.ts](../frontend/src/trip/types.ts)
- [trip/api-client.ts](../frontend/src/trip/api-client.ts)
- [trip/api-routes.ts](../frontend/src/trip/api-routes.ts)
- [app/SagittariusApp.tsx](../frontend/src/app/SagittariusApp.tsx)
- [components/SmartItineraryTable.tsx](../frontend/src/components/SmartItineraryTable.tsx)
- [i18n/messages.ts](../frontend/src/i18n/messages.ts)

Required changes:

- Add `TripPlan` and `PlanStatus` aliases/types while keeping `PlanVariant`.
- Add `Trip.mainTripPlanId` and `Trip.tripPlans` while keeping `activePlanVariantId` and `planVariants`.
- Map API payloads so old and new fields stay in sync.
- Change visible copy from `Trip Sheet` to `Trip Plan`.
- Rename local component props after compatibility is stable:
  - `tripSheets` -> `tripPlans`
  - `selectedTripSheetId` -> `selectedTripPlanId`
  - `onChangeTripSheet` -> `onChangeTripPlan`
  - `onCreateTripSheet` -> `onCreateTripPlan`
- Keep old prop names only as a temporary internal bridge if needed.

## Exact Test Matrix

| Area | Test file | Scenario |
| --- | --- | --- |
| Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | `plan_variants.status` exists, allows `main/draft/proposal/backup`, maps existing `split` to `proposal`. |
| Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` or new `trip_plans_contract.rs` | Create Trip Plan through canonical route and receive both `status` and `kind`. |
| Backend API | same | Patch Trip Plan status to `proposal`; legacy `kind` still accepted. |
| Backend API | same | Set Main Plan updates main pointer and previous plan status to `backup`. |
| Backend API | same | Set Main Plan does not update expenses/bookings/tasks/notes counts or IDs. |
| Backend API | `backend/crates/sagittarius-api/tests/trip_load_contract.rs` | Cockpit payload includes `tripPlans/mainTripPlanId` and legacy `planVariants/activePlanVariantId`. |
| Frontend API | `frontend/src/trip/api-client.test.ts` | Maps canonical-only, legacy-only, and mixed cockpit payloads into consistent `Trip`. |
| Frontend API | same | Calls `/trip-plans` when available or old `/plan-variants` during compatibility. |
| Frontend app | `frontend/src/components/SagittariusApp.test.tsx` | Selector label is `Trip Plan`, not `Trip Sheet`. |
| Frontend app | same | Switching Main Plan does not relabel/move expenses in local mode. |
| Frontend table | `frontend/src/components/SmartItineraryTable.test.tsx` | Existing selector behavior remains, visible copy uses Trip Plan. |
| Import/export | `frontend/src/trip/itinerary-import-export.test.ts` | Export includes both `mainTripPlanId` and deprecated `activePlanVariantId` during transition. |
| E2E/API | `frontend/src/trip/real-api.e2e.test.ts` | Create, patch, and set-main Trip Plan through API compatibility path. |

## Rollout Order

1. Add DTO/types and response aliases in backend and frontend.
2. Add `status` column and backfill migration.
3. Add canonical `/trip-plans` routes as facades.
4. Update frontend API mapper and types.
5. Rename visible copy to Trip Plan.
6. Add/adjust tests in the matrix above.
7. Only after this passes, start Phase 2 plan-scoped records.

## Acceptance Criteria

- Product-facing UI uses Trip Plan wording.
- Cockpit payload has `tripPlans` and `mainTripPlanId`.
- Legacy `planVariants` and `activePlanVariantId` still work.
- Plan Status supports `main`, `draft`, `proposal`, and `backup`.
- Setting Main Plan does not mutate Actual Expenses or other plan-scoped records.
- Tests prove mixed canonical/legacy payload compatibility.

## Handoff Notes For Later Phases

- Phase 2 must add real `trip_plan_id` ownership and cross-plan integrity checks before plan-specific expenses/bookings/tasks are presented as safe.
- Phase 3 should decide whether to store `end_time` plus `end_offset_days`, or store a full end timestamp for Time Windows.
- Phase 4 should delete or rewrite automatic overlap-to-path behavior only after explicit Alternative Path actions exist.
- Phase 5 should keep the itinerary page as the primary planning surface and use booking/ticket pages only for detail editing.
