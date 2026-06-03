# Test/Staging Verification Runbook

Purpose: move Sagittarius from demo behavior to test/staging-ready API mode with
real write flows.

## Environment

Use separate database/API/frontend settings for test or staging.

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test
SAGITTARIUS_BIND_ADDR=127.0.0.1:5181
NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=http://127.0.0.1:5181
```

Never point `seed_e2e` at a production database. The seed command refuses URLs
that do not contain `sagittarius_test`.

## Seed And Cleanup

Reset test data and seed a known trip:

```bash
cd frontend
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test \
bun run ../backend/target/debug/seed_e2e
```

Preferred local full-stack command:

```bash
make frontend-e2e-local
```

The seed includes:

- trip join code `HK-SZ-2025`
- trip password `dim-sum-run`
- owner/organizer/traveler/viewer members
- itinerary item, shared/private tasks, stop note, and expense record

## Verification Gates

Run these before staging sign-off:

```bash
cd backend
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test \
cargo test -p sagittarius-api

cd ../frontend
bun run typecheck
bun run test src/trip/api-client.test.ts src/components/SagittariusApp.test.tsx src/components/TripJoinGate.test.tsx
```

Then run browser/core journeys against real API:

```bash
make frontend-e2e-local
```

Required journeys:

- create/reorder/delete itinerary
- manage members: create, role, access status, password, reset claim
- manage expenses: create, update, delete, summary reload
- create/update/delete stop note
- permission blocked path for viewer/traveler where applicable

## Security QA

Follow `/Users/xiivth/.codex/REAL_SYSTEM_QA.md` before production sign-off.
Minimum evidence:

- auth/session required on every write route
- trip membership boundary for every client-supplied ID
- owner/organizer/traveler/viewer RBAC paths
- disabled member cannot keep using revoked sessions
- realtime write event includes actor where `clientMutationId` exists

## Current Local Blocker

On this machine, DB integration tests currently cannot complete because
`psql` is not in `PATH` and Postgres at `127.0.0.1:5432` times out. Backend
compile/unit checks pass, but real DB verification needs local Postgres or a
containerized test database.
