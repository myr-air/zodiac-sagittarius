# Production Docker Cloudflare Runbook

## Purpose

Deploy Sagittarius/Joii as a Docker Compose production app stack on the existing
`zodiac` Docker network. The stack publishes the same frontend through the
existing Cloudflare Tunnel at:

- `https://joii.13thx.com`
- `https://sagittarius.13thx.com`

The default production compose file is `docker-compose.yml`; the root Makefile
uses it through `PRODUCTION_COMPOSE_FILE ?= docker-compose.yml`.

This compose file runs only app services:

- `sagittarius-server`, with the `sagittarius-api` network alias
- `sagittarius-web`

There is no managed DB service or database container in this compose file. The
shared database is provided outside this stack on the `zodiac` network.

## Shared Database

`DATABASE_URL` must point to the shared DB service reachable on the external
`zodiac` Docker network. The example env file uses:

```env
DATABASE_URL=postgres://sagittarius:secret-production-postgres-password@zodiac-postgres:5432/sagittarius
```

Replace `zodiac-postgres:5432` if the actual shared DB service uses a different
service name, alias, or port on the `zodiac` network.

The compose stack does not create, migrate, stop, remove, or roll back the
shared database. Database lifecycle and rollback are owned outside this app
compose file.

## Setup

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and replace secrets, SMTP values, `DATABASE_URL`, and
public/internal production runtime URLs with real production values. Keep
`.env.production` local; do not commit it.

`.env.production` contains production runtime values only. Release evidence and
owner signoff live in `.env.release-signoff` and are checked with
`make release-signoff-check`.

```bash
cp .env.release-signoff.example .env.release-signoff
$EDITOR .env.release-signoff
make release-signoff-check SIGNOFF_ENV_FILE=.env.release-signoff
```

If the external network does not exist yet, create it outside the app stack:

```bash
docker network create zodiac
```

## Build, Migrate, Start, Check, Stop

Build with the production env file:

```bash
make container-production-build PRODUCTION_ENV_FILE=.env.production
```

Before starting the app stack or opening Cloudflare Tunnel traffic, confirm the
shared DB service exists on the `zodiac` Docker network and that
`DATABASE_URL` in `.env.production` points to that service. The API does not
auto-run migrations; the shared DB must be migrated first:

```bash
make container-production-migrate PRODUCTION_ENV_FILE=.env.production
```

This starts a one-off `sagittarius-server` service container on the shared
`zodiac` Docker network and runs `sagittarius-migrate`. The runner applies only
pending SQL migrations, records each applied file in `schema_migrations`, and
verifies checksums so edited historical migrations fail fast.

If the shared DB was already migrated by the older `psql` loop and only lacks
the `schema_migrations` ledger, record the current migration checksums once:

```bash
make container-production-migrate-baseline PRODUCTION_ENV_FILE=.env.production
```

Use the baseline target only after confirming the shared DB schema is already
current through the latest migration file. Do not use it for a fresh database.

Start the app stack only after the migration succeeds:

```bash
make container-production-up PRODUCTION_ENV_FILE=.env.production
```

Check production env values, running containers, and API readiness:

```bash
make production-env-file-check PRODUCTION_ENV_FILE=.env.production
make container-production-check PRODUCTION_ENV_FILE=.env.production
```

Inspect the rendered compose config when needed:

```bash
set -a; . ./.env.production; set +a; docker compose --env-file .env.production -f docker-compose.yml config
```

Use `PRODUCTION_COMPOSE_FILE=...` only when intentionally testing an alternate
compose file.

Stop only the app stack:

```bash
make container-production-down PRODUCTION_ENV_FILE=.env.production
```

Stopping this stack does not stop or remove the shared database.

## Cloudflare Tunnel Ingress

Add this exact ingress to the existing Cloudflare Tunnel:

```yaml
ingress:
  - hostname: joii.13thx.com
    service: http://sagittarius-web:5180
  - hostname: sagittarius.13thx.com
    service: http://sagittarius-web:5180
  - service: http_status:404
```

The tunnel container must be attached to `sagittarius-network` so it can resolve
`sagittarius-web`. The API service also joins `zodiac` to reach the shared
database, but the frontend ingress target is on `sagittarius-network`.

```bash
docker network connect sagittarius-network <cloudflare-tunnel-container-name>
```

Run that command only if the tunnel container is not already connected.

## Health And Readiness

Public API health should be checked through the frontend/Cloudflare route:

```bash
curl -fsS https://joii.13thx.com/api/v1/health
curl -fsS https://sagittarius.13thx.com/api/v1/health
```

Internal API readiness should be checked on the Docker network:

```bash
curl -fsS http://sagittarius-api:5181/api/v1/readiness
```

The frontend service is the only Cloudflare ingress target. Browser API calls
use `/api/v1/*` on the public hostname, and the frontend rewrites them to
`http://sagittarius-api:5181` inside `sagittarius-network`.
