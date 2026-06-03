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
make frontend-e2e-local PSQL='docker exec -i sagittarius-test-postgres psql'
make frontend-e2e-auth-browser PSQL='docker exec -i sagittarius-test-postgres psql'
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
bun run test
```

Then run browser/core journeys against real API:

Use the `make frontend-e2e-local` and `make frontend-e2e-auth-browser`
commands above.

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

## Local Docker Verification

On 2026-06-03, local verification passed with a Docker Postgres container:

```bash
docker run --name sagittarius-test-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=sagittarius_test \
  -p 127.0.0.1:5432:5432 \
  -d postgres:17-alpine
```

If the container already exists, start it and check readiness:

```bash
docker start sagittarius-test-postgres
docker exec sagittarius-test-postgres pg_isready -U postgres -d sagittarius_test
```

Use `PSQL='docker exec -i sagittarius-test-postgres psql'` when running local
e2e commands because this machine does not have host `psql` in `PATH`.
