# Production Freeze Checklist

Use this checklist after Wave 4 real-system verification passes in staging.

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
- Route 4xx/5xx write-operation logs to the staging alert sink before production.
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

Migration `0007_stop_notes.sql` is additive. Rollback options:

- application rollback only: deploy previous app version while leaving
  `stop_notes` table unused.
- database rollback for test/staging only:

```sql
DROP INDEX IF EXISTS stop_notes_trip_item_created_at_idx;
DROP TABLE IF EXISTS stop_notes;
```

Before production, verify both paths in staging:

- upgrade from database with migrations `0001` through `0006`
- apply `0007_stop_notes.sql`
- boot API and load trip cockpit
- execute stop-note create/delete
- rollback app version and confirm old cockpit still loads

Local SQL rollback smoke:

```bash
make db-rollback-stop-notes-test PSQL='docker exec -i sagittarius-test-postgres psql'
```

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

## Ship Gate

Production can open only when:

- staging DB migration is verified
- backend integration and frontend targeted tests pass
- production container images build successfully with `make container-build`
- liveness/readiness probes are configured against `/api/v1/health` and
  `/api/v1/readiness`
- real browser e2e write journeys pass
- no known P1/P2 issues remain
- rollback owner and feature owner have signed off
- staging sign-off evidence uses real HTTPS staging URLs and named owners, not
  localhost or `TBD`

Enforce the external evidence gate before opening production:

The `example.test` values below are placeholders for documentation only. The
release scripts intentionally reject placeholder domains; replace every URL and
owner with real staging evidence before running the checks.

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
SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL=https://ci.example.test/runs/123/browser \
SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL=https://ci.example.test/runs/123/migration \
SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL=https://ci.example.test/runs/123/rollback \
SAGITTARIUS_STAGING_ALERT_EVIDENCE_URL=https://alerts.example.test/incidents/sagittarius-write-routes \
SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL=https://issues.example.test/sagittarius?severity=P1,P2 \
SAGITTARIUS_FEATURE_OWNER="Feature Owner" \
SAGITTARIUS_ROLLBACK_OWNER="Rollback Owner" \
make staging-signoff-check
```

Then run the production environment safety check with the actual production
runtime values before deploy:

The production example also uses placeholder domains and credentials; the check
must be run with the actual deploy environment values.

```bash
DATABASE_URL=postgres://user:pass@db.example.test:5432/sagittarius \
NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=https://api.example.test \
SAGITTARIUS_ALLOWED_ORIGINS=https://app.example.test \
PASSKEY_ALLOWED_ORIGINS=https://app.example.test \
EMAIL_DELIVERY=smtp \
SMTP_HOST=smtp.example.test \
SMTP_PORT=587 \
SMTP_USERNAME=smtp-user \
SMTP_PASSWORD=smtp-password \
EMAIL_FROM="Sagittarius <no-reply@example.test>" \
RUST_LOG=info,tower_http=info,sagittarius_api=info \
SAGITTARIUS_ALERT_SINK_NAME=sagittarius-write-route-alerts \
SAGITTARIUS_ALERT_RUNBOOK_URL=https://runbooks.example.test/sagittarius/write-route-alerts \
SAGITTARIUS_STAGING_PREFLIGHT_PASSED=1 \
SAGITTARIUS_STAGING_BROWSER_SIGNOFF=1 \
SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED=1 \
SAGITTARIUS_STAGING_ROLLBACK_VERIFIED=1 \
SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED=1 \
SAGITTARIUS_STAGING_NO_P1_P2=1 \
SAGITTARIUS_STAGING_EVIDENCE_URL=https://ci.example.test/runs/123 \
SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL=https://ci.example.test/runs/123/browser \
SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL=https://ci.example.test/runs/123/migration \
SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL=https://ci.example.test/runs/123/rollback \
SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL=https://issues.example.test/sagittarius?severity=P1,P2 \
SAGITTARIUS_FEATURE_OWNER="Feature Owner" \
SAGITTARIUS_ROLLBACK_OWNER="Rollback Owner" \
make production-env-check
```
