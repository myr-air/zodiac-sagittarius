# Itinerary Trip Plan Phase 0/1 Implementation Spec

This spec is the contract for the first itinerary redesign slice. Phase 0 records language and decisions; Phase 1 adds canonical Trip Plan API names while keeping the existing `plan_variants` storage and compatibility fields.

## Phase 0/1 Contract Packet

This document is the implementation-start packet, not a retrospective note.
Before production code continues, reviewers should be able to answer three
questions from this file without opening the implementation:

| Packet part | Where it lives | What must be true before code starts |
| --- | --- | --- |
| API response diffs | [Phase 0/1 API Diff Checklist](#phase-01-api-diff-checklist) and [API Response Diffs](#api-response-diffs) | Every touched route names canonical aliases, legacy aliases, validation behavior, and drift handling. |
| Migration DDL draft | [Migration DDL Draft](#migration-ddl-draft) | The draft matches shipped migrations `0025`-`0029`, and the spec names what the database intentionally does not enforce yet. |
| Exact test matrix | [Exact Test Matrix](#exact-test-matrix) | Scenario-level assertions map to `API-*`, `DDL-*`, and `TEST-*` ids; file-level coverage alone is not enough. |

The controlling ADRs for this packet are:

- [0005 Compatibility-first Trip Plan Rollout](./adr/0005-compatibility-first-trip-plan-rollout.md)
- [0006 Phase 0/1 Contract Gate Before Code](./adr/0006-phase-0-1-contract-gate-before-code.md)

Pre-code status: this packet is ready to guide implementation only when all
three artifacts are present in this document at the same time:

- Route-level diffs show both canonical additions and legacy fields retained.
- The DDL draft names the exact shipped migrations and the invariants that stay
  in application/service code during compatibility.
- The test matrix has scenario ids, owners, assertions, and command evidence
  that can be referenced by implementation commits or PR notes.

## Pre-code Freeze Packet

Do not start or continue the next production-code implementation slice until
this packet is reviewed as the Phase 0/1 acceptance baseline:

1. The ADR boundary in [0005 Compatibility-first Trip Plan Rollout](./adr/0005-compatibility-first-trip-plan-rollout.md)
   and [0006 Phase 0/1 Contract Gate Before Code](./adr/0006-phase-0-1-contract-gate-before-code.md)
   is accepted: Phase 1 is an additive compatibility contract, not a storage
   rename, not a hierarchy UI rewrite, and not an implementation-led contract
   discovery exercise.
2. The route-by-route response diff contract below names every API surface that
   must add canonical aliases and every legacy alias that must stay.
3. The DDL section below is treated as the migration draft and repository
   reality check. `0025`, `0026`, `0027`, `0028`, and `0029` already exist in the migration
   path; Phase 0/1 work must not rewrite their intent without a new ADR.
4. The exact test matrix below is the implementation checklist. A code slice
   may split scenarios across files, but it must preserve the listed
   assertions and command evidence.

If implementation discovers that a listed route, column, or test target is
wrong, update this spec and the ADR first, then change code. That keeps the
domain decision trace ahead of the implementation instead of reverse-engineered
after the fact.

### Implementation-start Checklist

Use this checklist before the first production-code commit in a Phase 1 slice.
The implementation can be split into smaller commits, but every committed code
slice must declare which row ids from this spec it covers.

| Gate | Required artifact | Code-start rule |
| --- | --- | --- |
| `DOC-ADR-01` | [ADR 0005](./adr/0005-compatibility-first-trip-plan-rollout.md) records the compatibility-first decision and implementation-start gate. | Do not rename storage or remove legacy aliases in Phase 1. |
| `DOC-ADR-02` | [ADR 0006](./adr/0006-phase-0-1-contract-gate-before-code.md) records that API diffs, DDL draft, and exact test matrix are pre-code artifacts. | Do not start a production-code slice by discovering or changing the contract in code first. |
| `DOC-API-01` | The API diff sections below cover cockpit load, account trip create, join summaries, create, patch, set-main, realtime, import, and import/export envelopes. | Do not add a canonical alias in only one layer. Backend response, realtime payload, frontend mapper, local mapper, docs, and tests move together. |
| `DOC-DDL-01` | The DDL draft below matches migration files `0025`, `0026`, `0027`, `0028`, and `0029`, with rollback stance and drift repair rules. | Do not introduce Phase 1 behavior that requires stronger DB invariants than the shipped migrations enforce. |
| `DOC-TEST-01` | The exact test matrix below names scenario-level assertions and command evidence. | Do not claim implementation readiness from file-level coverage alone; each changed route/mapper/schema path needs a mapped assertion. |
| `DOC-SCOPE-01` | Phase 2/3 preview rows are separated from Phase 0/1 release-blocking rows. | Do not accidentally turn preview behavior into a hidden Phase 1 requirement without updating ADR/spec first. |

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
  - [0006 Phase 0/1 Contract Gate Before Code](./adr/0006-phase-0-1-contract-gate-before-code.md)

### Phase 1: Compatibility API

- Add canonical response aliases: `tripPlans`, `mainTripPlanId`, and `status`.
- Keep legacy response fields: `planVariants`, `activePlanVariantId`, and `kind`.
- Add canonical `/trip-plans` routes as facades over the current plan variant service.
- Add `plan_variants.status` without renaming `plan_variants`.
- Update frontend API mapping so canonical-only, legacy-only, and mixed payloads normalize to the same local trip state.
- Split itinerary workspace selection from Main Plan mutation: selecting a Trip
  Plan for viewing/editing is local UI state, while choosing the real-use Main
  Plan is an explicit set-main mutation.

Phase 1 is not ready for product-code implementation until these gates are
traceable in one commit or PR:

1. API diffs identify every touched route, the canonical aliases it must emit,
   and the legacy aliases it must keep.
2. Migration DDL is additive, rollback-aware, and explicit about what the
   database does not enforce during compatibility.
3. The test matrix names scenario-level assertions, not only test files.
4. Main Plan selection, itinerary workspace selection, and Actual Expense scope
   remain separate in tests and wording.
5. Unsupported plan copy/import modes fail loudly instead of silently creating
   blank plans.
6. The implementation PR links each changed backend/frontend/database file to at
   least one row in the exact test matrix, or explicitly marks the row as a
   later-phase preview.

## Non-goals

- Do not rename `plan_variants` or `PlanVariant` storage/service internals in Phase 0/1.
- Do not remove `planVariants`, `activePlanVariantId`, or `kind`.
- Do not finish plan-scoping every booking, task, note, or expense in Phase 1. That is Phase 2, though its DDL draft is included below for review.
- Do not rebuild the itinerary hierarchy UI in Phase 0/1.
- Do not remove legacy overlap-to-path compatibility data in Phase 0/1. That
  belongs to Phase 4 after explicit Alternative Path controls are ready.
  Phase 0/1 must not describe newly detected overlaps as canonical Alternative
  Paths, must not synthesize Alternative Paths during import, and must keep
  sibling overlaps as warnings at the product language boundary.

Repository reality check:

- `0026_plan_scoped_records.sql` and `0027_itinerary_hierarchy_time_windows.sql`
  already exist in the migration path. Treat them as already-shipped additive
  schema surfaces whose behavioral acceptance is gated to later phases, not as
  migrations that Phase 2/3 will introduce for the first time. Most new fields
  are nullable during compatibility; `itinerary_items.end_offset_days` is
  intentionally non-null with default `0`.
- `0029_expense_reminder_trip_plan_scope.sql` hardens settlement reminder
  history to the Trip Plan scope so reminder timestamps from one draft/main
  plan do not appear on another plan with the same payer, receiver, and amount.
- Phase 0/1 implementation must not undo those migrations. It must make the
  compatibility contract explicit before the next behavior/UI slice builds on
  the columns that already exist.
- Phase 0/1 rollback is an app rollback first. Dropping columns from already
  applied migrations requires coordinated `schema_migrations` repair and is not
  the normal rollback path.

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

Phase 1 route owners must update the route response, realtime payload, frontend
wire mapper, local-mode mapper, import/export mapper, and docs together. A
canonical alias added only in one layer is incomplete.

### Phase 1 Diff Traceability IDs

Implementation PRs should reference these ids in commit messages, PR notes, or
test names so reviewers can verify which API diff each code change implements.

| ID | Surface | Required diff | Minimum matching test rows |
| --- | --- | --- | --- |
| `API-LOAD-01` | `GET /api/v1/trips/:tripId` | Add `trip.mainTripPlanId`, `tripPlans[]`, and `TripPlanSummary.status`; keep `activePlanVariantId`, `planVariants[]`, and `kind`. | Backend cockpit rows, frontend mixed/legacy/canonical mapper rows. |
| `API-ACCOUNT-01` | `POST /api/v1/account/trips` | Add `trip.mainTripPlanId` wherever `activePlanVariantId` is returned. | Backend auth/account row. |
| `API-JOIN-01` | Join-session and invite-token current summaries | Add `trip.mainTripPlanId` without requiring a Trip Plan list. | Backend auth/account row. |
| `API-CREATE-01` | Canonical and legacy create routes | Add `/trip-plans`, return `kind/status`, validate status/kind/mode/source ids, keep `/plan-variants`. | Backend create, route, permissions, realtime, frontend route/client rows. |
| `API-PATCH-01` | Canonical and legacy patch routes | Add `/trip-plans/:id`, require `expectedVersion`, return `kind/status` in success and `latest`, keep legacy route. | Backend patch, route, permissions, realtime, frontend route/client rows. |
| `API-MAIN-01` | Canonical and legacy set-main routes | Add `/trip-plans/:id/set-main`, return both pointer aliases, keep legacy publication route, do not move records. | Backend set-main, realtime, record-scope, frontend selector/set-main rows. |
| `API-TRIP-PATCH-01` | `PATCH /api/v1/trips/:tripId` | Reject direct Main Plan pointer mutation; Phase 1 Main Plan changes go only through set-main. | Backend trips API row and OpenAPI/docs rows. |
| `API-IMPORT-01` | Backend itinerary import normalizer | Return destination `trip.mainTripPlanId`, destination `trip.tripPlans[]`, hierarchy/time/path fields, and compatibility `records`; do not switch Main Plan. | Backend import rows and frontend import/export rows. |
| `API-EXPORT-01` | Frontend import/export envelope | Export both pointer aliases and both plan-list aliases; import legacy-only, canonical-only, mixed, conflicting, and missing aliases without switching destination Main Plan. | Frontend import/export and import-target rows. |
| `API-CHECK-01` | Plan Check run/latest scope | Optional `tripPlanId` scopes Plan Checks to the selected itinerary workspace Trip Plan; omission keeps legacy whole-trip checks. | Backend Plan Check and frontend selector rows. |

Pre-code completeness rule: every `API-*` row above must have one backend
assertion when the backend owns the surface, one frontend mapper or route
assertion when the frontend consumes it, and one documentation assertion when
the public API shape changes. If an implementation slice intentionally covers
only part of a row, the PR notes must name the uncovered assertions as deferred
work rather than implying the row is complete.

### API Diff Ownership Ledger

This ledger prevents a route diff from being implemented in only one layer.
When a row changes, all required owners for that row need either a code/test
change or an explicit "already covered" note in the implementation PR.

| ID | Backend owner | Frontend owner | Docs owner | Compatibility proof |
| --- | --- | --- | --- | --- |
| `API-LOAD-01` | Cockpit serializer and DB query mapper | API client cockpit mapper and local trip normalization | API data spec and OpenAPI cockpit schema | Mixed aliases are equal; canonical-only and legacy-only readers hydrate one local shape. |
| `API-ACCOUNT-01` | Account trip create serializer | Account/portal client mapper if it reads the field | API data spec account route note | Created trip returns both pointers with one Main Plan. |
| `API-JOIN-01` | Join-session and invite-token serializers | Join gate mapper | API data spec join summary note | Read-only summaries reject pointer alias drift when both aliases are present. |
| `API-CREATE-01` | Canonical and legacy create handlers, validation, realtime | Route helpers, API client method, local create fallback | API data spec and OpenAPI route/schema | `/trip-plans` is preferred, `/plan-variants` remains valid, both return `kind/status`. |
| `API-PATCH-01` | Canonical and legacy patch handlers, conflict serializer, realtime | API client patch method and conflict handling | API data spec and OpenAPI route/schema | `expectedVersion` and conflict `latest` carry coherent `kind/status`. |
| `API-MAIN-01` | Canonical and legacy set-main transaction and realtime | Explicit set-main UI/API action; selector must not call this route | API data spec and OpenAPI route/schema | Pointer aliases change together and records do not move. |
| `API-TRIP-PATCH-01` | Trip metadata patch validation | API client error handling for invalid pointer patch | API data spec and OpenAPI patch schema | Direct pointer mutations are rejected with no trip pointer write and no event. |
| `API-IMPORT-01` | Import normalizer response and hierarchy/time validation | Import apply flow and preview mapper | API data spec and OpenAPI import schema | Destination aliases are returned; source aliases never switch the destination Main Plan. |
| `API-EXPORT-01` | Not backend-owned in Phase 1 | Import/export parser, exporter, local import target flow | JSON format doc | File aliases round-trip while imported rows target the selected destination Trip Plan. |
| `API-CHECK-01` | Plan Check run/latest query scope | API client Plan Check methods and selected-plan UI callsite | API data spec Plan Checks section | Optional `tripPlanId` scopes checks without mutating the Main Plan pointer. |

| Surface | Before Phase 1 | Phase 1 additive diff | Removal allowed? |
| --- | --- | --- | --- |
| Cockpit trip summary | `trip.activePlanVariantId` | Add `trip.mainTripPlanId` with the same value. | No. |
| Cockpit plan list | `planVariants[]` | Add mirrored `tripPlans[]`. | No. |
| Plan summary | `kind` | Add `status`; map `kind: "split"` to `status: "proposal"`. | No. |
| Create plan route | `POST /plan-variants` | Add `POST /trip-plans` facade. | No. |
| Patch plan route | `PATCH /plan-variants/:id` | Add `PATCH /trip-plans/:id` facade. | No. |
| Set-main route | `POST /plan-variants/:id/publications` | Add `POST /trip-plans/:id/set-main` facade. | No. |
| Trip metadata patch | `PATCH /trips/:tripId` may accept `activePlanVariantId` | Phase 1 rejects `activePlanVariantId` and `mainTripPlanId` with `400 invalid_request`; set-main is the only Phase 1 Main Plan mutation path. Delegating this route to set-main is out of scope unless a new ADR/API row replaces this rule. | No bypass. |
| Realtime set-main payload | `activePlanVariantId` | Add `mainTripPlanId`, nested `tripPlan.status`, and `previousMainTripPlan` when a different previous Main Plan is demoted. | No. |
| Account trip create | `trip.activePlanVariantId` | Add `trip.mainTripPlanId`. | No. |
| Join/session trip summary | `trip.activePlanVariantId` | Add `trip.mainTripPlanId` to join-session and invite-token-current responses. | No. |
| Backend itinerary import response | `trip.activePlanVariantId` | Add `trip.mainTripPlanId` and `trip.tripPlans[]`; keep normalized imported rows and compatibility `records`. | No. |
| Import/export metadata | `activePlanVariantId` | Add `mainTripPlanId`; keep deprecated active pointer. | No. |
| API reference docs | `activePlanVariantId`, `planVariants`, `kind`, and `/plan-variants` only | Document canonical aliases and canonical routes in `docs/api-data-spec.md`; update OpenAPI schemas touched by itinerary/import responses. | No. |
| Frontend local trip state | `activePlanVariantId`, `planVariants` | Add `mainTripPlanId`, optional `tripPlans`, and normalize missing aliases. | No. |
| Itinerary workspace selection | Selector calls publish/set-main implicitly | Selector only changes the working Trip Plan; explicit set-main command changes `mainTripPlanId`/`activePlanVariantId`. | No implicit set-main. |

### Route-by-route Response Diff Contract

This table is the compact Phase 1 implementation index. The longer examples
below remain authoritative for JSON shape details.

| Route or surface | Success response must add | Success response must keep | Validation/conflict behavior |
| --- | --- | --- | --- |
| `GET /api/v1/trips/:tripId` | `trip.mainTripPlanId`, top-level `tripPlans[]`, `tripPlans[].status` | `trip.activePlanVariantId`, top-level `planVariants[]`, `planVariants[].kind` | Alias drift between `tripPlans[]` and `planVariants[]` is a backend contract bug; frontend rejects drift as `invalid_response`. |
| `POST /api/v1/account/trips` | `trip.mainTripPlanId` | `trip.activePlanVariantId` | Created Main Plan summary writes both `status: "main"` and `kind: "main"`. |
| `POST /api/v1/trip-join-sessions` and invite-token-current | `trip.mainTripPlanId` | `trip.activePlanVariantId` | Read-only summary; no Trip Plan list required unless the route already returns one. |
| `POST /api/v1/trips/:tripId/trip-plans` | `status` in returned Trip Plan summary | `kind` in the same summary | Reject `status/kind = "main"`, unknown statuses, mismatched `kind/status`, unsupported `creationMode`, and illegal `sourceTripPlanId`. |
| `POST /api/v1/trips/:tripId/plan-variants` | `status` in returned Trip Plan summary | Existing legacy route and `kind` | Same validation as canonical create route. |
| `PATCH /api/v1/trips/:tripId/trip-plans/:tripPlanId` | `status` in returned Trip Plan summary and conflict `latest` | `kind` in success and conflict `latest` | Require `expectedVersion`; reject empty patch, main status, unknown values, and mismatched `kind/status`. |
| `PATCH /api/v1/trips/:tripId/plan-variants/:planVariantId` | `status` in returned Trip Plan summary and conflict `latest` | Existing legacy route and `kind` | Same validation as canonical patch route. |
| `POST /api/v1/trips/:tripId/trip-plans/:tripPlanId/set-main` | `mainTripPlanId`; realtime payload `tripPlan.status` and `previousMainTripPlan.status` when demoting | `activePlanVariantId`; realtime wrapper `plan_variant.updated` / `plan_variant` | Reject invalid `previousMainNextStatus`; duplicate `clientMutationId` is handled by mutation guard; no `expectedVersion` in Phase 1. |
| `POST /api/v1/trips/:tripId/plan-variants/:planVariantId/publications` | Same as canonical set-main | Existing legacy route and pointer alias | Same validation as canonical set-main route. |
| `PATCH /api/v1/trips/:tripId` | No Main Plan mutation in Phase 1 | Existing metadata patch fields | Reject `activePlanVariantId` and `mainTripPlanId` with `400 invalid_request`; callers must use `/trip-plans/:id/set-main`. |
| `POST /api/v1/trips/:tripId/itinerary-imports` | Destination `trip.mainTripPlanId`, destination `trip.tripPlans[]`, compatibility `records` | Destination `trip.activePlanVariantId`; imported item fields | Does not switch destination Main Plan; preserves hierarchy/time/path fields and rejects invalid hierarchy/time input according to import contract. |
| Frontend export envelope | `trip.mainTripPlanId`, `trip.tripPlans[]`, `trip.tripPlans[].status` | `trip.activePlanVariantId`, `trip.planVariants[]`, `trip.planVariants[].kind` | Import accepts legacy-only, canonical-only, mixed, conflicting source aliases, and missing aliases without changing destination Main Plan. |

Placement rule: cockpit load responses use top-level `tripPlans[]` and
`planVariants[]` beside `trip`. Import/export file envelopes place plan-list
aliases under `trip` as `trip.tripPlans[]` and `trip.planVariants[]`; do not
invent a parallel `metadata.tripPlans[]` envelope in Phase 1.

Request-shape rule: Phase 1 may accept either canonical request fields or
legacy request fields on compatibility routes only when the mapping is
unambiguous. A request containing both canonical and legacy names must be
accepted only when they map to the same domain value; mismatches are
`400 invalid_request` with no row write, no event, and no partial local-state
commit.

Canonical readers should prefer `mainTripPlanId`, `tripPlans`, and `status`
when present, but Phase 1 compatibility readers must be symmetric: canonical
mixed, canonical-only, and legacy-only payloads normalize to one local shape.

Compatibility response policy:

- Additive fields are mandatory in new backend responses for routes touched in
  Phase 1. Legacy fields remain mandatory wherever existing callers already
  depend on them.
- Backend-owned canonical Trip Plan responses must emit `status`. Frontend
  compatibility readers may still derive missing `status` from `kind` for
  legacy-only, old-fixture, and defensive canonical-only test payloads, but a
  missing `status` from a Phase 1 backend route is a backend contract failure.
- Canonical route facades return the same JSON body shape as the legacy route
  plus canonical aliases; they do not introduce a parallel DTO that can drift.
- When a response includes both `tripPlans[]` and `planVariants[]`, the backend
  must emit equal plan identities, names, versions, and mapped `kind/status`
  pairs in both arrays. Frontend readers prefer `tripPlans[]` as canonical and
  mirror it into local `planVariants[]` when the legacy list is missing; mixed
  payload drift is a contract error to test, not a supported business state.
- Repairable `kind/status` drift is allowed only inside one serialized summary
  after applying the Main Plan repair precedence. It is not allowed for
  `tripPlans[]` and `planVariants[]` aliases of the same plan to disagree with
  each other after mapping. If the aliases disagree on identity, name, version,
  or mapped `kind/status`, frontend mappers surface `invalid_response`.
- Error responses keep the existing envelope: `code`, `message`, and optional
  `latest` for version conflicts. Phase 1 only adds validation cases, not a new
  error format.
- Error `code`, HTTP status, and structured fields such as `latest` are
  contractual. `message` must be useful and non-empty, but tests should not
  assert exact wording unless a specific endpoint already treats that wording as
  a public contract.
- Serialization order is not part of the contract. Presence, values, status
  mapping, and compatibility aliases are the contract.

Plan status repair precedence:

1. `trips.active_plan_variant_id` is the authoritative Main Plan identity and
   is exposed as `trip.mainTripPlanId`.
2. For the row whose `id` equals the pointer, API responses expose a coherent
   pair of `status: "main"` and `kind: "main"` even when raw stored
   `plan_variants.status` is stale.
3. If any non-pointer row has effective Main Plan status, whether from raw
   `status = 'main'` or nullable `status` derived from legacy `kind = 'main'`,
   treat it as repairable drift. API responses must not expose two Main Plans;
   they expose that row as `status: "backup"` and `kind: "backup"` until a
   service write persists the repaired pair or a user explicitly sets it as Main
   Plan.
4. For other non-main rows with a non-null supported `status`, API responses
   expose that canonical `status` and derive the legacy `kind` from it, so raw
   `kind/status` drift cannot leak mismatched aliases.
5. For non-main rows with `status IS NULL`, API responses derive canonical
   `status` from legacy `kind` and derive the response `kind` from that same
   canonical status.
6. Direct Trip Plan route responses and version-conflict `latest` payloads need
   pointer context before serializing a plan. A patch against the current Main
   Plan must return `status: "main"`/`kind: "main"` even when the raw row was
   drifted; a stale patch `latest` payload must follow the same repair
   precedence.
7. Service writes must persist both columns as the mapped pair. If a write
   touches a drifted row, the write repairs the stored pair instead of
   preserving raw mismatch.

Examples:

- Pointer = `plan-a`, row `plan-a` has raw `kind = 'draft'`,
  `status = 'proposal'`: response emits `kind: "main"`, `status: "main"`.
- Pointer = `plan-a`, row `plan-b` has raw `kind = 'draft'`,
  `status = 'proposal'`: response emits `kind: "split"`,
  `status: "proposal"`.
- Pointer = `plan-a`, row `plan-b` has raw `kind = 'main'`,
  `status = 'main'`: response emits `kind: "backup"`, `status: "backup"` until
  repaired.
- Pointer = `plan-a`, row `plan-b` has raw `kind = 'split'`,
  `status = NULL`: response emits `kind: "split"`, `status: "proposal"`.

## API Response Diffs

### Compatibility Payload Variants

Frontend and import/export readers must normalize these payload families to the
same local Trip Plan state:

| Variant | Required behavior |
| --- | --- |
| Legacy-only | Read `activePlanVariantId`, `planVariants[]`, and `kind`; derive `mainTripPlanId`, `tripPlans[]`, and `status`. |
| Canonical mixed | Prefer `mainTripPlanId`, `tripPlans[]`, and `status`; verify legacy aliases mirror the canonical values when both are present. |
| Canonical-only | Read `mainTripPlanId`, `tripPlans[]`, and `status`; mirror into local compatibility fields required by existing UI code. |
| Drifted mixed | Treat unequal `tripPlans[]` and `planVariants[]` identities, names, versions, or mapped `kind/status` aliases as contract drift; frontend mappers must surface `invalid_response` instead of silently choosing one list. |

The backend Phase 1 routes should normally emit canonical mixed payloads.
Canonical-only payloads are accepted by frontend tests so the UI is ready for
the later legacy-removal phase; legacy-only payloads remain accepted for old
fixtures and compatibility clients. Backend tests should prevent drift at the
source; frontend tests should reject impossible alias drift after the Main Plan
repair precedence has been applied within each summary.

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

### Account Trip Create And Join Summaries

Routes:

```text
POST /api/v1/account/trips
POST /api/v1/trip-join-sessions
GET /api/v1/trip-join-invite-tokens/current?token=:token
```

Any response that exposes a trip summary with `activePlanVariantId` must also
expose `mainTripPlanId`.

Legacy account trip create response fragment:

```json
{
  "trip": {
    "id": "trip-1",
    "activePlanVariantId": "plan-main"
  }
}
```

Phase 1 account trip create response fragment:

```json
{
  "trip": {
    "id": "trip-1",
    "activePlanVariantId": "plan-main",
    "mainTripPlanId": "plan-main"
  }
}
```

Legacy join response fragment:

```json
{
  "trip": {
    "id": "trip-1",
    "activePlanVariantId": "plan-main"
  },
  "claimableMembers": []
}
```

Phase 1 join response fragment:

```json
{
  "trip": {
    "id": "trip-1",
    "activePlanVariantId": "plan-main",
    "mainTripPlanId": "plan-main"
  },
  "claimableMembers": []
}
```

Rules:

- Account trip creation creates one Main Plan and returns both pointer aliases.
- Join and invite-token-current responses are read-only compatibility summaries;
  they do not include `tripPlans[]` unless the route already exposes plan lists.
- Readers use `mainTripPlanId` when present and fall back to
  `activePlanVariantId`.

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
- If both `status` and `kind` are omitted, create defaults to `status:
  "draft"` and compatibility `kind: "draft"`.
- If both `kind` and `status` are present, they must agree after mapping.
- `kind: "split"` maps to `status: "proposal"`.
- `status: "proposal"` writes compatibility `kind: "split"`.
- Create route cannot create a Main Plan by passing `status: "main"` or
  `kind: "main"`. Main Plan selection must go through the set-main route so the
  trip pointer and previous Main Plan are updated together.
- Phase 1 supports only blank creation semantics. Omitted `creationMode` and `creationMode: "blank"` create an empty Trip Plan.
- Phase 1 Trip Plan summaries do not store `startsOn` or `endsOn`. A plan's
  visible date range is derived from its Plan Days/itinerary rows until a later
  phase adds explicit plan-date fields.
- `creationMode: "duplicate-current"`, `creationMode: "import"`, and any
  unknown non-blank `creationMode` must return `400 invalid_request` until
  copy/import semantics are implemented; silently creating a blank plan for
  those modes is not allowed.
- Copy/import creation modes stay rejected because Phase 1 has not decided how
  to handle real-world commitments. Phase 2 must choose per record type whether
  to clone a draft booking, preserve a reference to an existing commitment,
  duplicate a Plan Estimate, or reject the operation. Actual Expenses must not
  be cloned or moved as a side effect of Trip Plan creation.
- `sourceTripPlanId` is accepted only with a supported non-blank creation mode; with Phase 1 blank creation it must be ignored when absent and rejected when present.
- `sourceTripPlanId` is illegal in Phase 1 when it is `null`, the wrong JSON
  type, an invalid UUID, a non-existent Trip Plan id, or a Trip Plan id from a
  different trip, because no supported creation mode can consume it yet.

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
  "message": "trip plan creation mode is not supported yet"
}
```

Tests assert `400`, `code: "invalid_request"`, and no row write. The exact
`message` text is not contractual unless the route later promotes
mode-specific copy to a public API guarantee.

Create validation failures:

| Input problem | HTTP/code | Write/event behavior |
| --- | --- | --- |
| `status: "main"` or legacy `kind: "main"` | `400 invalid_request` | No plan row write and no realtime event. |
| Unknown `status` or unknown legacy `kind` | `400 invalid_request` | No plan row write and no realtime event. |
| Mismatched `status` and `kind` after mapping | `400 invalid_request` | No plan row write and no realtime event. |
| `creationMode` is `duplicate-current`, `import`, or an unknown non-blank value | `400 invalid_request` | No plan row write and no realtime event. |
| `sourceTripPlanId` is present while `creationMode` is absent or `blank` | `400 invalid_request` | No plan row write and no realtime event. |
| `status`, `kind`, `creationMode`, or `sourceTripPlanId` is `null` or the wrong JSON type | `400 invalid_request` | No plan row write and no realtime event. |
| `sourceTripPlanId` is an invalid UUID, a non-existent id, or an id from a different trip | `400 invalid_request` | No plan row write and no realtime event. |

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

Patch validation failures:

| Input problem | HTTP/code | Write/event behavior |
| --- | --- | --- |
| Missing `expectedVersion` | `400 invalid_request` | No plan row write and no realtime event. |
| Empty `patch` or no supported plan fields | `400 invalid_request` | No plan row write and no realtime event. |
| `status: "main"` or legacy `kind: "main"` | `400 invalid_request` | No plan row write and no realtime event. |
| Unknown `status` or unknown legacy `kind` | `400 invalid_request` | No plan row write and no realtime event. |
| Mismatched `status` and `kind` after mapping | `400 invalid_request` | No plan row write and no realtime event. |
| `expectedVersion`, `patch`, `status`, or `kind` is `null` or the wrong JSON type | `400 invalid_request` | No plan row write and no realtime event. |
| `tripPlanId`/`planVariantId` path id is invalid, non-existent, or from a different trip | Existing not-found/permission policy | No plan row write and no realtime event. |

Version conflict response shape:

```json
{
  "code": "version_conflict",
  "message": "version conflict",
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

Tests assert `409`, `code: "version_conflict"`, and `latest.kind/status`. They
do not assert the exact `message`.

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
  "type": "plan_variant.updated",
  "aggregateType": "plan_variant",
  "aggregateId": "plan-rain",
  "activePlanVariantId": "plan-rain",
  "mainTripPlanId": "plan-rain",
  "tripPlan": {
    "id": "plan-rain",
    "kind": "main",
    "status": "main"
  },
  "previousMainTripPlan": {
    "id": "plan-main",
    "kind": "backup",
    "status": "backup"
  },
  "trip": {
    "id": "trip-1",
    "activePlanVariantId": "plan-rain",
    "mainTripPlanId": "plan-rain"
  }
}
```

Rules:

- During Phase 1, the event wrapper may keep legacy `type:
  "plan_variant.updated"` and `aggregateType: "plan_variant"` while the payload
  carries canonical aliases. Do not introduce a second `trip_plan.updated` event
  for the same mutation in Phase 1.
- A set-main mutation emits one event whose payload includes both the selected
  `tripPlan` and `previousMainTripPlan` when the previous main differs from the
  selected plan. Subscribers that maintain plan lists update both summaries from
  that single event. A no-op set-main on the current Main Plan may omit
  `previousMainTripPlan` or set it to `null`.
- The selected Trip Plan becomes `status: "main"` and compatibility `kind: "main"`.
- The previous Main Plan becomes `backup` by default, or `previousMainNextStatus` if provided.
- `previousMainNextStatus` may be omitted or set to `draft`, `proposal`, or
  `backup`. It cannot be `main`.
- The transaction must not move or rewrite Actual Expenses, Plan Commitments, booking docs, tasks, stop notes, or itinerary items.
- A no-op set-main on the current Main Plan may still refresh that plan status to `main`, but must not demote it first.
- Set-main has no `expectedVersion` in Phase 1. Concurrency is last-writer-wins after row locks, with duplicate `clientMutationId` rejected by the existing mutation guard.
- A later hardening phase may add `expectedTripVersion`; Phase 1 tests should document the current idempotency and last-writer behavior rather than implying stale set-main conflicts.
- A frontend Trip Plan selector must not call this route. This route is used
  only by the explicit set-main command because choosing a plan to inspect,
  edit, import into, or present to a client is not the same as selecting the
  plan for real-world use.

Set-main validation failures:

| Input problem | HTTP/code | Write/event behavior |
| --- | --- | --- |
| `previousMainNextStatus: "main"` | `400 invalid_request` | No trip pointer write, no plan status write, and no realtime event. |
| Unknown `previousMainNextStatus` | `400 invalid_request` | No trip pointer write, no plan status write, and no realtime event. |
| `previousMainNextStatus` is `null` or has the wrong JSON type | `400 invalid_request` | No trip pointer write, no plan status write, and no realtime event. |
| `tripPlanId`/`planVariantId` path id is invalid, non-existent, or from a different trip | Existing not-found/permission policy | No trip pointer write, no plan status write, and no realtime event. |
| Duplicate `clientMutationId` | Existing duplicate mutation error | No second pointer/status write and no duplicate realtime event. |

### Direct Trip Metadata Patch

Route:

```text
PATCH /api/v1/trips/:tripId
```

Allowed Phase 1 metadata patch:

```json
{
  "clientMutationId": "web-trip-meta-1",
  "expectedVersion": 12,
  "name": "Hong Kong client trip",
  "destinationLabel": "Hong Kong"
}
```

Invalid Phase 1 Main Plan pointer patch:

```json
{
  "clientMutationId": "web-trip-pointer-1",
  "expectedVersion": 12,
  "mainTripPlanId": "plan-rain"
}
```

Expected error:

```json
{
  "code": "invalid_request",
  "message": "use set-main to change the Main Plan"
}
```

Rules:

- `PATCH /trips/:tripId` remains a trip metadata route in Phase 1.
- The route must reject canonical `mainTripPlanId` and deprecated
  `activePlanVariantId` pointer mutations with `400 invalid_request`.
- Rejection writes no `trips.active_plan_variant_id`, no plan status repair, no
  version bump, and no realtime event.
- The exact message is not contractual; tests assert `400`, `code:
  "invalid_request"`, unchanged pointer/version, and no event.
- A future route that delegates pointer changes from `PATCH /trips` to
  set-main needs a new `API-*` row and ADR/spec update before code changes.

### Realtime Event Compatibility

Phase 1 keeps legacy event wrappers for plan mutations and adds canonical
fields inside the payload. It does not publish duplicate canonical event types.

Create event wrapper:

```json
{
  "type": "plan_variant.created",
  "aggregateType": "plan_variant",
  "aggregateId": "plan-rain",
  "payload": {
    "id": "plan-rain",
    "tripId": "trip-1",
    "name": "Rain route",
    "kind": "draft",
    "status": "draft",
    "description": "Indoor route",
    "version": 1
  }
}
```

Patch event wrapper:

```json
{
  "type": "plan_variant.updated",
  "aggregateType": "plan_variant",
  "aggregateId": "plan-premium",
  "payload": {
    "id": "plan-premium",
    "tripId": "trip-1",
    "name": "Premium proposal",
    "kind": "split",
    "status": "proposal",
    "description": "Client-facing upgrade option",
    "version": 4
  }
}
```

Rules:

- Create, patch, and set-main all emit one legacy-wrapper event per successful
  mutation.
- Create/patch payloads are Trip Plan summaries with both `kind` and `status`.
- Set-main uses the richer payload documented above because subscribers must
  update the trip pointer, the selected Trip Plan, and the previous Main Plan
  from one event.
- Validation failures, version conflicts, permission failures, and duplicate
  mutation rejections emit no new realtime event.
- When a successful mutation repairs `kind/status` drift as a side effect, the
  single emitted realtime event serializes the post-repair row with coherent
  `kind` and `status`. Phase 1 does not emit a separate repair-only event.

### Backend Itinerary Import Normalizer

Route:

```text
POST /api/v1/trips/:tripId/itinerary-imports
```

Legacy response fragment:

```json
{
  "trip": {
    "id": "trip-1",
    "activePlanVariantId": "plan-main"
  },
  "items": []
}
```

Phase 1 response fragment:

```json
{
  "trip": {
    "id": "trip-1",
    "activePlanVariantId": "plan-main",
    "mainTripPlanId": "plan-main",
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
  },
  "items": [],
  "records": {
    "expenses": [],
    "bookingDocs": [],
    "stopNotes": [],
    "tasks": []
  }
}
```

Rules:

- The normalizer response describes the destination trip context, not a source
  file request to switch the destination Main Plan.
- `trip.mainTripPlanId` mirrors the destination `activePlanVariantId`.
- `trip.tripPlans[]` includes destination Trip Plans with both `status` and
  legacy `kind` so a client can attach normalized rows to the selected Trip Plan.
- `trip.planVariants[]` mirrors `trip.tripPlans[]` in import/export envelopes
  for Phase 1 compatibility. Cockpit responses still use top-level plan lists;
  import/export uses nested lists under `trip`.
- The response does not echo source-file Trip Plan metadata as authoritative
  destination state. If later UI needs source metadata reporting, add a separate
  non-mutating source metadata field instead of overloading `trip`.
- The response preserves normalized hierarchy, path fields, time-window fields,
  and compatibility `records`; it must not flatten sub-activities or synthesize
  Alternative Paths from overlaps.
- The backend import normalizer treats `records` as non-authoritative source
  compatibility payload and must not mutate destination expenses, booking docs,
  stop notes, or tasks while normalizing a file.
- The frontend apply flow may create linked destination records from that
  metadata after the user confirms the import. It must re-scope only records
  linked to imported itinerary item ids, map those links to created destination
  item/record ids, write them into the selected Trip Plan, and leave the Main
  Plan pointer unchanged.

### Plan Check Scope Diff

Routes:

```text
POST /api/v1/trips/:tripId/plan-checks?tripPlanId=:tripPlanId
GET /api/v1/trips/:tripId/plan-checks/latest?tripPlanId=:tripPlanId
```

Legacy request without selected Trip Plan scope:

```text
POST /api/v1/trips/trip-1/plan-checks
GET /api/v1/trips/trip-1/plan-checks/latest
```

Phase 1 selected-workspace request:

```text
POST /api/v1/trips/trip-1/plan-checks?tripPlanId=plan-rain
GET /api/v1/trips/trip-1/plan-checks/latest?tripPlanId=plan-rain
```

Response fragment:

```json
{
  "id": "plan-check-1",
  "tripId": "trip-1",
  "tripPlanId": "plan-rain",
  "status": "ok",
  "suggestions": []
}
```

Rules:

- `tripPlanId` is optional. When omitted, Plan Check behavior remains the
  legacy whole-trip check.
- When present, `tripPlanId` scopes the stored check, stale fingerprint,
  suggestions, run response, and latest response to the selected itinerary
  workspace Trip Plan.
- A supplied `tripPlanId` must belong to the trip. Missing or cross-trip ids
  return the existing invalid/not-found policy and write no Plan Check row.
- Plan Check scoping does not mutate `mainTripPlanId`,
  `activePlanVariantId`, Trip Plan status, itinerary rows, Actual Expenses, or
  Plan Commitments.
- The frontend selector may pass the selected Trip Plan id to Plan Check calls,
  but it must not call set-main as part of Plan Check.

## Migration DDL Draft

Migration files must be safe to run through the existing migrator and must keep
older support scripts working during the compatibility window.

### Migration Status Ledger

| Migration | Phase relationship | Status for Phase 0/1 | Compatibility rule |
| --- | --- | --- | --- |
| `0025_trip_plan_compatibility.sql` | Phase 1 contract | Required migration surface | Keep nullable `plan_variants.status`, keep `kind`, and serialize coherent `kind/status` pairs at the API boundary. |
| `0026_plan_scoped_records.sql` | Phase 2 schema preview already in path | Do not remove or reinterpret in Phase 1 | Keep `trip_plan_id` nullable; set-main must not rewrite existing scoped records. |
| `0027_itinerary_hierarchy_time_windows.sql` | Phase 3 schema preview already in path | Do not remove or flatten in Phase 1 | Preserve hierarchy/time fields in import/export and API mappers even before the hierarchy UI rebuild. |
| `0028_plan_check_trip_plan_scope.sql` | Plan Check sidecar already in path | Preserve as an additive scoped-check surface | Keep `plan_checks.trip_plan_id` nullable; Plan Check scoping is allowed as a sidecar and must not redefine Trip Plan compatibility semantics. |
| `0029_expense_reminder_trip_plan_scope.sql` | Expense reminder scope hardening | Required migration surface | Store reminder history per Trip Plan and keep legacy omitted-`tripPlanId` writes mapped to the current Main Plan. |

### DDL Review IDs

These ids are the migration-review counterpart to the API diff ids. They are
not separate migrations; they name the parts of the shipped DDL that Phase 1
code must respect.

| ID | Migration | Review assertion | Phase 1 behavior unlocked |
| --- | --- | --- | --- |
| `DDL-PLAN-01` | `0025_trip_plan_compatibility.sql` | `plan_variants.status` exists, remains nullable, and is checked against `main/draft/proposal/backup`. | API can emit canonical `status` while legacy raw rows with `NULL` status still load. |
| `DDL-PLAN-02` | `0025_trip_plan_compatibility.sql` | Backfill maps legacy `kind = 'split'` to `status = 'proposal'`; unknown legacy kind falls back to `draft`. | Compatibility readers/writers can use deterministic `kind/status` mapping. |
| `DDL-PLAN-03` | `0025_trip_plan_compatibility.sql` | DB does not enforce a unique `status = 'main'` row and does not enforce `kind/status` agreement. | Service/API repair precedence must use `trips.active_plan_variant_id` as the Main Plan identity. |
| `DDL-RECORD-01` | `0026_plan_scoped_records.sql` | `trip_plan_id` columns on expenses, booking docs, stop notes, and trip tasks remain nullable with same-trip FK validation. | Set-main can prove it does not move records, while Phase 2 still owns strict record behavior. |
| `DDL-RECORD-02` | `0026_plan_scoped_records.sql` | Linked tasks, expenses, and stop notes backfill from their itinerary item plan; unlinked tasks and expenses fall back to the active Main Plan; unlinked stop notes stay nullable; booking docs fall back to the active Main Plan because `0026` has no stronger direct linked-item source. | Later Phase 2 audits can distinguish strong linked scope from inferred compatibility scope and nullable records that still need explicit repair. |
| `DDL-HIER-01` | `0027_itinerary_hierarchy_time_windows.sql` | Parent FK includes `(parent_item_id, trip_id, plan_variant_id, day)` and is immediate, not deferrable. | Phase 1 import/export must preserve hierarchy fields, and Phase 3 service code must use valid update sequences. |
| `DDL-HIER-02` | `0027_itinerary_hierarchy_time_windows.sql` | `end_time` is nullable and `end_offset_days` is non-null `0..7`, but DB does not enforce `end_offset_days = 0` when `end_time IS NULL`. | Phase 3 read/write validation must normalize or reject raw drift before exposing a real Time Window. |
| `DDL-CHECK-01` | `0028_plan_check_trip_plan_scope.sql` | `plan_checks.trip_plan_id` exists as nullable FK to `(plan_variants.id, trip_id)` and is indexed only when present. | Optional Plan Check scoping can coexist with legacy trip-wide checks without changing Main Plan or itinerary import semantics. |
| `DDL-REMINDER-01` | `0029_expense_reminder_trip_plan_scope.sql` | `expense_reminders.trip_plan_id` is non-null, backfilled from the active Main Plan, and participates in the unique reminder key. | Reminder history attaches only to settlement suggestions in the requested Trip Plan; whole-trip reads can still include all reminders. |

The SQL below is therefore both a draft contract and a repository check. If the
real migration differs from the block, update the migration only through a
normal schema-review slice; do not silently change app code to depend on an
undocumented variant.

Repository reconciliation rule: the SQL blocks in this section are expected to
match the checked-in migration files byte-for-byte in intent, but comments and
surrounding explanatory notes may be richer here. If a reviewer finds a
semantic mismatch between this spec and `backend/migrations/0025`-`0029`, stop
the implementation slice and resolve the document or migration through a
separate schema-review commit first.

Operational assumption: the current migrations use normal `ALTER TABLE`,
`VALIDATE CONSTRAINT`, and non-concurrent index creation because current
Sagittarius data volume is small enough for a maintenance-window migration. If
production table sizes grow before this rollout reaches a larger tenant set,
split validation and index creation into a staged migration plan and record that
change in a new ADR before changing the DDL.

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
- The database check only validates the `status` vocabulary. It does not prove
  `kind/status` agreement for raw SQL writes, so application reads must treat
  non-null mismatches as repairable data drift. Phase 1 service writes must
  either reject mismatched inputs or rewrite both fields to the canonical
  mapped pair.
- Do not add a unique partial index for `status = 'main'` until the set-main code transactionally demotes the previous Main Plan and existing data is audited.
- Do not rename or drop `kind` in Phase 1.
- Do not rely on `status = 'main'` for identity. `trips.active_plan_variant_id`
  remains the stored Main Plan pointer and is exposed as `mainTripPlanId`.
- Rollback stance: this migration is additive and forward-only in normal
  environments. Emergency rollback should keep the nullable `status` column in
  place because old binaries ignore it and new binaries need it for aliases.
- If an emergency database downgrade is required, drop
  `plan_variants_status_check` before dropping `plan_variants.status`, then
  repair the migrator's `schema_migrations` state in the same controlled
  operation using the exact filename version recorded by the migrator.
  Otherwise the migrator will treat `0025_trip_plan_compatibility.sql` as
  already applied and will not recreate the column on the next upgrade. No
  Phase 1 uniqueness, routing, or Main Plan identity invariant may depend only
  on this column, so an application rollback remains compatible while `kind` is
  still written.
- Emergency-only downgrade sketch:

  ```sql
  ALTER TABLE plan_variants
    DROP CONSTRAINT IF EXISTS plan_variants_status_check;

  ALTER TABLE plan_variants
    DROP COLUMN IF EXISTS status;

  DELETE FROM schema_migrations
  WHERE version = '0025_trip_plan_compatibility.sql';
  ```

  This is not the normal rollback path. It requires coordinated operator
  approval, a backup, and a follow-up migrator run to prove the migration can be
  recreated.
- Repair stance: if legacy support scripts insert `status = NULL`, read paths
  must derive status from `kind`; the next application write should persist both
  `kind` and `status`.
- Repair stance for non-null mismatches: readers use the stored Main Plan
  pointer for Main Plan identity, expose mapped canonical values consistently at
  the API boundary, and require the next service write to rewrite the
  mismatched plan row to an agreed `kind/status` pair.
- Acceptance uses the real migration path file
  [0025_trip_plan_compatibility.sql](../backend/migrations/0025_trip_plan_compatibility.sql).

### Phase 2 Draft: Plan-scoped Records

This DDL is included here because Phase 0/1 API decisions depend on the boundary. The nullable schema already exists in the migration path; Phase 2 owns the service behavior, repair flows, and stricter validation that make the schema trustworthy.

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
SET trip_plan_id = item.plan_variant_id
FROM itinerary_items item
WHERE task.trip_id = item.trip_id
  AND task.related_item_id = item.id
  AND task.trip_plan_id IS NULL;

UPDATE trip_tasks task
SET trip_plan_id = trips.active_plan_variant_id
FROM trips
WHERE task.trip_id = trips.id
  AND task.related_item_id IS NULL
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

- Existing trip tasks linked through `trip_tasks.related_item_id` are backfilled
  to that itinerary item's Trip Plan. Existing unlinked tasks are backfilled to
  the Main Plan active at migration time.
- Existing Actual Expenses linked to an itinerary item are backfilled to that
  itinerary item's Trip Plan. Existing Actual Expenses without an itinerary link
  are backfilled to the Main Plan active at migration time.
- The unlinked Actual Expense backfill is attribution metadata for
  compatibility, not evidence that the money occurred in that Trip Plan.
  Product and API copy must avoid implying certainty until a user audits,
  moves, cancels, refunds, or duplicates the expense as a Plan Estimate.
- Switching Main Plan after migration must not update existing `trip_plan_id` values.
- Expense summary reads may be scoped with `tripPlanId`; a scoped summary must
  calculate totals, balances, settlement suggestions, and reminder attachment
  from only that Trip Plan's Actual Expenses. Omitting `tripPlanId` remains the
  compatibility whole-trip summary. A supplied `tripPlanId` must belong to the
  trip; missing or cross-trip ids return `400 invalid_request` instead of an
  empty scoped summary.
- Stop notes linked to itinerary items inherit the item's plan. Unlinked stop
  notes remain nullable after `0026`; Phase 2 must repair or reject later
  writes instead of guessing a plan after migration.
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
- Before hardening Actual Expense scope, produce an audit report for unlinked
  expenses that were inferred to the active Main Plan, including expense id,
  trip id, inferred trip plan id, amount, paid-by member, created time, and
  whether a linked itinerary item later provides a stronger scope.
- Backfilling booking docs to the current Main Plan is a compatibility default
  only. `0026` does not have a direct stronger linked-item source for booking
  docs, so linked itinerary items and relation tables remain the stronger
  source for later repair because a booking can be attached to a ticketed
  segment or journey block.
- Until the Phase 2 booking-doc relation audit completes,
  `booking_docs.trip_plan_id` values produced by `0026` are inferred
  compatibility scope only. They prove same-trip FK membership, not same-plan
  relation coherence, and must not be used as proof that linked itinerary
  items, tasks, expenses, or notes are in the same Trip Plan.
- Existing booking docs may already have itinerary-item links through legacy
  trip-scoped relation tables. Because the current `0026` backfill assigns
  booking docs from the active Main Plan when no direct stronger source is
  available, Phase 2 must audit booking docs whose linked itinerary items are in
  a different Trip Plan than the backfilled `booking_docs.trip_plan_id`. That
  audit decides whether to move the booking doc scope, split the booking, or
  require explicit organizer repair; set-main must never rewrite those rows.
- Trips with no stored active Main Plan at migration time keep nullable
  `trip_plan_id` values for unlinked compatibility records. Later writes must
  either repair them using a linked itinerary item or reject the mutation with a
  repairable error instead of guessing a Main Plan after the fact.
- The current migration path already contains
  [0026_plan_scoped_records.sql](../backend/migrations/0026_plan_scoped_records.sql).
  It backfills linked trip tasks and Actual Expenses from the linked itinerary
  item's Trip Plan before falling back unlinked rows to the active Main Plan.
- DB FKs in `0026` prove only that a record belongs to a plan in the same trip.
  Later hardening still needs service checks, triggers, or expanded composite
  FKs for same-plan itinerary item links and booking relation tables.
- Phase 2 is complete only after service tests prove same-plan checks for
  expenses, tasks, stop notes, booking docs, and booking-item relation rows.
  Booking docs are especially compatibility-sensitive because the current
  backfill uses the active Main Plan when no stronger linked item source exists.
- Application rollback across `0026` should keep nullable `trip_plan_id`
  columns in place. Dropping them is a coordinated database downgrade because
  the migrator records the migration as applied.
- Phase 0/1 deliberately does not provide a column-drop downgrade recipe for
  `0026`, `0027`, `0028`, or `0029`. If an operator must remove those additive preview
  columns or constraints, write a separate schema rollback ADR/runbook that
  names drop ordering, data backup, and the exact `schema_migrations` repair for
  the migration filenames being removed.

### Plan Check Scope Sidecar

`0028_plan_check_trip_plan_scope.sql` is already in the migration path and is
not the main Phase 0/1 Trip Plan compatibility contract. It is documented here
because it uses the same Trip Plan FK pattern and must not be confused with
itinerary selection or Main Plan mutation.

```sql
-- 0028_plan_check_trip_plan_scope.sql

ALTER TABLE plan_checks
  ADD COLUMN IF NOT EXISTS trip_plan_id uuid;

ALTER TABLE plan_checks
  DROP CONSTRAINT IF EXISTS plan_checks_trip_plan_fkey;

ALTER TABLE plan_checks
  ADD CONSTRAINT plan_checks_trip_plan_fkey
  FOREIGN KEY (trip_plan_id, trip_id) REFERENCES plan_variants(id, trip_id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX IF NOT EXISTS plan_checks_trip_plan_created_idx
  ON plan_checks (trip_id, trip_plan_id, created_at DESC)
  WHERE trip_plan_id IS NOT NULL;
```

Rules:

- `trip_plan_id` is nullable so legacy trip-wide Plan Checks remain valid.
- Scoped Plan Checks are read/write sidecar data; they do not switch the Main
  Plan and do not imply records or itinerary rows moved between Trip Plans.
- The FK is deferrable because Plan Check writes may be part of broader
  transaction flows, unlike the immediate hierarchy parent FK in `0027`.
- Application rollback should keep the nullable column in place. Dropping it is
  a coordinated database downgrade because the migrator records `0028` as
  applied.

### Expense Reminder Trip Plan Scope

`0029_expense_reminder_trip_plan_scope.sql` is a Phase 2 hardening migration
for reminder history attached to settlement suggestions. The reminder itself is
not paid money, but leaking a reminder timestamp from one Trip Plan to another
makes Actual Expense follow-up look more real than it is.

```sql
-- 0029_expense_reminder_trip_plan_scope.sql

ALTER TABLE expense_reminders
  ADD COLUMN IF NOT EXISTS trip_plan_id uuid;

UPDATE expense_reminders reminder
SET trip_plan_id = trips.active_plan_variant_id
FROM trips
WHERE reminder.trip_id = trips.id
  AND reminder.trip_plan_id IS NULL;

ALTER TABLE expense_reminders
  ALTER COLUMN trip_plan_id SET NOT NULL;

ALTER TABLE expense_reminders
  ADD CONSTRAINT expense_reminders_trip_plan_fkey
  FOREIGN KEY (trip_plan_id, trip_id) REFERENCES plan_variants(id, trip_id) NOT VALID;

ALTER TABLE expense_reminders VALIDATE CONSTRAINT expense_reminders_trip_plan_fkey;

ALTER TABLE expense_reminders
  DROP CONSTRAINT IF EXISTS expense_reminders_trip_id_from_member_id_to_member_id_amount_minor_key;

ALTER TABLE expense_reminders
  ADD CONSTRAINT expense_reminders_trip_plan_pair_key
  UNIQUE (trip_id, trip_plan_id, from_member_id, to_member_id, amount_minor);

CREATE INDEX IF NOT EXISTS expense_reminders_trip_plan_pair_idx
  ON expense_reminders (trip_id, trip_plan_id, from_member_id, to_member_id, amount_minor);
```

Rules:

- Scoped summary reads attach reminder history only from the requested Trip
  Plan.
- Legacy reminder writes without `tripPlanId` map to the current Main Plan for
  compatibility instead of remaining unscoped.
- Whole-trip summary reads may still include all reminders because they are the
  legacy aggregate view.
- Application rollback should keep the non-null column in place. Dropping it
  requires a coordinated downgrade because the unique reminder key changes.

### Phase 3 Draft: Hierarchy And Time Windows

This DDL is already in the migration path, but Phase 0/1 docs name it because
the API contract must not force flat rows or duration-only editing. Phase 3 owns
the hierarchy/time behavior, warnings, and stricter validation.

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

CREATE UNIQUE INDEX IF NOT EXISTS itinerary_items_parent_scope_key
  ON itinerary_items (id, trip_id, plan_variant_id, day);

ALTER TABLE itinerary_items
  ADD CONSTRAINT itinerary_items_parent_scope_fkey
  FOREIGN KEY (parent_item_id, trip_id, plan_variant_id, day)
  REFERENCES itinerary_items(id, trip_id, plan_variant_id, day)
  NOT VALID;

ALTER TABLE itinerary_items
  VALIDATE CONSTRAINT itinerary_items_parent_scope_fkey;

CREATE INDEX IF NOT EXISTS itinerary_items_parent_scope_idx
  ON itinerary_items (trip_id, plan_variant_id, day, parent_item_id)
  WHERE parent_item_id IS NOT NULL AND deleted_at IS NULL;

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
- The `end_offset_days = 0 when end_time is null` invariant is service
  validation until DB hardening adds a matching check constraint.
- Sub-activity bounds and sibling overlaps are warnings in this phase; they do
  not automatically create Alternative Paths.
- Parent/child cross-plan or cross-day moves must be service-validated. The
  parent-scope FK blocks a child from pointing to a parent in another trip,
  Trip Plan, or Plan Day, but it does not enforce maximum depth or detect
  deeper cycles by itself.
- The parent-scope FK in `0027` is immediate, not deferrable. Atomic moves that
  change a parent and its children across day or Trip Plan boundaries must use a
  service repair sequence that keeps every intermediate row valid, temporarily
  detaches children, or introduces a later deferrable constraint migration after
  an explicit schema review. Tests must not assume arbitrary parent/child moves
  can be done in any update order.
- Raw rows with `end_time IS NULL` and `end_offset_days <> 0` are invalid at the
  application boundary even though `0027` only enforces the numeric range. Until
  DB hardening adds a matching check constraint, read/repair tests must prove
  support-script drift is normalized or rejected before it leaks as a real Time
  Window.
- Application rollback across `0027` should keep the additive hierarchy/time
  columns in place. `end_time` remains nullable; `end_offset_days` is non-null
  with default `0`. Dropping these columns is a coordinated database downgrade
  because the migrator records the migration as applied.

## Import/Export Compatibility

Phase 1 import/export must preserve the compatibility aliases and the itinerary
shape even before the UI rewrite.

### Export Trip Envelope Diff

Legacy export fragment:

```json
{
  "trip": {
    "id": "trip-1",
    "activePlanVariantId": "plan-main"
  },
  "items": []
}
```

Phase 1 export fragment:

```json
{
  "trip": {
    "id": "trip-1",
    "activePlanVariantId": "plan-main",
    "mainTripPlanId": "plan-main",
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
    ],
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
    ]
  },
  "items": []
}
```

Import accepts these `trip` envelope variants:

Legacy-only:

```json
{
  "trip": {
    "id": "source-trip",
    "activePlanVariantId": "source-plan"
  }
}
```

Canonical-only:

```json
{
  "trip": {
    "id": "source-trip",
    "mainTripPlanId": "source-plan"
  }
}
```

Mixed:

```json
{
  "trip": {
    "id": "source-trip",
    "activePlanVariantId": "source-plan",
    "mainTripPlanId": "source-plan"
  }
}
```

Missing plan aliases:

```json
{
  "trip": {
    "id": "source-trip"
  }
}
```

Conflicting plan aliases:

```json
{
  "trip": {
    "id": "source-trip",
    "activePlanVariantId": "legacy-plan",
    "mainTripPlanId": "canonical-plan"
  }
}
```

Conflict rule:

- Import parsing does not use source plan ids to select or switch the
  destination Main Plan. When both source-file aliases are present but disagree,
  canonical `mainTripPlanId` wins only for source-file metadata reporting; the
  imported rows still target the destination Trip Plan chosen by the import
  flow.
- Tests assert normalized target rows, preserved item fields, and unchanged
  destination Main Plan. They do not fail import only because the source file's
  two plan aliases disagree.

- Export `trip` metadata includes both `mainTripPlanId` and deprecated
  `activePlanVariantId`.
- Import accepts legacy-only, canonical-only, and mixed `trip` metadata. The current
  trip id and selected destination Trip Plan remain controlled by the import
  flow. Import does not change the destination Main Plan.
- Phase 1's parser and backend contract use top-level
  `trip.activePlanVariantId`, `trip.mainTripPlanId`, both, or neither. A future
  parser may add `metadata.activePlanVariantId` and `metadata.mainTripPlanId`
  only with explicit compatibility tests for that legacy envelope. The
  destination trip id and target Trip Plan still come from the import flow.
- Import does not switch the destination Main Plan just because the file names a
  different `mainTripPlanId`. The imported rows are applied to the current
  target Trip Plan chosen by the import flow.
- Export/import must preserve path fields (`pathGroupId`, `pathId`, `pathName`,
  `pathRole`), hierarchy fields (`parentItemId`, `isPlanBlock`), and time-window
  fields (`endTime`, `endOffsetDays`).
- Import must not flatten sub-activities or convert sibling overlaps into
  Alternative Paths.

## Cost And Commitment Boundary

Phase 0/1 protects the terms needed for later cost planning without creating the
full workflow yet.

- Actual Expenses remain real paid or committed money. Set-main and Trip Plan
  create/patch must not move, relabel, duplicate, or delete them.
- Plan Estimates are not stored as Actual Expenses in Phase 0/1. If an organizer
  wants to compare projected costs, that work waits for the Plan Estimate model
  or uses clearly labeled local-only planning notes outside the Actual Expense
  ledger.
- Plan Commitments are represented only by existing booking/ticket/document
  surfaces in Phase 0/1. A future commitment model may link a commitment to an
  Actual Expense when money is paid, but Phase 0/1 must not infer that link.
- Inline itinerary actions for flight, hotel, train, ferry, bus, or other
  reservations create or link a Plan Commitment draft first. They must not
  create an Actual Expense unless the user explicitly marks money as paid or
  committed in the expense/payment flow.
- Automated booking/ticket classification is advisory. When the system detects
  or guesses the wrong reservation type, provider, or reference, the user must
  be able to correct it from the itinerary context without recreating the
  draft; explicit user corrections win over later inferred values.
- Import/export may preserve plan-scoped records already present in the file,
  but in Phase 1 those `records` are non-authoritative source compatibility
  payload. Import may keep them in preview/apply metadata, but it must not
  insert, update, clone, re-scope, or rewrite destination expenses, booking
  docs, stop notes, tasks, or record `tripPlanId`. Importing a plan must not
  convert estimates into Actual Expenses or treat booking docs as paid unless a
  later Phase 2 flow explicitly creates durable destination records.

## Itinerary Workspace Phase 1 Contract

Phase 1 does not rebuild the hierarchy UI, but it fixes the state contract that
the later inline editor depends on.

- The itinerary workspace has a selected Trip Plan for viewing, editing,
  creating rows, and import target selection.
- The selected Trip Plan defaults to `mainTripPlanId` when available, then
  `activePlanVariantId`, then the first available Trip Plan.
- Changing the selected Trip Plan filters the visible itinerary rows and changes
  the target for new local rows/imported rows, but it does not mutate the Main
  Plan pointer.
- API cockpit load remains a whole-trip compatibility payload in Phase 1. It
  returns records from all visible Trip Plans with `tripPlanId` and linked item
  ids intact; the frontend scopes the itinerary workspace to the selected Trip
  Plan locally, while explicitly scoped endpoints such as expense summary and
  Plan Check receive `tripPlanId` when their response must match the selected
  plan.
- Creating a blank Trip Plan selects the new draft/proposal/backup for editing
  without making it Main.
- The explicit set-main command calls `/trip-plans/:id/set-main` in API mode or
  updates both local pointer aliases in local mode. It also keeps selected plan
  status labels coherent.
- Status editing is allowed for non-main selected plans and disabled for the
  current Main Plan; the Main Plan status changes only through set-main.
- Set-main, selector changes, create, patch, and import do not move Actual
  Expenses or Plan Commitments.
- The hierarchy-ready row model must keep top-level Activities and
  Sub-activities grouped by `parentItemId`; when time fields exist, display
  duration as derived text and show cross-day endings with `+N` as a superscript
  marker such as `02:00+1`.

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
- [domain/capabilities.rs](../backend/crates/sagittarius-api/src/domain/capabilities.rs)
  - Introduce or enforce a Trip Plan management capability that maps to
    owner/organizer roles only; traveler `EditItinerary` must not imply
    create/patch/set-main permission for Trip Plans.
- [api/plan_variants.rs](../backend/crates/sagittarius-api/src/api/plan_variants.rs)
  - Keep legacy handlers.
  - Add canonical handlers returning `TripPlanSummary` aliases.
- [app/plan_variants.rs](../backend/crates/sagittarius-api/src/app/plan_variants.rs)
  - Write both `kind` and `status`.
  - Make set-main transactional.
  - Do not touch plan-scoped records in set-main.
- [db/queries.rs](../backend/crates/sagittarius-api/src/db/queries.rs)
  - Read/write `status`.
  - Normalize status with the repair precedence above while
    `plan_variants.status` stays nullable. Do not expose raw non-null
    `kind/status` mismatches as mismatched response aliases.
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
  - Validate that canonical route responses include `status` before treating
    them as `TripPlanResponse`. Legacy `PlanVariantResponse.status` remains
    optional and maps from `kind` when missing.
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

Rows in this table are Phase 0/1 release-blocking only when they describe the
compatibility contract that Phase 1 owns directly. Rows labelled as schema
guards for Phase 2 or Phase 3 prove that already-applied additive migrations
still match the documented boundary; they do not require Phase 1 to implement
the later service behavior or UI workflows.

For this matrix, "covered" means the named assertion is visible in the test
body, not only implied by a broad snapshot or a helper fixture. If one test
covers multiple rows, keep the assertion names or comments close enough that a
reviewer can map the code back to this table without re-deriving the product
decision. If a row is intentionally deferred, move it to the Phase 2 or Phase 3
preview table in the same commit.

Traceability rule: when implementation starts, add the relevant API/DDL ids
from `API-*` and `DDL-*` to test names, helper comments, or PR notes. A row is
accepted only when the assertion proves the stated behavior, not merely that the
route or component rendered.

Exactness rule: the test matrix is executable acceptance criteria. Each row
must assert the named field values, pointer behavior, route path, validation
code, or preserved database state directly. Broad snapshots, smoke renders, or
"route exists" checks can support a row, but they do not satisfy it unless the
scenario's concrete alias, status, version, hierarchy, or record-scope outcome
is asserted.

Minimum row groups:

| Group id | Covers | Must include |
| --- | --- | --- |
| `TEST-DOC-01` | Phase 0 language and ADR freeze | Glossary/ADR rows for Trip Plan, Main Plan, Actual Expense, compatibility-first rollout. |
| `TEST-SCHEMA-01` | `DDL-PLAN-*`, `DDL-RECORD-*`, `DDL-HIER-*`, `DDL-CHECK-01` | Schema-contract rows for `status`, nullable record scope, parent-scope FK, Plan Check scope, and raw drift boundaries. |
| `TEST-BE-PLAN-01` | `API-CREATE-01`, `API-PATCH-01`, `API-MAIN-01` | Backend plan route rows covering success, validation, conflict, permissions, duplicate mutation, and no record moves. |
| `TEST-BE-READ-01` | `API-LOAD-01`, `API-ACCOUNT-01`, `API-JOIN-01`, `API-IMPORT-01` | Backend cockpit/account/join/import rows covering aliases and pointer-authoritative repair. |
| `TEST-BE-RT-01` | Realtime compatibility for Trip Plan mutations | Create/patch/set-main event wrapper rows with canonical payload aliases. |
| `TEST-BE-CHECK-01` | `API-CHECK-01`, `DDL-CHECK-01` | Plan Check rows covering optional selected Trip Plan scope, omitted legacy whole-trip scope, and no Main Plan mutation. |
| `TEST-FE-MAP-01` | Frontend API compatibility readers | Mixed, legacy-only, canonical-only, and drifted payload mapper rows. |
| `TEST-FE-UI-01` | Itinerary workspace vs Main Plan selection | Local/API mode selector rows proving selector changes edit target while set-main is explicit. |
| `TEST-IMPORT-01` | Import/export compatibility | Envelope, conflicting metadata, target Trip Plan, hierarchy/time preservation, and no Actual Expense cloning rows. |

### Test Scenario ID Ledger

Implementation commits may reference the broad group ids above, but PR review
needs scenario ids too. Use this ledger as the exact acceptance index; each id
must map to at least one assertion in the detailed table below before the
corresponding `API-*` or `DDL-*` row is claimed complete.

| Scenario id | Owner | Required assertion |
| --- | --- | --- |
| `TEST-DOC-ADR-01` | Docs | ADRs and `CONTEXT.md` contain Trip Plan, Main Plan, Plan Status, Actual Expense, compatibility-first rollout, and pre-code contract gate language. |
| `TEST-DOC-API-01` | Docs | API docs show canonical `/trip-plans` routes, retained `/plan-variants` routes, alias pairs, direct trip patch pointer rejection, and optional Plan Check `tripPlanId`. |
| `TEST-DDL-PLAN-01` | Backend schema | `plan_variants.status` exists, is nullable, has the expected vocabulary check, and does not replace pointer-authoritative Main Plan identity. |
| `TEST-DDL-RECORD-01` | Backend schema | Record `trip_plan_id` columns and FKs are nullable same-trip compatibility scope; set-main does not rewrite them. |
| `TEST-DDL-HIER-01` | Backend schema | Hierarchy/time DDL preserves same-trip/same-plan/same-day parent scope and service-owned end-offset drift validation. |
| `TEST-DDL-CHECK-01` | Backend schema | `plan_checks.trip_plan_id` is nullable, same-trip, indexed when present, and does not redefine Main Plan semantics. |
| `TEST-API-LOAD-01` | Backend + frontend | Cockpit load emits or reads `mainTripPlanId/tripPlans/status` and retains `activePlanVariantId/planVariants/kind` without alias drift. |
| `TEST-API-CREATE-01` | Backend + frontend | Canonical and legacy create routes accept blank draft creation, reject unsupported copy/import/source modes, and return coherent `kind/status`. |
| `TEST-API-PATCH-01` | Backend + frontend | Canonical and legacy patch routes require `expectedVersion`, return conflict `latest` with aliases, reject main status and mismatched aliases, and repair drift on writes. |
| `TEST-API-MAIN-01` | Backend + frontend | Set-main changes both pointer aliases only through explicit action, emits one compatibility event, demotes previous Main Plan, and leaves records/items unchanged. |
| `TEST-API-TRIP-PATCH-01` | Backend | Direct `PATCH /trips/:tripId` pointer fields are rejected with no pointer/status/version/event side effect. |
| `TEST-API-READ-01` | Backend | Account trip create, join-session, invite-token-current, and import normalizer responses include canonical aliases where they expose legacy pointers. |
| `TEST-API-RT-01` | Backend realtime | Create/patch/set-main use legacy `plan_variant.*` wrappers with canonical aliases in payloads and no events on failed mutations. |
| `TEST-API-CHECK-01` | Backend + frontend | Plan Check run/latest use selected `tripPlanId` when supplied, preserve legacy whole-trip behavior when omitted, and never call or imply set-main. |
| `TEST-FE-MAP-01` | Frontend | API readers accept canonical-only, legacy-only, and mirrored mixed payloads, but reject divergent mixed aliases as `invalid_response`. |
| `TEST-FE-UI-01` | Frontend | Itinerary Trip Plan selection changes visible/edit/import target only; explicit set-main is separate and permission-gated. |
| `TEST-IMPORT-01` | Backend + frontend | Import/export preserves pointer aliases, plan-list aliases, hierarchy/time/path fields, selected destination Trip Plan, unchanged Main Plan, backend normalizer records as source metadata, and frontend local/API apply flows re-scope linked records into the selected Trip Plan with remapped item/record ids. |
| `TEST-E2E-API-01` | E2E | Real API flow creates, patches, reloads, and sets Main Trip Plan through compatibility paths while asserting aliases and status. |

| Phase | Layer | Test file | Exact scenario |
| --- | --- | --- | --- |
| 0 | Docs | `CONTEXT.md` | Glossary contains Trip Plan, Main Plan, Backup Plan, Plan Status, Actual Expense, Plan Estimate, Plan Commitment. |
| 0 | ADR | `docs/adr/0001-trip-plan-language-over-plan-variants.md` | Records why API language changes before storage rename and where compatibility names may remain. |
| 0 | ADR | `docs/adr/0002-main-plan-is-a-selection.md` | Records that the Main Plan pointer is authoritative over repairable status metadata. |
| 0 | ADR | `docs/adr/0005-compatibility-first-trip-plan-rollout.md` | Records why Trip Plan API compatibility ships before storage rename or itinerary UI rebuild. |
| 1 | API docs | `docs/api-data-spec.md` | Documents canonical `/trip-plans` routes, legacy `/plan-variants` routes, `tripPlans`, `mainTripPlanId`, `status`, retained legacy aliases, owner/organizer-only Manage Trip Plans permission, and direct `PATCH /trips/:tripId` Main Plan pointer rejection. |
| 1 | API docs | `docs/openapi-itinerary-table-v1.yaml` | Defines minimum Phase 1 Trip Plan schemas/routes for `/trip-plans`, legacy `/plan-variants`, `/set-main`, `TripPlanSummary.status/kind`, `TripSummary.mainTripPlanId/activePlanVariantId`, and `TripPatchRequest` pointer rejection wording. |
| 1 | Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | `plan_variants.status` exists and has `main/draft/proposal/backup` check. |
| 1 | Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | Existing `kind = 'split'` rows are backfilled to `status = 'proposal'`. |
| 1 | Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | `plan_variants(id, trip_id)` remains unique so composite FKs from trips, itinerary items, and later plan-scoped records stay valid. |
| 1 | Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | Raw non-null `kind/status` mismatch is documented as app-repairable drift, not a DB invariant; API reads still expose pointer-authoritative Main Plan identity. |
| 1 | Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | The Phase 2 DDL draft backfills `trip_tasks.trip_plan_id` from `trip_tasks.related_item_id -> itinerary_items.plan_variant_id` before falling back only unlinked tasks to the active Main Plan. |
| 1 | Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | The already-applied hierarchy DDL has `itinerary_items_parent_scope_key` and `itinerary_items_parent_scope_fkey` across `(parent_item_id, trip_id, plan_variant_id, day)` so cross-trip, cross-plan, and cross-day parents are blocked at the FK layer. |
| 1 | Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | The Plan Check sidecar DDL has nullable `plan_checks.trip_plan_id`, a deferrable same-trip FK to Trip Plans, and a partial created-at index for scoped checks. |
| 1 | Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | The migration contract documents that `VALIDATE CONSTRAINT` and non-concurrent index creation are acceptable only under the current small-data maintenance-window assumption; large-table rollout requires a staged migration ADR. |
| 1 | Backend route | `backend/crates/sagittarius-api/tests/route_contract.rs` | Canonical `/trip-plans`, `/trip-plans/:id`, and `/trip-plans/:id/set-main` routes exist while legacy `/plan-variants`, `/plan-variants/:id`, and `/plan-variants/:id/publications` routes remain. |
| 1 | Backend serialization | `backend/crates/sagittarius-api/tests/trip_load_contract.rs`, `backend/crates/sagittarius-api/tests/account_trip_contract.rs` | `TripSummary` serializes both `activePlanVariantId` and `mainTripPlanId`; cockpit serializes both `planVariants` and `tripPlans`. |
| 1 | Backend trips API | `backend/crates/sagittarius-api/tests/trip_load_contract.rs` | `PATCH /trips/:tripId` rejects `activePlanVariantId` and `mainTripPlanId` as Main Plan pointer mutations with `400 invalid_request`; set-main is the only Phase 1 Main Plan mutation path. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Canonical create route accepts omitted `creationMode` or `creationMode: "blank"` with `status: "draft"` and returns `kind: "draft"` plus `status: "draft"`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Canonical create with omitted `status` and omitted legacy `kind` defaults to `draft` and returns `kind: "draft"` plus `status: "draft"`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Canonical create route rejects `creationMode: "duplicate-current"` or `"import"` until copy/import semantics are implemented. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Canonical create route rejects `sourceTripPlanId` when `creationMode` is absent or `blank`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Canonical create route rejects `null`, wrong JSON type, invalid UUID, non-existent, and cross-trip `sourceTripPlanId`; no row or event is written. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Create route rejects `status: "main"` and legacy `kind: "main"`; only set-main can select a Main Plan. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Legacy create route accepts `kind: "split"` and returns `status: "proposal"`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Request with conflicting `kind: "draft"` and `status: "proposal"` is rejected. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Unknown `status` and unknown legacy `kind` both return `400 invalid_request` with no row write. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Every Phase 1 validation failure keeps the existing error envelope with `code` and non-empty `message`; tests assert exact `code`, not exact `message` copy. |
| 1 | Backend permissions | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Canonical `/trip-plans` create/patch/set-main routes enforce the same owner/organizer-only mutation capability as legacy routes; traveler/viewer attempts return `403` and write no rows or events. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Patch route requires `expectedVersion`; stale version returns latest plan summary. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Stale patch with a unique `clientMutationId` returns `version_conflict`; duplicate `clientMutationId` returns the duplicate mutation error. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Patch `status: "proposal"` returns compatibility `kind: "split"`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Legacy patch route accepts `kind: "split"` and returns `status: "proposal"`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Legacy patch route rejects conflicting `kind/status` input and writes no row. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Patch rejects `status: "main"` and legacy `kind: "main"`; only set-main can select a Main Plan. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Patch with no plan fields is rejected as an empty mutation. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Patch rejects `null` or wrong JSON types for `expectedVersion`, `patch`, `status`, and `kind`; no row or event is written. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Patch success against a drifted current Main Plan returns `kind: "main"` and `status: "main"` and repairs the stored pair. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Patch version-conflict `latest` for a drifted current Main Plan returns `kind: "main"` and `status: "main"` rather than leaking the raw drifted pair. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | List/load summary for a non-pointer row with raw `status = 'main'` exposes it as repairable `backup` so responses never show two Main Plans. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | List/load summary for a non-pointer row with `status IS NULL` and legacy `kind = 'main'` also exposes it as repairable `backup`; nullable status cannot bypass pointer-authoritative Main Plan identity. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main returns `TripSummary` with `activePlanVariantId`, `mainTripPlanId`, and updated trip `version`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Legacy set-main route returns `TripSummary` with `activePlanVariantId`, `mainTripPlanId`, and updated trip `version`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main updates selected plan status to `main` and previous main status to `backup` by default. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main honors `previousMainNextStatus: "draft" | "proposal" | "backup"` and maps `proposal` back to legacy `kind: "split"`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main rejects `previousMainNextStatus: "main"`. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main rejects `null`, wrong JSON type, invalid, non-existent, and cross-trip target Trip Plan ids according to existing not-found/permission policy; no pointer, status, or event is written. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Reusing the same `clientMutationId` on set-main is rejected by duplicate mutation guard. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Same-plan set-main does not demote the current Main Plan before refreshing selected status. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main does not update expenses, booking docs, stop notes, trip tasks, or itinerary item plan ids. |
| 1 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs`, `backend/crates/sagittarius-api/tests/expenses_contract.rs` | Seed expenses, tasks, notes, and booking docs directly at the database layer with existing nullable `trip_plan_id`; run set-main and assert those columns plus related itinerary links are unchanged. Phase 1 does not require create/patch/defaulting behavior for plan-scoped records. |
| 1 | Backend permissions | `backend/crates/sagittarius-api/tests/permissions_contract.rs`, `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Traveler role may edit itinerary when allowed by existing policy but still receives `403` for legacy and canonical Trip Plan create/patch/set-main. |
| 1 | Backend cockpit | `backend/crates/sagittarius-api/tests/trip_load_contract.rs` | Cockpit response includes `trip.mainTripPlanId`, `trip.activePlanVariantId`, `tripPlans[]`, and `planVariants[]`. |
| 1 | Backend cockpit | `backend/crates/sagittarius-api/tests/trip_load_contract.rs` | If `status = 'main'` disagrees with `trips.active_plan_variant_id`, cockpit still exposes the pointer as `mainTripPlanId`. |
| 1 | Backend cockpit | `backend/crates/sagittarius-api/tests/trip_load_contract.rs` | Raw non-null `kind/status` drift emits a coherent mapped pair according to repair precedence; response aliases never disagree. |
| 1 | Backend realtime | `backend/crates/sagittarius-api/tests/realtime_contract.rs` | Set-main event payload includes `mainTripPlanId`, `activePlanVariantId`, and `tripPlan.status`. |
| 1 | Backend realtime | `backend/crates/sagittarius-api/tests/realtime_contract.rs` | Set-main event payload includes `previousMainTripPlan.kind/status` when set-main demotes a different previous Main Plan. |
| 1 | Backend realtime | `backend/crates/sagittarius-api/tests/realtime_contract.rs` | Set-main event wrapper remains `plan_variant.updated` / `plan_variant` in Phase 1 while the payload includes canonical Trip Plan aliases. |
| 1 | Backend realtime | `backend/crates/sagittarius-api/tests/realtime_contract.rs` | Create event wrapper remains `plan_variant.created` / `plan_variant` and payload includes both `kind` and `status`. |
| 1 | Backend realtime | `backend/crates/sagittarius-api/tests/realtime_contract.rs` | Patch event wrapper remains `plan_variant.updated` / `plan_variant` and payload includes both `kind` and `status`. |
| 1 | Backend auth/account | `backend/crates/sagittarius-api/tests/account_trip_contract.rs` | Account trip create response includes `mainTripPlanId` wherever it already exposes `activePlanVariantId`. |
| 1 | Backend auth/join | `backend/crates/sagittarius-api/tests/join_session_contract.rs` | Join-session and invite-token-current trip summaries include `mainTripPlanId` wherever they already expose `activePlanVariantId`. |
| 1 | Frontend auth/join mapper | `frontend/src/trip/api-client.test.ts`, `frontend/src/components/TripJoinGate.test.tsx` | Join-trip and invite-token-current responses reject mismatched `mainTripPlanId`/`activePlanVariantId` as `invalid_response`; the join gate surfaces the invalid response instead of accepting alias drift. |
| 1 | Backend plan checks | `backend/crates/sagittarius-api/tests/plan_checks_contract.rs` | `API-CHECK-01`: running or reading a scoped Plan Check uses the selected Trip Plan id supplied by the request, not the Main Plan pointer. Omitting `tripPlanId` remains the legacy whole-trip check, and a supplied id must belong to the trip. |
| 1 | Frontend plan checks | `frontend/src/components/SagittariusApp.test.tsx` | `API-CHECK-01`: in API mode, changing the itinerary Trip Plan selector causes subsequent Plan Check run/latest calls to use the selected Trip Plan id without calling set-main. |
| 1 | Backend import | `backend/crates/sagittarius-api/tests/itinerary_import_contract.rs` | Itinerary import normalizer response includes destination `trip.mainTripPlanId`, destination `trip.tripPlans[]` with `status/kind`, hierarchy/time/path fields, and compatibility `records` without switching the destination Main Plan. |
| 1 | Backend import | `backend/crates/sagittarius-api/tests/itinerary_import_contract.rs` | Itinerary import normalizer response includes nested destination `trip.planVariants[]` mirroring `trip.tripPlans[]`; cockpit remains the only Phase 1 surface with top-level plan lists. |
| 1 | Backend import | `backend/crates/sagittarius-api/tests/itinerary_import_contract.rs` | Conflicting source-file `activePlanVariantId` and `mainTripPlanId` do not switch the destination Main Plan and do not get echoed as authoritative destination `trip` state. |
| 1 | Frontend route | `frontend/src/trip/api-contract.test.ts` | Route helpers produce canonical `/trip-plans` paths and keep legacy helpers. |
| 1 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Mixed cockpit payload maps `tripPlans/mainTripPlanId` and legacy fields to consistent `Trip`. |
| 1 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Mixed cockpit payload with divergent `tripPlans[]` and `planVariants[]` identities or versions is rejected as `invalid_response`; the mapper must not silently expose two different plan lists. |
| 1 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Mixed cockpit payload with the same plan id but divergent mapped `kind/status` aliases is rejected as `invalid_response`; repairable drift is resolved within one summary before alias comparison. |
| 1 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Legacy-only cockpit payload maps `status` from `kind` and mirrors `mainTripPlanId`. |
| 1 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Canonical-only cockpit payload with `tripPlans` and no `planVariants` still produces `trip.planVariants` for existing UI callers. |
| 1 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Pointer/status disagreement keeps `trip.mainTripPlanId` as selected and does not infer selection from a `status: "main"` plan. |
| 1 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Canonical create/patch/set-main client methods call `/trip-plans` and `/set-main`. |
| 1 | Frontend mapper | `frontend/src/trip/api-client.test.ts` | Canonical create/patch responses without `status` are rejected or normalized through a documented compatibility path before they are treated as `TripPlanResponse`. |
| 1 | Frontend local mode | `frontend/src/components/SagittariusApp.test.tsx` | Local create/rename/set-main keeps `activePlanVariantId`, `mainTripPlanId`, `planVariants`, and `tripPlans` mirrored. |
| 1 | Frontend local mode | `frontend/src/components/SagittariusApp.test.tsx` | Selecting a draft/proposal/backup Trip Plan changes visible itinerary rows and add/import targets without changing `activePlanVariantId` or `mainTripPlanId`. |
| 1 | Frontend local mode | `frontend/src/components/SagittariusApp.test.tsx` | Creating a blank Trip Plan selects it for editing but leaves the current Main Plan pointer unchanged until set-main is clicked. |
| 1 | Frontend local mode | `frontend/src/components/SagittariusApp.test.tsx` | Explicit set-main on the selected draft changes both `mainTripPlanId` and deprecated `activePlanVariantId`, marks the selected plan main, and demotes the previous main to backup or the requested next status. |
| 1 | Frontend API mode | `frontend/src/components/SagittariusApp.test.tsx` | Itinerary selector does not call `/set-main`; the explicit set-main command calls canonical `/trip-plans/:id/set-main` and reloads/merges version-conflict-safe state. |
| 1 | Frontend UI | `frontend/src/components/SagittariusApp.test.tsx` | Visible selector/copy says Trip Plan, not Trip Sheet. |
| 1 | Frontend table | `frontend/src/components/SmartItineraryTable.test.tsx` | Itinerary Trip Plan selector invokes only `onChangeTripPlan`; set-main has a separate button/action that invokes only `onSetMainTripPlan`. |
| 1 | Frontend table | `frontend/src/components/SmartItineraryTable.test.tsx` | Plan status control is disabled for the selected Main Plan and enabled for selected non-main plans when the role can manage Trip Plans. |
| 1 | Frontend table | `frontend/src/components/SmartItineraryTable.test.tsx` | Viewer/traveler roles cannot create Trip Plans, edit plan status, or set-main from the itinerary table. |
| 1 | Frontend language guard | `frontend/src/project-contract.test.ts` or `frontend/src/i18n/messages.test.ts` | New product copy does not introduce non-compatibility `Plan Variant`, `plan variant`, or Trip Sheet wording. |
| 1 | Import/export | `frontend/src/trip/itinerary-import-export.test.ts` | Transitional export includes top-level `trip.mainTripPlanId` and deprecated `trip.activePlanVariantId`. |
| 1 | Import/export | `frontend/src/trip/itinerary-import-export.test.ts` | Transitional export includes nested `trip.tripPlans[]` and deprecated `trip.planVariants[]`; import rejects divergent nested plan-list aliases as `invalid_response`. |
| 1 | Import/export | `frontend/src/trip/itinerary-import-export.test.ts` | Transitional import accepts top-level `trip` legacy-only, canonical-only, mixed, and missing plan aliases, then applies the current destination trip id and target Trip Plan without flattening path fields or switching Main Plan. |
| 1 | Import/export | `frontend/src/trip/itinerary-import-export.test.ts` | Conflicting top-level source `trip.activePlanVariantId` and `trip.mainTripPlanId` prefer canonical metadata only for source-file reporting and still do not switch the destination Main Plan. |
| 1 | Import/export | `frontend/src/trip/itinerary-import-export.test.ts` | Mixed import metadata with divergent nested `trip.tripPlans[]` and `trip.planVariants[]` mapped `kind/status`, order, identity, or version is rejected as `invalid_response`; import must not silently normalize disagreeing plan-list aliases. |
| 1 | Import/export | `frontend/src/trip/itinerary-import-export.test.ts` | Export/import round trip preserves `parentItemId`, `isPlanBlock`, `endTime`, and `endOffsetDays`. |
| 1 | Import/export | `frontend/src/trip/itinerary-import-export.test.ts`, `frontend/src/components/SagittariusApp.test.tsx`, `frontend/scripts/run-itinerary-import-browser-qa.ts` | Import/export preserves plan-scoped `records` as source metadata; frontend local/API apply creates only records linked to imported item ids, re-scopes them into the selected Trip Plan, remaps created destination ids, shows commitment chips, and leaves Main Plan pointers unchanged. |
| 1 | Import target | `frontend/src/trip/itinerary-paths.test.ts` | Importing into a selected draft/proposal target writes rows to the selected `tripPlanId`, preserves `parentItemId`, and leaves `mainTripPlanId` plus deprecated `activePlanVariantId` unchanged. |
| 1 | Backend import | `backend/crates/sagittarius-api/tests/itinerary_import_contract.rs` | Import preserves hierarchy fields and does not flatten sub-activities; DB-invalid parent scope is rejected or reported without applying. Grandchild depth and cycle policy remain Phase 3 service behavior unless a later Phase 1 import-only validation row is added. |
| 1 | E2E/API | `frontend/src/trip/real-api.e2e.test.ts` | Create blank, patch, reload, and set-main Trip Plan through real API compatibility path and assert `tripPlans`, `mainTripPlanId`, and returned plan `status`. |
| 1 | Phase 2 schema guard | `backend/crates/sagittarius-api/tests/schema_contract.rs` | Seed a trip with nullable `active_plan_variant_id` before the plan-scoped backfill; unlinked records whose migration has no fallback source retain null `trip_plan_id`, while inferred fallback rows are documented as compatibility attribution that later behavior must audit or repair. |
| 1 | Phase 3 guard | `backend/crates/sagittarius-api/tests/schema_contract.rs`, `backend/crates/sagittarius-api/tests/itinerary_patch_contract.rs` | Parent-scope FK behavior is documented and tested: the current `0027` constraint is immediate, so cross-day/cross-plan parent-child moves require a valid service update sequence or a later deferrable migration. |
| 1 | Phase 3 guard | `backend/crates/sagittarius-api/tests/itinerary_patch_contract.rs` | Raw/support drift with `end_time IS NULL` and `end_offset_days > 0` is normalized to `0` or rejected before API responses expose it as a real Time Window. |

Phase 0/1 release evidence must include the exact command for each layer that
was run. If a listed test is split into an existing broader file, the commit
message or PR notes should name the scenario-level assertion that covers it.

Minimum command evidence matrix:

| Layer | Working directory | Command |
| --- | --- | --- |
| Backend schema/contracts | `backend/` | `rtk cargo test -p sagittarius-api --test schema_contract -- --nocapture` |
| Backend Trip Plan API | `backend/` | `rtk cargo test -p sagittarius-api --test plan_variants_contract -- --nocapture` |
| Backend cockpit/account/join/realtime | `backend/` | `rtk cargo test -p sagittarius-api --test trip_load_contract --test account_trip_contract --test join_session_contract --test realtime_contract -- --nocapture` |
| Backend itinerary import | `backend/` | `rtk cargo test -p sagittarius-api --test itinerary_import_contract -- --nocapture` |
| API documentation contract | Repository root | `rtk rg "tripPlans|mainTripPlanId|/trip-plans|activePlanVariantId|planVariants|/plan-variants" docs/api-data-spec.md docs/openapi-itinerary-table-v1.yaml` |
| Frontend API mapping/routes/import-export | `frontend/` | `rtk bun run test src/trip/api-client.test.ts src/trip/api-contract.test.ts src/trip/itinerary-import-export.test.ts` |
| Frontend local UI/table copy | `frontend/` | `rtk bun run test src/components/SagittariusApp.test.tsx src/components/SmartItineraryTable.test.tsx src/project-contract.test.ts` |
| Frontend type safety | `frontend/` | `rtk bun run typecheck` |
| E2E real API compatibility | Repository root | `rtk make frontend-e2e-local` |
| Whole-workspace release claim gate | `/Users/xiivth/.codex/aries` | `rtk python3 scripts/check_all.py` |

### Phase 2 Preview

These are not Phase 0/1 release requirements. They document the next slice so Phase 1 does not block the later model.

| Phase | Layer | Test file | Exact scenario |
| --- | --- | --- | --- |
| 2 | Backend schema | `backend/crates/sagittarius-api/tests/schema_contract.rs` | `trip_plan_id` exists on expenses, booking docs, trip tasks, and stop notes with composite FK to `plan_variants(id, trip_id)`. |
| 2 | Backend API | `backend/crates/sagittarius-api/tests/plan_variants_contract.rs` | Set-main leaves existing Actual Expense `trip_plan_id` unchanged when Phase 2 schema is present. |
| 2 | Backend API | `backend/crates/sagittarius-api/tests/tasks_contract.rs`, `stop_notes_contract.rs`, `bookings_contract.rs` | Create flows default `trip_plan_id` from linked itinerary item plan, otherwise current Main Plan. |
| 2 | Backend API | `backend/crates/sagittarius-api/tests/tasks_contract.rs`, `stop_notes_contract.rs`, `bookings_contract.rs` | Linked itinerary item mismatch is rejected when record `trip_plan_id` differs from item `plan_variant_id`. |
| 2 | Backend API | `backend/crates/sagittarius-api/tests/tasks_contract.rs`, `stop_notes_contract.rs`, `bookings_contract.rs`, new `backend/crates/sagittarius-api/tests/expenses_contract.rs` | Patch/relink flows recompute or reject plan scope when the linked itinerary item changes. |
| 2 | Backend API | `backend/crates/sagittarius-api/tests/bookings_contract.rs` | Booking-item relation rows cannot link a booking doc to itinerary items from a different Trip Plan unless a future explicit cross-plan relation type exists. |
| 2 | Backend API | `backend/crates/sagittarius-api/tests/bookings_contract.rs` | Booking create/patch rejects cross-plan related itinerary items, tasks, expenses, and stop notes because `0026` proves same-trip FK membership, not same-plan relation coherence. |
| 2 | Backend API/import | `backend/crates/sagittarius-api/tests/bookings_contract.rs`, `frontend/src/trip/itinerary-import-export.test.ts` | Trip Plan copy/import semantics choose explicitly per booking or document relation: clone a draft, preserve a reference, or reject; Actual Expenses are never cloned as paid money by default. |
| 2 | Backend audit | `backend/crates/sagittarius-api/tests/schema_contract.rs`, `backend/crates/sagittarius-api/tests/bookings_contract.rs` | Seed a booking doc linked to a non-main-plan itinerary item but backfilled to the active Main Plan; assert the chosen Phase 2 audit artifact detects it and set-main does not rewrite its `trip_plan_id`. |
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
| 3 | Backend import | `backend/crates/sagittarius-api/tests/itinerary_import_contract.rs` | Import rejects or reports grandchild nesting and parent cycles according to the Phase 3 service hierarchy policy instead of flattening the hierarchy. |
| 3 | Backend API | `backend/crates/sagittarius-api/tests/itinerary_patch_contract.rs` | Child path fields inherit from or must match parent path fields; child-only Alternative Path is rejected. |
| 3 | Backend API | `backend/crates/sagittarius-api/tests/itinerary_patch_contract.rs` | `endOffsetDays` outside `0..7` is rejected and `endOffsetDays` with null `endTime` is normalized to `0` or rejected according to service rule until DB hardening adds the same invariant. |
| 3 | Frontend table | `frontend/src/components/SmartItineraryTable.test.tsx` | Time display shows next-day end as a superscript-like `+1` after the end time. |
| 3 | Frontend table | `frontend/src/components/SmartItineraryTable.test.tsx` | Sibling overlap and child-outside-parent render warnings without creating Alternative Paths. |

## Rollout Order

1. Phase 0: update glossary and ADRs.
2. Confirm `plan_variants.status` migration and model/query fields.
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

- Phase 2: use the already-applied nullable plan-scoped record columns to harden create/patch defaults, same-plan service checks, and repair behavior for expenses, tasks, stop notes, booking docs, and booking-item relation rows.
- Phase 3: use the already-applied hierarchy/time columns to harden Plan Day -> Activity -> Sub-activity behavior, Time Windows, and cross-day end display.
- Phase 4: sibling overlaps remain warnings only; legacy overlap-generated path
  compatibility data is either migrated, deleted, or explicitly converted by an
  organizer, and Alternative Path changes happen through explicit organizer
  actions. Add ADR coverage before implementing that migration.
- Phase 5: keep the itinerary page as the primary planning surface and use booking/ticket pages for detail editing.
