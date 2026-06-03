# Production Readiness Wave Tracker

Generated on: 2026-06-03

This file is the ticket list for moving from demo mode to API-mode-ready production.
Owner/estimate/acceptance criteria are filled so each task can be planned and
tracked per-wave.

## Assumptions

- Keep current auth model (`TripMemberRole` + `TripMemberAccessStatus`) unchanged.
- No schema redesign outside `docs/api-data-spec.md`.
- API-mode is the required production mode: write flows must hit backend APIs.
- Backend DB model uses incremental migrations with `IF NOT EXISTS` guard where
  practical.

## Wave 1 - Gap + Alignment

### Spec vs implementation matrix

Source of truth: `docs/api-data-spec.md`, plus the product requirement in this
wave plan for stop notes. Current implementation was audited against
`backend/crates/sagittarius-api/src/api/mod.rs`,
`backend/crates/sagittarius-api/src/app/*`, and frontend API-mode wiring in
`frontend/src/trip/*` + `frontend/src/app/SagittariusApp.tsx`.

| Area | Contract / route | Backend status | Frontend API-mode status | Ticket |
| --- | --- | --- | --- | --- |
| Trip load | `GET /api/v1/trips/:tripId` | Partial: trip/members/variants/itinerary/suggestions/tasks/expense summary | Partial: reads cockpit, stop notes hardcoded empty | W2-API-008, W3-FE-001 |
| Trip metadata | `PATCH /api/v1/trips/:tripId` | Missing | Missing | Future gap |
| Plan variants | `POST/PATCH/PUBLISH /plan-variants` | Missing | Missing | Future gap |
| Itinerary create | `POST /api/v1/trips/:tripId/itinerary-items` | Missing | Local/demo only | W2-API-003, W3-FE-005 |
| Itinerary patch | `PATCH /api/v1/trips/:tripId/itinerary-items/:itemId` | Implemented | Implemented | Existing |
| Itinerary delete | `DELETE /api/v1/trips/:tripId/itinerary-items/:itemId` | Missing | Local/demo only | W2-API-004, W3-FE-005 |
| Itinerary reorder | `PATCH /api/v1/trips/:tripId/itinerary-items/order` | Missing | Local/demo only | W2-API-005, W3-FE-005 |
| Suggestions | `POST/PATCH /suggestions` | Implemented | Implemented | Existing |
| Tasks | `POST/PATCH /tasks` | Implemented extension beyond spec | Implemented | Existing |
| Expenses summary | `GET /api/v1/trips/:tripId/expenses/summary` | Partial: summary included in cockpit only | Partial: cockpit only | W2-API-006, W3-FE-001 |
| Expense create/update/delete | `POST/PATCH/DELETE /expenses` | Missing | Local/demo only | W2-API-006, W3-FE-001 |
| Join/session claim flow | join sessions + member sessions + logout | Implemented | Implemented | Existing |
| Member list | `GET /api/v1/trips/:tripId/members` | Partial: included in cockpit only | Partial: cockpit only | W2-API-007, W3-FE-001 |
| Member create/update | `POST/PATCH /members` | Missing | Local/demo only | W2-API-007, W3-FE-004 |
| Member claim reset | `POST /members/:memberId/claim-resets` | Missing | Local/demo only | W2-API-007, W3-FE-004 |
| Member account link | `POST /members/:memberId/account-links` | Implemented | Implemented | Existing |
| Ownership transfer | `POST /ownership-transfers` | Implemented | Not wired in trip cockpit UI | Existing backend / future FE |
| Stop notes | Product requirement from wave plan | Missing DB/API/domain | Local/demo only | W2-DB-001, W2-DB-002, W2-API-001, W2-API-002, W3-FE-006 |
| Presence | `POST /presence` | Missing | Missing | Future gap |

### Permission scope baseline

| Capability | Owner | Organizer | Traveler | Viewer | Applies to |
| --- | --- | --- | --- | --- | --- |
| View trip plan | Yes | Yes | Yes | Yes | trip load, itinerary read, suggestions read |
| Edit itinerary directly | Yes | Yes | No | No | itinerary create/patch/delete/reorder, stop-note manage when tied to itinerary |
| Create suggestions | Yes | Yes | Yes | No | suggestion create |
| Review suggestions | Yes | Yes | No | No | suggestion approve/reject |
| View expense summary | Yes | Yes | Yes | No | expense summary read |
| Edit expenses | Yes | Yes | No | No | expense create/update/delete |
| Manage participants | Yes | Yes | No | No | member create/update/reset claim |

### Baseline test targets

- Backend contract tests should cover every route in the matrix as either
  implemented or intentionally missing with a ticket reference.
- Backend integration tests for W2 should verify success, unauthenticated,
  forbidden role, cross-trip object access, duplicate `clientMutationId`, and
  optimistic version conflict where versioned.
- Frontend tests for W3 should replace API-mode read-only expectations with
  success-path API writes and error mapping.
- Real-system QA for W4 should use a migrated local database, seeded trip,
  real API server, browser journey, console/network checks, reload check, and
  at least one mobile viewport.

### W1-GAP-001: Spec vs implementation matrix
- **Owner**: Backend
- **Estimate**: 2h
- **Acceptance criteria**:
  - Every endpoint in `docs/api-data-spec.md` is marked with backend/frontend status.
  - Missing features are recorded as tickets in this tracker with a concrete owner.
  - A short matrix (`implemented / partial / missing`) is committed.
- **Status**: ✅ done (ticket created from current audit)

### W1-GAP-002: Confirm contract + permission scope
- **Owner**: Backend
- **Estimate**: 2h
- **Acceptance criteria**:
  - `member`, `itinerary`, `expense`, `stop-note` capability paths are mapped.
  - RBAC checks are consistent with `role` matrix in `api-data-spec.md`.
  - Frontend `canTripRole` map is aligned and documented.
- **Status**: ✅ done (alignment identified for owner/organizer/traveler/viewer capabilities)

### W1-GAP-003: Baseline test plan for missing endpoints
- **Owner**: QA
- **Estimate**: 1.5h
- **Acceptance criteria**:
  - `schema_contract` + API endpoint contract tests cover all endpoints listed in spec.
  - Missing endpoints are listed as W2+ tickets with clear request/response examples.
  - Failing tests are expected and tracked, not fixed by skipping.
- **Status**: ✅ done (baseline list created below)

## Wave 2 - Backend + DB foundation (backend-first)

Wave status: backend implementation added on `codex/production-readiness-waves`.
Compile/unit verification is green. DB integration verification is blocked in
the current local environment because `psql` is not in `PATH` and
`DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test`
times out connecting to Postgres.

### W2-DB-001: Stop-note migration + schema constraints
- **Owner**: Backend
- **Estimate**: 1.5h
- **Acceptance criteria**:
  - `stop_notes` table exists with `trip_id`, `itinerary_item_id`, `author_id`,
    `body`, `created_at`, `deleted_at`.
  - Foreign keys point to `trips`, `itinerary_items`, `trip_members`.
  - Read index exists for trip-scoped retrieval.
  - Migration tests validate table/index presence.
- **Status**: Implemented; DB integration run blocked by local Postgres setup.

### W2-DB-002: Stop-note repo/domain service model
- **Owner**: Backend
- **Estimate**: 2h
- **Acceptance criteria**:
  - DB model + query for listing stop notes by trip implemented.
  - Domain type for `StopNoteSummary` added.
  - Cockpit mapper can include stop notes list.
- **Status**: Implemented; compile verified.

### W2-API-001: POST `/trips/:tripId/stop-notes`
- **Owner**: Backend
- **Estimate**: 3h
- **Acceptance criteria**:
  - Input validation for `itineraryItemId` and non-empty body.
  - Author is the active session member.
  - Conflict on duplicate mutation id in same trip/member.
  - Realtime `stop_note.created` event emitted on success.
- **Status**: Implemented; contract test added, DB run blocked by local Postgres setup.

### W2-API-002: PATCH/DELETE `/trips/:tripId/stop-notes/:noteId`
- **Owner**: Backend
- **Estimate**: 3h
- **Acceptance criteria**:
  - PATCH updates body with optimistic version check.
  - DELETE soft-deletes row and emits event.
  - Cross-trip note access returns not found.
- **Status**: Implemented; contract test added, DB run blocked by local Postgres setup.

### W2-API-003: POST `/trips/:tripId/itinerary-items`
- **Owner**: Backend
- **Estimate**: 3h
- **Acceptance criteria**:
  - New route exists and writes item.
  - Returns created row + version.
  - DB version increments + realtime event.
- **Status**: Implemented; compile verified.

### W2-API-004: DELETE `/trips/:tripId/itinerary-items/:itemId`
- **Owner**: Backend
- **Estimate**: 2h
- **Acceptance criteria**:
  - Soft-deletion only.
  - Cannot delete unknown item or cross-trip item.
- **Status**: Implemented; compile verified.

### W2-API-005: PATCH `/trips/:tripId/itinerary-items/order`
- **Owner**: Backend
- **Estimate**: 4h
- **Acceptance criteria**:
  - Single transaction reorder for one day/plan variant.
  - Sort orders are deterministic and contiguous by step.
  - Emits one `itinerary_items.reordered` event.
- **Status**: Implemented; compile verified.

### W2-API-006: Expense CRUD endpoints
- **Owner**: Backend
- **Estimate**: 6h
- **Acceptance criteria**:
  - POST/PATCH/DELETE implemented with version checks.
  - Owner/organizer only.
  - `expense_summary` updates automatically on reload.
- **Status**: Implemented; compile verified.

### W2-API-007: Member ops endpoints
- **Owner**: Backend
- **Estimate**: 4h
- **Acceptance criteria**:
  - `POST /trips/:tripId/members`
  - `PATCH /trips/:tripId/members/:memberId`
  - `POST /trips/:tripId/members/:memberId/claim-resets`
  - Access checks for `managePeople` capability.
- **Status**: Implemented; compile verified.

### W2-API-008: Include stop-notes & core entities in cockpit payload
- **Owner**: Backend
- **Estimate**: 2h
- **Acceptance criteria**:
  - `GET /trips/:tripId` returns `stopNotes` array in `TripCockpit`.
  - Expenses and suggestions behavior unchanged.
  - API tests updated to assert new payload shape.
- **Status**: Implemented; trip-load contract assertion added, DB run blocked by local Postgres setup.

## Wave 3 – Frontend API Client + Wiring

### W3-FE-001: Expand `TripApiClient` methods
- **Owner**: Frontend
- **Estimate**: 3h

### W3-FE-002: Sync `api-routes` constants
- **Owner**: Frontend
- **Estimate**: 1h

### W3-FE-003: Enable write UI by capability in API mode
- **Owner**: Frontend
- **Estimate**: 2h

### W3-FE-004: Wire member management write handlers
- **Owner**: Frontend
- **Estimate**: 3h

### W3-FE-005: Wire itinerary create/delete/reorder to API
- **Owner**: Frontend
- **Estimate**: 4h

### W3-FE-006: Wire stop-note create/delete persistence
- **Owner**: Frontend
- **Estimate**: 3h

### W3-FE-007: Update API-mode tests to success-path
- **Owner**: Frontend
- **Estimate**: 2h

## Wave 4 – Test/Staging Verification

### W4-TEST-001: Test/staging config split
- **Owner**: DevOps
- **Estimate**: 2h

### W4-TEST-002: Seed + cleanup script
- **Owner**: Backend
- **Estimate**: 2h

### W4-TEST-003: API contract + schema validation
- **Owner**: QA
- **Estimate**: 3h

### W4-TEST-004: Playwright/Cypress journey smoke
- **Owner**: QA
- **Estimate**: 6h

### W4-TEST-005: Security checklist
- **Owner**: Security
- **Estimate**: 2h

### W4-TEST-006: Perf smoke + retry/idempotency checks
- **Owner**: Backend
- **Estimate**: 3h

## Wave 5 – Production Readiness Freeze

### W5-PROD-001: Logging + alerting for writes
- **Owner**: SRE
- **Estimate**: 4h

### W5-PROD-002: Rollback plan + migration rollback verification
- **Owner**: Backend
- **Estimate**: 2h

### W5-PROD-003: Update production-ready docs
- **Owner**: Docs
- **Estimate**: 1h

### W5-PROD-004: Security/a11y/browser final sweep
- **Owner**: QA
- **Estimate**: 3h

## Wave 2 issue list (current gap snapshot)

- `POST /trips/:tripId/itinerary-items`
- `PATCH /trips/:tripId/itinerary-items/:itemId`
- `DELETE /trips/:tripId/itinerary-items/:itemId`
- `PATCH /trips/:tripId/itinerary-items/order`
- `POST /trips/:tripId/expenses`
- `PATCH /trips/:tripId/expenses/:expenseId`
- `DELETE /trips/:tripId/expenses/:expenseId`
- `POST /trips/:tripId/members`
- `PATCH /trips/:tripId/members/:memberId`
- `POST /trips/:tripId/members/:memberId/claim-resets`
- `GET /trips/:tripId/members`
- `GET /trips/:tripId/expenses/summary`
