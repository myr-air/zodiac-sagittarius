# Production Freeze Checklist

Use this checklist after Wave 4 real-system verification passes in the release
verification environment. That may be a persistent staging runtime or named
production-preflight evidence when the project is running local/dev plus
production only.

## Preflight

- Run staging preflight before e2e or rollback checks:

```bash
SAGITTARIUS_REQUIRE_PREFLIGHT_API_CHECK=1 \
make staging-preflight PSQL='docker exec -i sagittarius-test-postgres psql'
```

## Logging And Alerts

- Run API with `RUST_LOG=info,tower_http=info,sagittarius_api=info`.
- Configure the deploy platform to use `/api/v1/health` for liveness and
  `/api/v1/readiness` for traffic readiness.
- Confirm `/api/v1/readiness` returns `200 {"status":"ready"}` only after the
  API can query the database.
- Confirm write requests emit `INFO` HTTP trace spans with status and latency.
- Route 4xx/5xx write-operation logs to the release verification alert sink
  before production.
- Alert on repeated `401`, `403`, `409`, and `500` spikes for:
  - trip metadata routes
  - plan variant routes
  - itinerary write routes
  - presence and task routes
  - stop-note routes
  - expense routes
  - member management routes

Local trace smoke:

```bash
make api-trace-smoke PSQL='docker exec -i sagittarius-test-postgres psql'
```

## Rollback

Latest migration in this repo is currently
`0018_auth_attempt_locks.sql`. Release verification must prove the database can
move from a fresh or current baseline through every migration up to the latest
file before production opens.

Rollback evidence must include:

- application rollback: deploy the previous app image and confirm the old
  cockpit still loads against the migrated database.
- migration-specific rollback plan: document the exact recovery path for every
  destructive or non-additive migration in the release. Current migrations are
  plain SQL files, and production database rollback is not automatic.
- shared DB migration run evidence: capture the command output or CI evidence
  for applying all required SQL migrations to the shared database.

For the Docker/Cloudflare production path, the migration evidence should show:

```bash
make container-production-migrate PRODUCTION_ENV_FILE=.env.production
```

This command runs the Dockerized `sagittarius-migrate` runner. The runner applies
pending SQL files, records them in `schema_migrations`, and rejects edited
historical migrations by checksum mismatch. The production env file must include
`MIGRATION_DATABASE_URL` for an owner-capable migration role; the app runtime
`DATABASE_URL` can remain least-privileged.

If the shared DB was already migrated before the ledger existed, capture
evidence for the one-time baseline command instead:

```bash
make container-production-migrate-baseline PRODUCTION_ENV_FILE=.env.production
```

Only use the baseline command after confirming the shared DB is already current
through the latest migration file. Do not use it for a fresh database.

## Security And Access

- Run the checks in `/Users/xiivth/.codex/REAL_SYSTEM_QA.md`.
- Verify every write route rejects missing/invalid bearer tokens.
- Verify cross-trip IDs return `404` rather than mutating another trip.
- Verify viewer cannot create stop notes, mutate itinerary, edit expenses, or manage members.
- Verify viewer cannot create, patch, or publish plan variants.
- Verify traveler can create stop notes/suggestions but cannot directly edit itinerary, plan variants, expenses, or members.
- Verify disabled members lose active sessions.

## Browser And Accessibility

- Desktop and mobile viewport smoke on:
  - overview
  - itinerary
  - members
  - account access/join flow
- Browser console has no runtime errors.
- Network panel has no failed write calls on success paths.
- Reload after each write shows persisted backend state.
- Keyboard and screen-reader labels remain present for member and stop-note controls.

## Docker And Cloudflare

For the self-hosted `zodiac` network deploy, follow
`docs/production-docker-cloudflare.md`. The production app is published through
the existing Cloudflare Tunnel at `sagittarius.13thx.com`.

The production compose stack creates only `sagittarius-server` and
`sagittarius-web`; `sagittarius-server` exposes the `sagittarius-api` network
alias. The shared database is provided by the existing `zodiac` network and is
not created by this stack.

## Ship Gate

Production can open only when:

- release DB migration evidence is verified
- shared production DB migration run evidence exists for
  `make container-production-migrate PRODUCTION_ENV_FILE=.env.production`, or
  one-time baseline evidence plus a normal migration check when adopting an
  already-current shared DB
- backend integration and frontend targeted tests pass
- production container images build successfully with
  `make container-production-build PRODUCTION_ENV_FILE=.env.production`
- production compose checks pass with
  `make container-production-check PRODUCTION_ENV_FILE=.env.production`
- liveness/readiness probes are configured against `/api/v1/health` and
  `/api/v1/readiness`
- real browser e2e write journeys pass
- no known P1/P2 issues remain
- rollback owner and feature owner have signed off
- release signoff evidence uses real HTTPS URLs and named owners, not localhost
  or `TBD`

Use this order before opening production traffic:

1. Create and verify the production runtime env file. `.env.production`
   contains production container/runtime values only; do not add release
   evidence URLs, feature owners, rollback owners, or signoff flags to it.

```bash
cp .env.production.example .env.production
$EDITOR .env.production
make production-env-file-check PRODUCTION_ENV_FILE=.env.production
```

2. Build, migrate, start, and check the production stack with the runtime env
   file. Capture evidence for build output, migration or baseline migration,
   readiness, browser write journeys, rollback, alert routing, and the no-P1/P2
   tracker query.

```bash
make container-production-build PRODUCTION_ENV_FILE=.env.production
make container-production-migrate PRODUCTION_ENV_FILE=.env.production
make container-production-up PRODUCTION_ENV_FILE=.env.production
make container-production-check PRODUCTION_ENV_FILE=.env.production
```

3. Fill and verify the release signoff env file after that evidence exists.
   `.env.release-signoff` contains release evidence, owner signoff, alert proof,
   no-P1/P2 proof, and the signoff environment name.

```bash
cp .env.release-signoff.example .env.release-signoff
$EDITOR .env.release-signoff
make release-signoff-check SIGNOFF_ENV_FILE=.env.release-signoff
```

The deprecated `make staging-signoff-check` target remains as a compatibility
alias for `make release-signoff-check`; new release work should use
`release-signoff-check`.

4. Run both gates before opening production traffic:

```bash
make production-deploy-gate PRODUCTION_ENV_FILE=.env.production SIGNOFF_ENV_FILE=.env.release-signoff
```
