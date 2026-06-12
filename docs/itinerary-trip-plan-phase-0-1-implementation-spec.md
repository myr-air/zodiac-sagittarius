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
  - [0005 Compatibility-first Trip Plan Rollout](./adr/0005-compatibility-first-trip-plan-rollout.md)

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

Repository reality check:

- `0026_plan_scoped_records.sql` and `0027_itinerary_hierarchy_time_windows.sql`
  already exist in the migration path. In this spec they are still treated as
  later behavioral hardening work, not Phase 0/1 acceptance scope.
- Phase 0/1 implementation must not undo those migrations. It must make the
  compatibility contract explicit before the next behavior/UI slice builds on
  the columns that already exist.

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

## Phase 0/1 API Diff Checklist

These are the exact response and request-shape changes Phase 1 owns. Anything
not listed here is a later phase unless it is needed to keep these diffs working
in local mode.

| Surface | Before Phase 1 | Phase 1 additive diff | Removal allowed? |
| --- | --- | --- | --- |
| Cockpit trip summary | `trip.activePlanVariantId` | Add `trip.mainTripPlanId` with the same value. | No. |
| Cockpit plan list | `planVariants[]` | Add mirrored `tripPlans[]`. | No. |
| Plan summary | `kind` | Add `status`; map `kind: "split"` to `status: "proposal"`. | No. |
| Create plan route | `POST /plan-variants` | Add `POST /trip-plans` facade. | No. |
| Patch plan route | `PATCH /plan-variants/:id` | Add `PATCH /trip-plans/:id` facade. | No. |
| Set-main route | `POST /plan-variants/:id/publications` | Add `POST /trip-plans/:id/set-main` facade. | No. |
| Realtime set-main payload | `activePlanVariantId` | Add `mainTripPlanId` and nested `tripPlan.status`. | No. |
| Import/export metadata | `activePlanVariantId` | Add `mainTripPlanId`; keep deprecated active pointer. | No. |
| Frontend local trip state | `activePlanVariantId`, `planVariants` | Add `mainTripPlanId`, optional `tripPlans`, and normalize missing aliases. | No. |

Canonical readers should prefer `mainTripPlanId`, `tripPlans`, and `status`
when present, but Phase 1 compatibility readers must be symmetric: canonical
mixed, canonical-only, and legacy-only payloads normalize to one local shape.

Compatibility response policy:

- Additive fields are mandatory in new backend responses for routes touched in
  Phase 1. Legacy fields remain mandatory wherever existing callers already
  depend on them.
- Canonical route facades return the same JSON body shape as the legacy route
  plus canonical aliases; they do not introduce a parallel DTO that can drift.
- Error responses keep the existing envelope: `code`, `message`, and optional
  `latest` for version conflicts. Phase 1 only adds validation cases, not a new
  error format.
- Serialization order is not part of the contract. Presence, values, status
  mapping, and compatibility aliases are the contract.

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
  "creationMode": "blank"
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
- Create route cannot create a Main Plan by passing `status: "main"` or
  `kind: "main"`. Main Plan selection must go through the set-main route so the
  trip pointer and previous Main Plan are updated together.
- Phase 1 supports only blank creation semantics. Omitted `creationMode` and `creationMode: "blank"` create an empty Trip Plan.
- `creationMode: "duplicate-current"` and `creationMode: "import"` must return `400 invalid_request` until copy/import semantics are implemented; silently creating a blank plan for those modes is not allowed.
- `sourceTripPlanId` is accepted only with a supported non-blank creation mode; with Phase 1 blank creation it must be ignored when absent and rejected when present.

Invalid Phase 1 create request:

```json
{
  "clientMutationId": "web-trip-plan-create-duplicate",
  "name": "Copied plan",
  "status": "draft",
  "creationMode": "duplicate-current"
}
```

Expected error:

```json
{
  "code": "invalid_request",
  "message": "duplicate-current trip plan creation is not supported yet"
}
```

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
- Patch route cannot set `status: "main"` or `kind: "main"`. Use set-main.
- Stale patch tests must use a fresh `clientMutationId` so version conflicts
  are distinct from duplicate mutation conflicts.

Version conflict response shape:

```json
{
  "code": "version_conflict",
  "message": "Trip plan changed",
  "latest": {
    "id": "plan-premium",
    "tripId": "trip-1",
    "name": "Premium hotels proposal",
    "kind": "split",
    "status": "proposal",
    "description": "Client-facing upgrade option",
    "version": 4
  }
}
```

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

Migration files must be safe to run through the existing migrator and must keep
older support scripts working during the compatibility window.

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
- Do not rely on `status = 'main'` for identity. `trips.active_plan_variant_id`
  remains the stored Main Plan pointer and is exposed as `mainTripPlanId`.
- Rollback stance: this migration is additive and forward-only in normal
  environments. Emergency rollback should keep the nullable `status` column in
  place because old binaries ignore it and new binaries need it for aliases.
- If an emergency database downgrade is required, drop
  `plan_variants_status_check` before dropping `plan_variants.status`. No Phase
  1 uniqueness, routing, or Main Plan identity invariant may depend only on this
  column, so an application rollback remains compatible while `kind` is still
  written.
- Repair stance: if legacy support scripts insert `status = NULL`, read paths
  must derive status from `kind`; the next application write should persist both
  `kind` and `status`.
- Acceptance uses the real migration path file
  [0025_trip_plan_compatibility.sql](../backend/migrations/0025_trip_plan_compatibility.sql).

### Phase 2 Draft: Plan-scoped Records

This DDL is included here because Phase 0/1 API decisions depend on the boundary, but it should be shipped as Phase 2.

```sql
-- 0026_plan_scoped_records.sql

-- Prerequisite: the baseline schema already has a UNIQUE (id, trip_id)
-- key on plan_variants. Do not add a second uniqueness constraint if that
-- key already exists; tests should assert FK compatibility, not a specific
-- constraint name.

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
SET trip_plan_id = item.plan_variant_id
FROM itinerary_items item
WHERE expense.trip_id = item.trip_id
  AND expense.itinerary_item_id = item.id
  AND expense.trip_plan_id IS NULL;

UPDATE expenses expense
SET trip_plan_id = trips.active_plan_variant_id
FROM trips
WHERE expense.trip_id = trips.id
  AND expense.itinerary_item_id IS NULL
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

- Existing Actual Expenses linked to an itinerary item are backfilled to that
  itinerary item's Trip Plan. Existing Actual Expenses without an itinerary link
  are backfilled to the Main Plan active at migration time.
- Switching Main Plan after migration must not update existing `trip_plan_id` values.
- Stop notes linked to itinerary items inherit the item's plan.
- Create flows should default to the linked itinerary item's plan when present, otherwise to the current Main Plan.
- Patch and relink flows must follow the same rule as create flows: changing an
  expense's itinerary item, task related item, stop note item, or booking doc
  relations must recompute or reject plan scope instead of leaving a stale
  `trip_plan_id`.
- A plan-scoped record that links an itinerary item must have `trip_plan_id = itinerary_items.plan_variant_id` unless a future explicit cross-plan reference type exists.
- Columns may remain nullable until legacy raw inserts and support scripts are migrated.
- Nullable legacy records are visible during compatibility but are not treated as
  movable records. On the next write, application code must either backfill them
  to a concrete Trip Plan using the linked itinerary item or reject the mutation
  with a repairable error.
- Composite FKs require `plan_variants(id, trip_id)` to be unique. The base
  migration already creates that unique key today. Do not add a duplicate
  uniqueness constraint with a new name just to satisfy the draft.
- Before making `trip_plan_id` non-null, audit records with no active Main Plan
  at backfill time and records that intentionally are trip-wide rather than
  plan-scoped.
- Backfilling booking docs to the current Main Plan is a compatibility default
  only. Linked itinerary items remain the stronger source for later repair
  because a booking can be attached to a ticketed segment or journey block.
- The current migration path already contains
  [0026_plan_scoped_records.sql](../backend/migrations/0026_plan_scoped_records.sql).
  It backfills linked Actual Expenses from the linked itinerary item's Trip
  Plan before falling back unlinked expenses to the active Main Plan.
- DB FKs in `0026` prove only that a record belongs to a plan in the same trip.
  Later hardening still needs service checks, triggers, or expanded composite
  FKs for same-plan itinerary item links and booking relation tables.

### Phase 3 Draft: Hierarchy And Time Windows

This DDL is a later slice, but Phase 0/1 docs name it because the API contract
must not force flat rows or duration-only editing.

```sql
-- 0027_itinerary_hierarchy_time_windows.sql

ALTER TABLE itinerary_items
  ADD COLUMN IF NOT EXISTS end_time time,
  ADD COLUMN IF NOT EXISTS end_offset_days integer NOT NULL DEFAULT 0
    CHECK (end_offset_days BETWEEN 0 AND 7);

ALTER TABLE itinerary_items
  ADD CONSTRAINT itinerary_items_no_self_parent_check
  CHECK (parent_item_id IS NULL OR parent_item_id <> id) NOT VALID;

ALTER TABLE itinerary_items
  VALIDATE CONSTRAINT itinerary_items_no_self_parent_check;

CREATE INDEX IF NOT EXISTS itinerary_items_time_window_idx
  ON itinerary_items (trip_id, plan_variant_id, day, start_time, end_time)
  WHERE deleted_at IS NULL;
```

Phase 3 rules:

- Hierarchy depth is exactly Plan Day -> Activity -> Sub-activity.
- A row with children is still a real Activity Block, not a decorative folder.
- Parent and child must belong to the same trip, Trip Plan, and Plan Day.
- A sub-activity cannot itself have children. Patch flows must reject grandchild
  nesting and cycles, not just self-parent assignments.
- Sub-activities follow their parent Activity Block's Alternative Path. In Phase
  3, service code should either inherit blank child path fields from the parent
  or reject child path fields that disagree with the parent; it must not create a
  separate alternative path for a child alone.
- `is_plan_block` is compatibility state for fast reads and UI hints. The
  behavioral source of truth is whether an activity has children, so repair code
  may recompute `is_plan_block` from hierarchy.
- `end_time` is optional. `end_offset_days` shows next-day endings such as
  `02:00+1` in the UI and is not a required duration input.
- `end_offset_days` must be `0` when `end_time` is null. `end_time` without
  `start_time` is allowed as an incomplete planning note, but duration remains
  unknown until both times exist.
- Sub-activity bounds and sibling overlaps are warnings in this phase; they do
  not automatically create Alternative Paths.
- Parent/child cross-plan or cross-day moves must be service-validated. The
  self-parent DB check is not enough to prevent deeper cycles.

## Import/Export Compatibility

Phase 1 import/export must preserve the compatibility aliases and the itinerary
shape even before the UI rewrite.

- Export metadata includes both `mainTripPlanId` and deprecated
  `activePlanVariantId`.
- Import accepts legacy-only, canonical-only, and mixed metadata. The current
  trip id and selected Main Plan remain controlled by the destination trip.
- Import parser accepts `trip.activePlanVariantId`, `trip.mainTripPlanId`, both,
  or neither as compatibility metadata. The parser may return only normalized
  items; the importing app layer supplies the destination trip id and target
  Trip Plan.
- Import does not switch the destination Main Plan just because the file names a
  different `mainTripPlanId`. The imported rows are applied to the current
  target Trip Plan chosen by the import flow.
- Export/import must preserve path fields (`pathGroupId`, `pathId`, `pathName`,
  `pathRole`), hierarchy fields (`parentItemId`, `isPlanBlock`), and time-window
  fields (`endTime`, `endOffsetDays`).
- Import must not flatten sub-activities or convert sibling overlaps into
  Alternative Paths.

## Implementation Touchpoints

### Backend

- [domain/types.rs](../backend/crates/sagittarius-api/src/domain/types.rs)
  - Add `TripSummary.main_trip_plan_id`.
  - Keep `PlanVariantSummary` and expose `TripPlanSummary` as a Phase 1 alias.
  - Add `TripCockpit.trip_plans`.
- [domain/patches.rs](../backend/crates/sagittarius-api/src/domain/patches.rs)
  - Accept `status`, legacy `kind`, `sourceTripPlanId`, and `creationMode`.
  - Validate `kind/status` agreement.
  - Reject `status: "main"` and `kind: "main"` in create/patch requests.
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
  - Use `COALESCE(status, mapped kind)` or an equivalent repair path while
    `plan_variants.status` stays nullable.
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
  - Treat `planVariants` as optional at the wire boundary so canonical-only
    payloads can still hydrate the existing local `trip.planVariants` array.
  - Keep canonical `TripPlanResponse.status` strict for new responses while
    legacy `PlanVariantResponse.status` remains optional.
  - Preserve `tripPlanId` for plan-scoped records.
- [trip/itinerary-import-export.ts](../frontend/src/trip/itinerary-import-export.ts)
  - Export `mainTripPlanId` beside deprecated `activePlanVariantId`.
  - Preserve hierarchy and time-window fields in round trips.
- [app/SagittariusApp.tsx](../frontend/src/app/SagittariusApp.tsx), [components/SmartItineraryTable.tsx](../frontend/src/components/SmartItineraryTable.tsx), [i18n/messages.ts](../frontend/src/i18n/messages.ts)
  - Change visible copy from Trip Sheet to Trip Plan.
  - Keep UI dense and itinerary-workspace focused.
  - Local-mode create/switch/set-main must mirror `activePlanVariantId`,
    `mainTripPlanId`, `planVariants`, `tripPlans`, and plan statuses.

## Exact Test Matrix

### Phase 0/1 Required

| Phase | Layer | Test file | Exact scenario |
| --- | --- | --- | --- |
| 0 | Docs | `CONTEXT.md` | Glossary contains Trip Plan, Main Plan, Backup Plan, Plan Status, Actual Expense, Plan Estimate, Plan Commitment. |
| 0 | ADR | `docs/adr/0001-trip-plan-language-over-plan-variants.md` | Records why API language changes before storage rename and where compatibility names may remain. |
| 0 | ADR | `docs/adr/0002-main-plan-is-a-selection.md` | Records that the Main Plan pointer is authoritative over repairable status metadata. |
| 0 | ADR | `docs/adr/0005-compatibility-first-trip-plan-rollout.md` | Records why Trip Plan API compatibility ships before storage rename or itinerary UI rebuild. |
| 1 | Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | `plan_variants.status` exists and has `main/draft/proposal/backup` check. |
| 1 | Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | Existing `kind = 'split'` rows are backfilled to `status = 'proposal'`. |
| 1 | Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | `plan_variants(id, trip_id)` remains unique so composite FKs from trips, itinerary items, and later plan-scoped records stay valid. |
| 1 | Backend route | `backend/crates/sagittarius-api/tests/route_contract.rs` | Canonical `/trip-plans`, `/trip-plans/:id`, and `/trip-plans/:id/set-main` routes exist while legacy `/plan-variants`, `/plan-variants/:id`, and `/plan-variants/:id/publications` routes remain. |
| 1 | Backend serialization | `backend/crates/sagittarius-api/tests/trip_load_contract.rs`, `backend/crates/sagittarius-api/tests/account_trip_contract.rs` | `TripSummary` serializes both `activePlanVariantId` and `mainTripPlanId`; cockpit serializes both `planVariants` and `tripPlans`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Canonical create route accepts omitted `creationMode` or `creationMode: "blank"` with `status: "draft"` and returns `kind: "draft"` plus `status: "draft"`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Canonical create route rejects `creationMode: "duplicate-current"` or `"import"` until copy/import semantics are implemented. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Canonical create route rejects `sourceTripPlanId` when `creationMode` is absent or `blank`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Create route rejects `status: "main"` and legacy `kind: "main"`; only set-main can select a Main Plan. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Legacy create route accepts `kind: "split"` and returns `status: "proposal"`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Request with conflicting `kind: "draft"` and `status: "proposal"` is rejected. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Unknown `status` and unknown legacy `kind` both return `400 invalid_request` with no row write. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Every Phase 1 validation failure keeps the existing error envelope with `code` and `message`. |
| 1 | Backend permissions | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Canonical `/trip-plans` create/patch/set-main routes enforce the same owner/organizer-only mutation capability as legacy routes; traveler/viewer attempts return `403` and write no rows or events. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Patch route requires `expectedVersion`; stale version returns latest plan summary. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Stale patch with a unique `clientMutationId` returns `version_conflict`; duplicate `clientMutationId` returns the duplicate mutation error. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Patch `status: "proposal"` returns compatibility `kind: "split"`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Patch rejects `status: "main"` and legacy `kind: "main"`; only set-main can select a Main Plan. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Patch with no plan fields is rejected as an empty mutation. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main returns `TripSummary` with `activePlanVariantId`, `mainTripPlanId`, and updated trip `version`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main updates selected plan status to `main` and previous main status to `backup` by default. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main honors `previousMainNextStatus: "draft" | "proposal" | "backup"` and maps `proposal` back to legacy `kind: "split"`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main rejects `previousMainNextStatus: "main"`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Reusing the same `clientMutationId` on set-main is rejected by duplicate mutation guard. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Same-plan set-main does not demote the current Main Plan before refreshing selected status. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main does not update expenses, booking docs, stop notes, trip tasks, or itinerary item plan ids. |
| 1 | Backend cockpit | `backend/crates/sagittarius-api/tests/trip_load_contract.rs` | Cockpit response includes `trip.mainTripPlanId`, `trip.activePlanVariantId`, `tripPlans[]`, and `planVariants[]`. |
| 1 | Backend cockpit | `backend/crates/sagittarius-api/tests/trip_load_contract.rs` | If `status = 'main'` disagrees with `trips.active_plan_variant_id`, cockpit still exposes the pointer as `mainTripPlanId`. |
| 1 | Backend realtime | `backend/crates/sagittarius-api/tests/realtime_contract.rs` | Set-main event payload includes `mainTripPlanId`, `activePlanVariantId`, and `tripPlan.status`. |
| 1 | Backend auth/account | `backend/crates/sagittarius-api/tests/account_trip_contract.rs` | Trip create/join responses include `mainTripPlanId` wherever they already expose `activePlanVariantId`. |
| 1 | Frontend route | `frontend/src/trip/api-contract.test.ts` | Route helpers produce canonical `/trip-plans` paths and keep legacy helpers. |
| 1 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Mixed cockpit payload maps `tripPlans/mainTripPlanId` and legacy fields to consistent `Trip`. |
| 1 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Legacy-only cockpit payload maps `status` from `kind` and mirrors `mainTripPlanId`. |
| 1 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Canonical-only cockpit payload with `tripPlans` and no `planVariants` still produces `trip.planVariants` for existing UI callers. |
| 1 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Pointer/status disagreement keeps `trip.mainTripPlanId` as selected and does not infer selection from a `status: "main"` plan. |
| 1 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Canonical create/patch/set-main client methods call `/trip-plans` and `/set-main`. |
| 1 | Frontend local mode | `frontend/src/app/SagittariusApp.test.tsx` | Local create/rename/set-main keeps `activePlanVariantId`, `mainTripPlanId`, `planVariants`, and `tripPlans` mirrored. |
| 1 | Frontend UI | `frontend/src/components/SagittariusApp.test.tsx` | Visible selector/copy says Trip Plan, not Trip Sheet. |
| 1 | Frontend table | `frontend/src/components/SmartItineraryTable.test.tsx` | Itinerary plan selector behavior remains stable with Trip Plan wording. |
| 1 | Frontend language guard | `frontend/src/project-contract.test.ts` or `frontend/src/i18n/messages.test.ts` | New product copy does not introduce non-compatibility `Plan Variant`, `plan variant`, or Trip Sheet wording. |
| 1 | Import/export | `frontend/src/trip/itinerary-import-export.test.ts` | Transitional export includes both `mainTripPlanId` and deprecated `activePlanVariantId`. |
| 1 | Import/export | `frontend/src/trip/itinerary-import-export.test.ts` | Transitional import accepts legacy metadata and canonical metadata, then applies the current destination trip id and target Trip Plan without flattening path fields or switching Main Plan. |
| 1 | Import/export | `frontend/src/trip/itinerary-import-export.test.ts` | Export/import round trip preserves `parentItemId`, `isPlanBlock`, `endTime`, and `endOffsetDays`. |
| 1 | E2E/API | `frontend/src/trip/real-api.e2e.test.ts` | Create blank, patch, reload, and set-main Trip Plan through real API compatibility path. |

Phase 0/1 release evidence must include the exact command for each layer that
was run. If a listed test is split into an existing broader file, the commit
message or PR notes should name the scenario-level assertion that covers it.

### Phase 2 Preview

These are not Phase 0/1 release requirements. They document the next slice so Phase 1 does not block the later model.

| Phase | Layer | Test file | Exact scenario |
| --- | --- | --- | --- |
| 2 | Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | `trip_plan_id` exists on expenses, booking docs, trip tasks, and stop notes with composite FK to `plan_variants(id, trip_id)`. |
| 2 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main leaves existing Actual Expense `trip_plan_id` unchanged when Phase 2 schema is present. |
| 2 | Backend API | `backend/crates/sagittarius-api/tests/tasks_contract.rs`, `stop_notes_contract.rs`, `bookings_contract.rs` | Create flows default `trip_plan_id` from linked itinerary item plan, otherwise current Main Plan. |
| 2 | Backend API | `backend/crates/sagittarius-api/tests/tasks_contract.rs`, `stop_notes_contract.rs`, `bookings_contract.rs` | Linked itinerary item mismatch is rejected when record `trip_plan_id` differs from item `plan_variant_id`. |
| 2 | Backend API | `backend/crates/sagittarius-api/tests/tasks_contract.rs`, `stop_notes_contract.rs`, `bookings_contract.rs`, new `backend/crates/sagittarius-api/tests/expenses_contract.rs` | Patch/relink flows recompute or reject plan scope when the linked itinerary item changes. |
| 2 | Backend API | `backend/crates/sagittarius-api/tests/tasks_contract.rs`, `stop_notes_contract.rs`, `bookings_contract.rs`, new `backend/crates/sagittarius-api/tests/expenses_contract.rs` | Legacy rows with null `trip_plan_id` are either repaired to a concrete Trip Plan on write or rejected with a repairable error. |
| 2 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Expenses, tasks, stop notes, and booking docs preserve `tripPlanId`. |
| 2 | Frontend UI | `frontend/src/components/SagittariusApp.test.tsx` | Switching Main Plan does not relabel or move expenses in local mode. |

### Phase 3 Preview

These tests are not Phase 0/1 release requirements, but Phase 0/1 must not make
them impossible.

| Phase | Layer | Test file | Exact scenario |
| --- | --- | --- | --- |
| 3 | Backend API | `backend/crates/sagittarius-api/tests/itinerary_create_contract.rs` | Create rejects parent from a different Trip Plan or Plan Day. |
| 3 | Backend API | `backend/crates/sagittarius-api/tests/itinerary_patch_contract.rs` | Patch rejects self-parent, grandchild nesting, cycles, and parent from a different Trip Plan or Plan Day. |
| 3 | Backend API | `backend/crates/sagittarius-api/tests/itinerary_patch_contract.rs` | Child path fields inherit from or must match parent path fields; child-only Alternative Path is rejected. |
| 3 | Backend API | `backend/crates/sagittarius-api/tests/itinerary_patch_contract.rs` | `endOffsetDays` outside `0..7` is rejected and `endOffsetDays` with null `endTime` is normalized or rejected according to service rule. |
| 3 | Frontend table | `frontend/src/components/SmartItineraryTable.test.tsx` | Time display shows next-day end as a superscript-like `+1` after the end time. |
| 3 | Frontend table | `frontend/src/components/SmartItineraryTable.test.tsx` | Sibling overlap and child-outside-parent render warnings without creating Alternative Paths. |

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
- Phase 4: sibling overlaps remain warnings only; automatic overlap-to-path behavior is removed, and Alternative Path changes happen through explicit organizer actions.
- Phase 5: keep the itinerary page as the primary planning surface and use booking/ticket pages for detail editing.
