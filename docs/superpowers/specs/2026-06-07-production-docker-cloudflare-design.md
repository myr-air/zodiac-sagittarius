# Production Docker Cloudflare Design

## Goal

Make Sagittarius deployable as a production Docker stack on the existing
`zodiac` Docker network, ready for the existing Cloudflare Tunnel service to
publish the same web app at:

- `https://joii.13thx.com` as the primary public URL
- `https://sagittarius.13thx.com` as an alternate public URL for the same app

## Context

The repository already has separate production-capable Dockerfiles:

- `backend/Dockerfile` builds `sagittarius-api` and binds
  `SAGITTARIUS_BIND_ADDR=0.0.0.0:5181`.
- `frontend/Dockerfile` builds the Next.js app and starts it on port `5180`.
- `Makefile` has `container-build`, production readiness, staging sign-off,
  and environment gate commands.
- The API already exposes `/api/v1/health` and `/api/v1/readiness`.
- The API CORS policy is controlled by `SAGITTARIUS_ALLOWED_ORIGINS` and
  rejects localhost automatically in `production` unless explicitly overridden.
- The project already validates production environment safety through
  `frontend/scripts/check-production-env.ts`.

There is no committed production compose stack or Cloudflare Tunnel runbook yet.

## Requirements

1. The production stack must run as Docker services and attach to the existing
   external Docker network named `zodiac`.
2. The stack must not create or own the Cloudflare Tunnel container. The tunnel
   already exists in the zodiac network.
3. `joii.13thx.com` and `sagittarius.13thx.com` must serve the same frontend
   container.
4. `joii.13thx.com` is the primary user-facing origin.
5. The API must remain reachable from the frontend and from Cloudflare routing
   without exposing an unnecessary host port by default.
6. Production sample seed data must be disabled.
7. Production CORS and passkey origins must include both public HTTPS origins.
8. Deploy docs must show the exact Cloudflare Tunnel ingress records to add to
   the existing tunnel config.
9. The production path must keep the existing release gates:
   `production-env-check`, staging evidence flags, health/readiness probes, and
   container build verification.
10. The production environment gate must accept the intentional same-origin API
    model where `NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=https://joii.13thx.com`
    and `SAGITTARIUS_ALLOWED_ORIGINS` includes `https://joii.13thx.com`.

## Architecture

Add a production Docker Compose file that defines a small, explicit app stack:

- `sagittarius-frontend`: serves the production Next.js app on port `5180`
  inside the Docker network.
- `sagittarius-api`: serves the Rust API on port `5181` inside the Docker
  network.
- `sagittarius-postgres`: stores production data in a named Docker volume for
  self-hosted deployment.

All services attach to the external `zodiac` network so the existing Cloudflare
Tunnel container can resolve service names directly.

The default public routing model is:

```text
Cloudflare Tunnel
  joii.13thx.com         -> http://sagittarius-frontend:5180
  sagittarius.13thx.com  -> http://sagittarius-frontend:5180
```

The API remains internal to the Docker network at
`http://sagittarius-api:5181`. A Cloudflare-public API hostname is not part of
this design because both requested domains are the same web app.

## API Access Model

Use a frontend rewrite/proxy for `/api/v1/*` so browser requests can use the
same public origin as the page:

```text
Browser -> https://joii.13thx.com/api/v1/* -> frontend rewrite -> http://sagittarius-api:5181/api/v1/*
```

This keeps the user-facing deployment simple:

- Primary page origin: `https://joii.13thx.com`
- Alternate page origin: `https://sagittarius.13thx.com`
- No separate public API origin
- No extra cross-origin browser API traffic for the normal production app

The frontend runtime should still support an explicit
`NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL` value for existing tests and staged
deployments. Production compose should set it to the primary same-origin API
origin, without `/api/v1`, because the existing frontend API route helpers
already include the `/api/v1` prefix:

```text
NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=https://joii.13thx.com
```

The frontend server rewrite should use a private runtime variable for the
internal Docker target:

```text
SAGITTARIUS_INTERNAL_API_BASE_URL=http://sagittarius-api:5181
```

The implementation must update the production environment check so this
same-origin model is valid. The check should still reject localhost, non-HTTPS
URLs, placeholder domains, and accidental API hosts that are not part of the
approved production domain set.

If the app is opened through `sagittarius.13thx.com`, API calls still work
through backend CORS allowlist and Cloudflare because both HTTPS origins are
allowed. A future follow-up can make the frontend choose `window.location.origin`
for fully origin-neutral API routing if needed.

## Environment

Add `.env.production.example` with non-secret defaults and placeholders for
required secrets. It should document:

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `SAGITTARIUS_ENV=production`
- `SAGITTARIUS_SEED_SAMPLE_DATA=0`
- `SAGITTARIUS_ALLOWED_ORIGINS=https://joii.13thx.com,https://sagittarius.13thx.com`
- `PASSKEY_ALLOWED_ORIGINS=https://joii.13thx.com,https://sagittarius.13thx.com`
- `NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=https://joii.13thx.com`
- `SAGITTARIUS_INTERNAL_API_BASE_URL=http://sagittarius-api:5181`
- `EMAIL_DELIVERY` and the matching SMTP or sendmail variables
- `RUST_LOG=info,tower_http=info,sagittarius_api=info`
- release evidence variables required by the existing production gate

The committed example must not contain real passwords, tokens, private keys, or
production evidence URLs.

## Compose Behavior

The compose stack should:

- Build images from the existing Dockerfiles.
- Attach services to `zodiac`.
- Use a named Postgres volume.
- Keep app ports internal to Docker by default.
- Add health checks:
  - frontend: HTTP check against `http://localhost:5180`
  - API: HTTP check against `http://localhost:5181/api/v1/readiness`
  - Postgres: `pg_isready`
- Start API after Postgres is healthy.
- Start frontend after API is started.
- Avoid local development seed data.

The API image does not currently include a shell HTTP client for health checks.
The implementation may either add a small runtime dependency such as `curl` to
the API image or use Docker-native commands available in the image. The chosen
approach must keep the runtime image small and deterministic.

## Makefile Targets

Add production-oriented Docker targets:

- `container-production-build`: build the production frontend and API images.
- `container-production-up`: start the compose stack with
  `docker compose --env-file .env.production`.
- `container-production-down`: stop the compose stack without deleting volumes.
- `container-production-logs`: tail stack logs.
- `container-production-check`: run the existing production env check and local
  container health/readiness checks.

These targets should be wrappers around Docker Compose commands so operators
can run the raw compose command when needed.

## Cloudflare Tunnel Runbook

Add docs for the existing tunnel owner to add these ingress rules:

```yaml
ingress:
  - hostname: joii.13thx.com
    service: http://sagittarius-frontend:5180
  - hostname: sagittarius.13thx.com
    service: http://sagittarius-frontend:5180
  - service: http_status:404
```

The docs should also mention:

- The Cloudflare Tunnel container must be attached to the `zodiac` Docker
  network.
- Both DNS records should be proxied through Cloudflare and point to the tunnel.
- TLS is terminated by Cloudflare.
- The app containers do not need to bind public host ports for the normal
  production deployment.
- Cloudflare Access, rate limiting, WAF, and redirect preferences can be added
  outside this repo.

## Verification

Implementation is accepted when:

1. `make container-production-build` succeeds.
2. `make container-production-check` rejects missing or placeholder production
   env values.
3. `docker compose --env-file .env.production.example -f docker-compose.production.yml config`
   succeeds for syntax validation without requiring real secrets.
4. The docs explain how to use a real `.env.production` without committing it.
5. The docs show the exact Cloudflare Tunnel ingress for both hostnames.
6. Existing `make production-env-check` remains the release safety gate.
7. Existing tests that cover production env validation continue to pass.

If a real `.env.production` is available locally, an operator can additionally
verify:

```bash
make container-production-up
docker compose --env-file .env.production -f docker-compose.production.yml ps
docker compose --env-file .env.production -f docker-compose.production.yml exec sagittarius-api \
  /bin/sh -lc 'true'
make container-production-down
```

The production default keeps ports inside the Docker network. Local HTTP smoke
checks should use Docker health status, a temporary debug container attached to
`zodiac`, or an intentionally published frontend port in an operator-only
override file.

## Non-Goals

- Do not automate Cloudflare account changes through the Cloudflare API.
- Do not create or manage the existing Cloudflare Tunnel container.
- Do not add Kubernetes, Docker Swarm, or another orchestrator.
- Do not commit real production secrets or evidence URLs.
- Do not change itinerary, account, booking, or trip behavior.
- Do not make `joii.13thx.com` a separate product; it is the primary hostname
  for the same Sagittarius web app.

## Risks And Mitigations

- **API base URL mismatch:** Same-origin routing is simpler, but the current
  frontend reads `NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL`. The implementation must
  either configure a production rewrite or document the exact value that keeps
  API calls working through `joii.13thx.com`.
- **Cloudflare Tunnel network visibility:** The tunnel can only resolve
  `sagittarius-frontend` if it is attached to the same Docker network. The
  runbook must make that explicit.
- **Secrets in git:** Use `.env.production.example` only. `.env.production`
  must stay ignored.
- **Database migration ownership:** The current Makefile owns migration commands
  outside containers. The first production stack can boot against an already
  migrated database, while the runbook explains how to run migrations before
  opening traffic.
