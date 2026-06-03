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
make production-readiness-local PSQL='docker exec -i sagittarius-test-postgres psql'
make staging-preflight PSQL='docker exec -i sagittarius-test-postgres psql'
make verify PSQL='docker exec -i sagittarius-test-postgres psql'
make frontend-e2e-local PSQL='docker exec -i sagittarius-test-postgres psql'
make frontend-e2e-auth-browser PSQL='docker exec -i sagittarius-test-postgres psql'
make api-trace-smoke PSQL='docker exec -i sagittarius-test-postgres psql'
make perf-smoke PSQL='docker exec -i sagittarius-test-postgres psql'
make db-rollback-stop-notes-test PSQL='docker exec -i sagittarius-test-postgres psql'
```

The seed includes:

- trip join code `HK-SZ-2025`
- trip password `dim-sum-run`
- owner/organizer/traveler/viewer members
- itinerary item, shared/private tasks, stop note, and expense record

## Verification Gates

Run these before staging sign-off:

```bash
make production-readiness-local PSQL='docker exec -i sagittarius-test-postgres psql'
SAGITTARIUS_REQUIRE_PREFLIGHT_API_CHECK=1 \
make staging-preflight PSQL='docker exec -i sagittarius-test-postgres psql'
```

Probe staging API runtime before browser sign-off:

- `GET /api/v1/health` returns `200 ok` without requiring auth.
- `GET /api/v1/readiness` returns `200 {"status":"ready"}` only when the API can
  query the staging database.
- Set `SAGITTARIUS_REQUIRE_PREFLIGHT_API_CHECK=1` for real staging so the
  preflight script fails when either probe is unhealthy.

Then run browser/core journeys against real API:

Use the `make frontend-e2e-local` and `make frontend-e2e-auth-browser`
commands above.

Required journeys:

- create/reorder/delete itinerary
- create/patch/publish plan variants
- manage members: create, role, access status, password, reset claim
- manage expenses: create, update, delete, summary reload
- create/update/delete stop note
- permission blocked path for viewer/traveler where applicable

After staging verification, run the sign-off evidence check with the real
environment, owner, and evidence URLs:

```bash
SAGITTARIUS_STAGING_PREFLIGHT_PASSED=1 \
SAGITTARIUS_STAGING_BROWSER_SIGNOFF=1 \
SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED=1 \
SAGITTARIUS_STAGING_ROLLBACK_VERIFIED=1 \
SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED=1 \
SAGITTARIUS_STAGING_NO_P1_P2=1 \
SAGITTARIUS_STAGING_ENVIRONMENT=staging \
SAGITTARIUS_STAGING_API_BASE_URL=https://api.staging.example.test \
SAGITTARIUS_STAGING_FRONTEND_URL=https://staging.example.test \
SAGITTARIUS_STAGING_EVIDENCE_URL=https://ci.example.test/runs/123 \
SAGITTARIUS_STAGING_ALERT_EVIDENCE_URL=https://alerts.example.test/incidents/sagittarius-write-routes \
SAGITTARIUS_FEATURE_OWNER="Feature Owner" \
SAGITTARIUS_ROLLBACK_OWNER="Rollback Owner" \
make staging-signoff-check
```

The sign-off check rejects localhost/non-HTTPS staging URLs, production
environment names, and placeholder owners like `TBD`.
It also requires a separate alert evidence URL so write-operation alert routing
is auditable.

Perf smoke:

- `make perf-smoke PSQL='docker exec -i sagittarius-test-postgres psql'`
  starts a real seeded API and checks concurrent cockpit/member/expense-summary
  reads against `SAGITTARIUS_PERF_SMOKE_MAX_P95_MS`.

## Security QA

Follow `/Users/xiivth/.codex/REAL_SYSTEM_QA.md` before production sign-off.
Minimum evidence:

- auth/session required on every write route
- trip membership boundary for every client-supplied ID
- owner/organizer/traveler/viewer RBAC paths
- disabled member cannot keep using revoked sessions
- realtime write event includes actor where `clientMutationId` exists

Local security evidence:

- `members_contract_disabling_member_revokes_existing_session` verifies owner
  disable, session revocation, stale-token read rejection, and stale-token write
  rejection.

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
verify/e2e commands because this machine does not have host `psql` in `PATH`.
The Makefile supports that Docker-backed `PSQL` command.

Latest local evidence on 2026-06-03:

- `make production-readiness-local PSQL='docker exec -i sagittarius-test-postgres psql'` passed.
- `make staging-preflight PSQL='docker exec -i sagittarius-test-postgres psql'` passed.
- `make verify PSQL='docker exec -i sagittarius-test-postgres psql'` passed.
- `make frontend-e2e-local PSQL='docker exec -i sagittarius-test-postgres psql'` passed.
- `make frontend-e2e-auth-browser PSQL='docker exec -i sagittarius-test-postgres psql'` passed.
- `make api-trace-smoke PSQL='docker exec -i sagittarius-test-postgres psql'` passed.
- `make perf-smoke PSQL='docker exec -i sagittarius-test-postgres psql'` passed.
