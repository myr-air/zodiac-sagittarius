# Environment And Release Signoff Design

## Goal

Make Sagittarius environment configuration easier to reason about before
production deploy by separating runtime configuration from release signoff
evidence.

The current production env file mixes two concepts:

- values the production containers need to run
- proof that the release is safe to open, such as browser evidence, migration
  evidence, rollback evidence, alert routing, and named owners

That mix makes `.env.production` look like an app runtime file while also
holding staging and operational signoff values. The redesign should make each
file answer one question.

## Deployment Model

For the current Docker/Cloudflare deployment path, Sagittarius has two runtime
environments:

- `local/dev`: developer machine, local test database, local browser QA, and
  local production-build smoke checks
- `production`: Docker services on the `zodiac` network, shared production
  database, production email delivery, and public Cloudflare hostnames

There is no required persistent `staging` runtime in this deployment path. A
future staging stack may be added later, but it should not be represented by a
runtime env file until it exists as a real deploy target.

Release signoff is still required before public production traffic opens. That
signoff may point to deployed staging evidence if a staging system exists, or
to named production-preflight evidence if the project intentionally uses local
and production only. The important rule is that the signoff values are evidence,
not production container runtime configuration.

## File Model

Use these files:

```text
.env.local.example
.env.production.example
.env.release-signoff.example
```

Ignored local copies:

```text
.env.local
.env.production
.env.release-signoff
```

Do not add `.env.staging` unless there is a real staging runtime with its own
deploy command, database, hostnames, and owner.

## File Responsibilities

### `.env.local`

Purpose: local developer runtime values.

Typical values:

- `DATABASE_URL`
- `TEST_DATABASE_URL`
- `PGADMIN_URL`
- `SAGITTARIUS_BIND_ADDR`
- `NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL`
- local email/log settings

The Makefile may keep safe defaults for local development, so `.env.local` can
remain optional.

### `.env.production`

Purpose: values required by production containers and production runtime gates.

Typical values:

- `DATABASE_URL`
- `SAGITTARIUS_ENV=production`
- `SAGITTARIUS_SEED_SAMPLE_DATA=0`
- `SAGITTARIUS_ALLOWED_ORIGINS`
- `PASSKEY_ALLOWED_ORIGINS`
- `NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL`
- `SAGITTARIUS_INTERNAL_API_BASE_URL`
- `EMAIL_DELIVERY`
- SMTP or sendmail variables
- `EMAIL_FROM`
- `RUST_LOG`

This file should not contain signoff evidence URLs, staging URLs, feature owner,
rollback owner, alert evidence URL, or no-P1/P2 proof.

### `.env.release-signoff`

Purpose: evidence and accountability required before production is opened.

Use neutral names so the file works whether evidence comes from a staging stack
or from production-preflight runs:

- `SAGITTARIUS_SIGNOFF_PREFLIGHT_PASSED=1`
- `SAGITTARIUS_SIGNOFF_BROWSER_PASSED=1`
- `SAGITTARIUS_SIGNOFF_DB_MIGRATION_VERIFIED=1`
- `SAGITTARIUS_SIGNOFF_ROLLBACK_VERIFIED=1`
- `SAGITTARIUS_SIGNOFF_ALERT_ROUTING_VERIFIED=1`
- `SAGITTARIUS_SIGNOFF_NO_P1_P2=1`
- `SAGITTARIUS_SIGNOFF_ENVIRONMENT`
- `SAGITTARIUS_SIGNOFF_API_BASE_URL`
- `SAGITTARIUS_SIGNOFF_FRONTEND_URL`
- `SAGITTARIUS_SIGNOFF_EVIDENCE_URL`
- `SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL`
- `SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL`
- `SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL`
- `SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL`
- `SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL`
- `SAGITTARIUS_ALERT_SINK_NAME`
- `SAGITTARIUS_ALERT_RUNBOOK_URL`
- `SAGITTARIUS_FEATURE_OWNER`
- `SAGITTARIUS_ROLLBACK_OWNER`

If the evidence source is a staging system, set
`SAGITTARIUS_SIGNOFF_ENVIRONMENT=staging`. If the project uses local and
production only, use a truthful value such as `production-preflight`.

## Script And Makefile Behavior

Split validation by responsibility:

- `test:production-env` checks runtime production values only.
- `test:release-signoff` checks release evidence and accountability only.
- `make production-env-file-check PRODUCTION_ENV_FILE=.env.production` loads
  only `.env.production`.
- `make release-signoff-check SIGNOFF_ENV_FILE=.env.release-signoff` loads only
  `.env.release-signoff`.
- `make production-deploy-gate` or `make production-ready-to-open` runs both
  production runtime checks and release signoff checks.

Keep the old `staging-signoff-check` target temporarily as a compatibility
alias for `release-signoff-check`, then remove or deprecate it in docs after
the new naming is adopted.

## Migration Plan

1. Add `.env.release-signoff.example` with signoff-only values.
2. Remove signoff and staging evidence values from `.env.production.example`.
3. Add `.env.local.example` only if it improves local onboarding beyond the
   Makefile defaults.
4. Update `.gitignore` to ignore `.env.local` and `.env.release-signoff`.
5. Rename or wrap `frontend/scripts/check-staging-signoff.ts` as
   `check-release-signoff.ts`.
6. Update `frontend/scripts/check-production-env.ts` so it validates only
   runtime production values.
7. Update Makefile targets and docs to load runtime and signoff env files
   separately.
8. Keep tests that prove placeholder domains, localhost production URLs, `TBD`
   owners, and missing alert/runbook values fail.

## Compatibility

The current `SAGITTARIUS_STAGING_*` names should be accepted temporarily by the
release signoff script as deprecated aliases. The script should prefer
`SAGITTARIUS_SIGNOFF_*` when both are present.

This avoids breaking existing CI immediately while making new local files and
docs use the clearer vocabulary.

## Non-Goals

- Do not add a `.env.staging` runtime file without a real staging deployment.
- Do not change production Docker service topology.
- Do not weaken the production ship gate.
- Do not put real secrets or real private evidence tokens in committed example
  files.
- Do not close production blocker issues only because format checks pass.

## Acceptance Criteria

- Production runtime config and release evidence are stored in separate files.
- Production containers can be built and checked without loading signoff
  evidence into the container runtime environment.
- Release signoff cannot pass with placeholder domains, localhost public URLs,
  `TBD` owners, or missing alert evidence.
- Docs explain that current runtime deploy targets are local/dev and
  production only.
- Existing production readiness checks still prove local code readiness and
  real browser/API behavior.
