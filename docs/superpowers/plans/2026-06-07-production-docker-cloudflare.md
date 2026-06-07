# Production Docker Cloudflare Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Sagittarius deployable as a production Docker Compose stack on the existing `zodiac` Docker network, ready for the existing Cloudflare Tunnel to publish the same app at `https://joii.13thx.com` and `https://sagittarius.13thx.com`.

**Architecture:** Add a production compose stack for frontend and API, both attached to the external `zodiac` Docker network. The API connects to an existing shared database service on that network through `DATABASE_URL`. The Cloudflare Tunnel routes both public hostnames to the frontend container; the frontend rewrites `/api/v1/*` to the internal API container. Production gates remain in place and are updated to allow the intentional same-origin API model for the `13thx.com` hostnames.

**Tech Stack:** Docker Compose, Next.js 16, Bun, Rust/Axum, shared Postgres on the `zodiac` Docker network, Cloudflare Tunnel ingress config, existing Vitest release-gate tests.

---

## File Structure

- Modify `frontend/src/release-gates.test.ts`: add production-gate tests for the approved same-origin `13thx.com` deployment and for an invalid origin/API collision.
- Modify `frontend/scripts/check-production-env.ts`: allow same-origin API base URL only for `joii.13thx.com` and `sagittarius.13thx.com`, while keeping placeholder, localhost, and non-HTTPS rejection.
- Modify `frontend/next.config.ts`: add a rewrite from `/api/v1/:path*` to `SAGITTARIUS_INTERNAL_API_BASE_URL`.
- Modify `frontend/Dockerfile`: pass `NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL` and `SAGITTARIUS_INTERNAL_API_BASE_URL` into the Next build and runtime.
- Modify `backend/Dockerfile`: install `curl` in the runtime image so Docker health checks can probe readiness.
- Add `docker-compose.production.yml`: production app stack joining external Docker network `zodiac` and using shared database `DATABASE_URL`.
- Add `.env.production.example`: documented, non-secret production env template for the approved domains and shared database alias.
- Modify `.gitignore`: ignore real `.env.production`.
- Modify `Makefile`: add production compose targets.
- Add `docs/production-docker-cloudflare.md`: operator runbook for Docker and Cloudflare Tunnel config.

## Task 1: Production Gate Tests

**Files:**

- Modify: `frontend/src/release-gates.test.ts`
- Test: `frontend/src/release-gates.test.ts`

- [ ] **Step 1: Add a valid same-origin production env fixture**

Add this helper above the existing `describe("release evidence gates", ...)` block:

```ts
const validProductionEnv = {
  DATABASE_URL: "postgres://sagittarius:change-me-prod-password@postgres.13thx.com:5432/sagittarius",
  EMAIL_DELIVERY: "smtp",
  EMAIL_FROM: "Sagittarius <no-reply@13thx.com>",
  NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: "https://joii.13thx.com",
  PASSKEY_ALLOWED_ORIGINS:
    "https://joii.13thx.com,https://sagittarius.13thx.com",
  RUST_LOG: "info,tower_http=info,sagittarius_api=info",
  SAGITTARIUS_ALERT_RUNBOOK_URL:
    "https://runbooks.13thx.com/sagittarius/write-route-alerts",
  SAGITTARIUS_ALERT_SINK_NAME: "sagittarius-write-route-alerts",
  SAGITTARIUS_ALLOWED_ORIGINS:
    "https://joii.13thx.com,https://sagittarius.13thx.com",
  SAGITTARIUS_ENV: "production",
  SAGITTARIUS_FEATURE_OWNER: "Aom Owner",
  SAGITTARIUS_ROLLBACK_OWNER: "Beam Owner",
  SAGITTARIUS_SEED_SAMPLE_DATA: "0",
  SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL:
    "https://ci.13thx.com/sagittarius/runs/123/browser",
  SAGITTARIUS_STAGING_BROWSER_SIGNOFF: "1",
  SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED: "1",
  SAGITTARIUS_STAGING_EVIDENCE_URL:
    "https://ci.13thx.com/sagittarius/runs/123",
  SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL:
    "https://issues.13thx.com/sagittarius?severity=P1,P2",
  SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL:
    "https://ci.13thx.com/sagittarius/runs/123/migration",
  SAGITTARIUS_STAGING_NO_P1_P2: "1",
  SAGITTARIUS_STAGING_PREFLIGHT_PASSED: "1",
  SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL:
    "https://ci.13thx.com/sagittarius/runs/123/rollback",
  SAGITTARIUS_STAGING_ROLLBACK_VERIFIED: "1",
  SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED: "1",
  SMTP_HOST: "smtp.13thx.com",
  SMTP_PASSWORD: "change-me-smtp-password",
  SMTP_PORT: "587",
  SMTP_USERNAME: "sagittarius-smtp",
};
```

- [ ] **Step 2: Add tests for approved and rejected same-origin deployments**

Add these tests inside `describe("release evidence gates", ...)`:

```ts
  it("accepts the approved joii same-origin production deployment", () => {
    const result = runGate("scripts/check-production-env.ts", validProductionEnv);

    expect(result.status).toBe(0);
    expect(outputOf(result)).toContain("production env check ok");
  });

  it("rejects accidental same-origin API base URLs outside the approved production domains", () => {
    const result = runGate("scripts/check-production-env.ts", {
      ...validProductionEnv,
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: "https://travel.13thx.com",
      SAGITTARIUS_ALLOWED_ORIGINS: "https://travel.13thx.com",
    });

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain(
      "SAGITTARIUS_ALLOWED_ORIGINS should contain frontend origins, not the API base URL",
    );
  });
```

- [ ] **Step 3: Run the tests and verify the new approved test fails**

Run:

```bash
cd frontend && bun run vitest --project unit run src/release-gates.test.ts
```

Expected: the approved `joii.13thx.com` test fails because current `check-production-env.ts` rejects an API base URL that is also in `SAGITTARIUS_ALLOWED_ORIGINS`.

## Task 2: Update Production Env Gate

**Files:**

- Modify: `frontend/scripts/check-production-env.ts`
- Test: `frontend/src/release-gates.test.ts`

- [ ] **Step 1: Add approved same-origin host constants**

Add this near the top of `frontend/scripts/check-production-env.ts`, after `type Env = ...`:

```ts
const approvedSameOriginApiHosts = new Set([
  "joii.13thx.com",
  "sagittarius.13thx.com",
]);
```

- [ ] **Step 2: Replace the API/origin collision check**

Replace this block:

```ts
  if (apiValue && origins.includes(apiValue)) {
    failures.push(
      `${name} should contain frontend origins, not the API base URL`,
    );
  }
```

with:

```ts
  if (apiValue && origins.includes(apiValue) && !isApprovedSameOriginApi(apiValue)) {
    failures.push(
      `${name} should contain frontend origins, not the API base URL`,
    );
  }
```

- [ ] **Step 3: Add the helper function**

Add this below `checkAllowedOrigins`:

```ts
function isApprovedSameOriginApi(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      approvedSameOriginApiHosts.has(url.hostname)
    );
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run release gate tests**

Run:

```bash
cd frontend && bun run vitest --project unit run src/release-gates.test.ts
```

Expected: all release gate tests pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add frontend/src/release-gates.test.ts frontend/scripts/check-production-env.ts
git commit -m "test: allow approved same-origin production domain"
```

## Task 3: Add Frontend API Rewrite

**Files:**

- Modify: `frontend/next.config.ts`
- Test: `frontend/src/project-contract.test.ts`

- [ ] **Step 1: Add a contract assertion for the rewrite env**

In `frontend/src/project-contract.test.ts`, add a test near the existing production/config checks:

```ts
  it("documents the internal API rewrite used by production Docker", () => {
    const nextConfig = readFileSync(resolve(frontendRoot, "next.config.ts"), "utf8");

    expect(nextConfig).toContain("SAGITTARIUS_INTERNAL_API_BASE_URL");
    expect(nextConfig).toContain("/api/v1/:path*");
  });
```

Use the existing file helpers in `project-contract.test.ts`. If `readFileSync`, `resolve`, or `frontendRoot` already exist, reuse them instead of adding duplicates.

- [ ] **Step 2: Run the contract test and verify it fails**

Run:

```bash
cd frontend && bun run vitest --project unit run src/project-contract.test.ts
```

Expected: the new rewrite assertion fails because `next.config.ts` does not yet define the rewrite.

- [ ] **Step 3: Replace `frontend/next.config.ts` with the rewrite config**

Use this full file:

```ts
import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const internalApiBaseUrl =
  process.env.SAGITTARIUS_INTERNAL_API_BASE_URL?.replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: true,
  turbopack: {
    root,
  },
  async rewrites() {
    if (!internalApiBaseUrl) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${internalApiBaseUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 4: Run the contract test**

Run:

```bash
cd frontend && bun run vitest --project unit run src/project-contract.test.ts
```

Expected: the project contract test passes.

- [ ] **Step 5: Commit**

Run:

```bash
git add frontend/next.config.ts frontend/src/project-contract.test.ts
git commit -m "feat: proxy production api through frontend"
```

## Task 4: Dockerfiles For Production Runtime

**Files:**

- Modify: `frontend/Dockerfile`
- Modify: `backend/Dockerfile`
- Test: `Makefile`

- [ ] **Step 1: Update backend runtime dependencies**

In `backend/Dockerfile`, replace the runtime install block:

```dockerfile
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
```

with:

```dockerfile
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*
```

- [ ] **Step 2: Update frontend Dockerfile build args**

Replace `frontend/Dockerfile` with:

```dockerfile
FROM oven/bun:1.3.5-debian AS deps

WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS builder

ARG NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=""
ARG SAGITTARIUS_INTERNAL_API_BASE_URL=""
ENV NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=$NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL
ENV SAGITTARIUS_INTERNAL_API_BASE_URL=$SAGITTARIUS_INTERNAL_API_BASE_URL

WORKDIR /app/frontend
COPY frontend ./
RUN bun run build

FROM oven/bun:1.3.5-debian AS runtime

ARG NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=""
ARG SAGITTARIUS_INTERNAL_API_BASE_URL=""
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=5180
ENV NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=$NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL
ENV SAGITTARIUS_INTERNAL_API_BASE_URL=$SAGITTARIUS_INTERNAL_API_BASE_URL

WORKDIR /app/frontend
COPY --from=builder /app/frontend/package.json /app/frontend/bun.lock ./
COPY --from=builder /app/frontend/node_modules ./node_modules
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/next.config.ts ./next.config.ts

USER bun
EXPOSE 5180

CMD ["bun", "run", "start"]
```

- [ ] **Step 3: Run existing image build**

Run:

```bash
make container-build
```

Expected: both existing local images build successfully.

- [ ] **Step 4: Commit**

Run:

```bash
git add frontend/Dockerfile backend/Dockerfile
git commit -m "build: prepare containers for production health checks"
```

## Task 5: Production Compose And Env Template

**Files:**

- Add: `docker-compose.production.yml`
- Add: `.env.production.example`
- Modify: `.gitignore`
- Test: Docker Compose config

- [ ] **Step 1: Ignore real production env**

Add this to `.gitignore` near other env and local artifact entries:

```gitignore
.env.production
```

- [ ] **Step 2: Add `docker-compose.production.yml`**

Create this file. The compose stack must not define a database service or
database volume; production uses the existing shared database reachable on the
external `zodiac` network through `DATABASE_URL`.

```yaml
services:
  sagittarius-api:
    image: sagittarius-api:production
    build:
      context: .
      dockerfile: backend/Dockerfile
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL:?DATABASE_URL is required}
      EMAIL_DELIVERY: ${EMAIL_DELIVERY}
      EMAIL_FROM: ${EMAIL_FROM}
      PASSKEY_ALLOWED_ORIGINS: ${PASSKEY_ALLOWED_ORIGINS}
      RUST_LOG: ${RUST_LOG}
      SAGITTARIUS_ALLOWED_ORIGINS: ${SAGITTARIUS_ALLOWED_ORIGINS}
      SAGITTARIUS_BIND_ADDR: 0.0.0.0:5181
      SAGITTARIUS_ENV: production
      SAGITTARIUS_SEED_SAMPLE_DATA: "0"
      SENDMAIL_COMMAND: ${SENDMAIL_COMMAND:-}
      SMTP_HOST: ${SMTP_HOST:-}
      SMTP_PASSWORD: ${SMTP_PASSWORD:-}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USERNAME: ${SMTP_USERNAME:-}
    expose:
      - "5181"
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:5181/api/v1/readiness >/dev/null"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 20s
    networks:
      zodiac:
        aliases:
          - sagittarius-api

  sagittarius-frontend:
    image: sagittarius-frontend:production
    build:
      context: .
      dockerfile: frontend/Dockerfile
      args:
        NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: ${NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL}
        SAGITTARIUS_INTERNAL_API_BASE_URL: ${SAGITTARIUS_INTERNAL_API_BASE_URL}
    restart: unless-stopped
    depends_on:
      sagittarius-api:
        condition: service_healthy
    environment:
      HOSTNAME: 0.0.0.0
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: ${NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL}
      PORT: "5180"
      SAGITTARIUS_INTERNAL_API_BASE_URL: ${SAGITTARIUS_INTERNAL_API_BASE_URL}
    expose:
      - "5180"
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "bun --eval \"fetch('http://localhost:5180').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))\"",
        ]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 20s
    networks:
      zodiac:
        aliases:
          - sagittarius-frontend

networks:
  zodiac:
    external: true
```

- [ ] **Step 3: Add `.env.production.example`**

Create this file:

```dotenv
# zodiac-postgres is the shared database service name on the external zodiac
# Docker network. Replace it if the actual shared DB uses a different alias.
DATABASE_URL=postgres://sagittarius:change-me-production-postgres-password@zodiac-postgres:5432/sagittarius

SAGITTARIUS_ENV=production
SAGITTARIUS_SEED_SAMPLE_DATA=0
SAGITTARIUS_ALLOWED_ORIGINS=https://joii.13thx.com,https://sagittarius.13thx.com
PASSKEY_ALLOWED_ORIGINS=https://joii.13thx.com,https://sagittarius.13thx.com
NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=https://joii.13thx.com
SAGITTARIUS_INTERNAL_API_BASE_URL=http://sagittarius-api:5181

EMAIL_DELIVERY=smtp
SMTP_HOST=smtp.13thx.com
SMTP_PORT=587
SMTP_USERNAME=sagittarius-smtp
SMTP_PASSWORD=change-me-production-smtp-password
EMAIL_FROM="Sagittarius <no-reply@13thx.com>"
SENDMAIL_COMMAND=

RUST_LOG=info,tower_http=info,sagittarius_api=info

SAGITTARIUS_ALERT_SINK_NAME=sagittarius-write-route-alerts
SAGITTARIUS_ALERT_RUNBOOK_URL=https://runbooks.13thx.com/sagittarius/write-route-alerts
SAGITTARIUS_FEATURE_OWNER="Production Owner"
SAGITTARIUS_ROLLBACK_OWNER="Rollback Owner"

SAGITTARIUS_STAGING_PREFLIGHT_PASSED=1
SAGITTARIUS_STAGING_BROWSER_SIGNOFF=1
SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED=1
SAGITTARIUS_STAGING_ROLLBACK_VERIFIED=1
SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED=1
SAGITTARIUS_STAGING_NO_P1_P2=1
SAGITTARIUS_STAGING_EVIDENCE_URL=https://ci.13thx.com/sagittarius/runs/123
SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL=https://ci.13thx.com/sagittarius/runs/123/browser
SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL=https://ci.13thx.com/sagittarius/runs/123/migration
SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL=https://ci.13thx.com/sagittarius/runs/123/rollback
SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL=https://issues.13thx.com/sagittarius?severity=P1,P2
```

- [ ] **Step 4: Validate compose syntax**

Run:

```bash
docker compose --env-file .env.production.example -f docker-compose.production.yml config
```

Expected: Docker Compose renders a valid config. If Docker reports that external network `zodiac` is missing during later runtime commands, create it outside this repo with `docker network create zodiac`.

- [ ] **Step 5: Commit**

Run:

```bash
git add .gitignore docker-compose.production.yml .env.production.example
git commit -m "deploy: add production compose stack"
```

## Task 6: Makefile Production Targets

**Files:**

- Modify: `Makefile`
- Test: Makefile target dry checks

- [ ] **Step 1: Add production compose variables**

Add these near the top of `Makefile`:

```make
PRODUCTION_COMPOSE_FILE ?= docker-compose.production.yml
PRODUCTION_ENV_FILE ?= .env.production
PRODUCTION_COMPOSE := docker compose --env-file $(PRODUCTION_ENV_FILE) -f $(PRODUCTION_COMPOSE_FILE)
```

- [ ] **Step 2: Add phony targets**

Extend the `.PHONY` line with:

```make
container-production-build container-production-up container-production-down container-production-logs container-production-check
```

- [ ] **Step 3: Add target implementations**

Add these after `container-build`:

```make
container-production-build:
	$(PRODUCTION_COMPOSE) build

container-production-up:
	$(PRODUCTION_COMPOSE) up -d

container-production-down:
	$(PRODUCTION_COMPOSE) down

container-production-logs:
	$(PRODUCTION_COMPOSE) logs -f --tail=200

container-production-check: production-env-check
	$(PRODUCTION_COMPOSE) ps
	$(PRODUCTION_COMPOSE) exec sagittarius-api curl -fsS http://localhost:5181/api/v1/readiness
	$(PRODUCTION_COMPOSE) exec sagittarius-frontend bun --eval "fetch('http://localhost:5180').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
```

- [ ] **Step 4: Validate Makefile parsing**

Run:

```bash
make -n container-production-build PRODUCTION_ENV_FILE=.env.production.example
make -n container-production-check PRODUCTION_ENV_FILE=.env.production.example
```

Expected: Make prints Docker Compose commands without syntax errors.

- [ ] **Step 5: Commit**

Run:

```bash
git add Makefile
git commit -m "build: add production compose commands"
```

## Task 7: Production Docker Cloudflare Runbook

**Files:**

- Add: `docs/production-docker-cloudflare.md`
- Modify: `docs/production-freeze-checklist.md`
- Test: docs grep

- [ ] **Step 1: Add the runbook**

Create `docs/production-docker-cloudflare.md`:

```md
# Production Docker Cloudflare Runbook

## Purpose

Run Sagittarius as a Docker Compose production stack on the existing `zodiac`
Docker network and publish the same frontend through the existing Cloudflare
Tunnel at:

- `https://joii.13thx.com`
- `https://sagittarius.13thx.com`

`joii.13thx.com` is the primary user-facing URL.

## Files

- `docker-compose.production.yml` defines the app stack.
- `.env.production.example` documents required production env values.
- `.env.production` is the real local secret file and must not be committed.

## First Setup

```bash
docker network create zodiac
cp .env.production.example .env.production
```

Edit `.env.production` and replace all passwords, SMTP settings, owner names,
and evidence URLs with real production values.

## Build And Start

```bash
make container-production-build
make container-production-up
docker compose --env-file .env.production -f docker-compose.production.yml ps
```

## Cloudflare Tunnel Ingress

Add these rules to the existing Cloudflare Tunnel service that is already
attached to the `zodiac` Docker network:

```yaml
ingress:
  - hostname: joii.13thx.com
    service: http://sagittarius-frontend:5180
  - hostname: sagittarius.13thx.com
    service: http://sagittarius-frontend:5180
  - service: http_status:404
```

The tunnel container must be on the same `zodiac` network:

```bash
docker network connect zodiac <cloudflare-tunnel-container-name>
```

Run that command only if the tunnel container is not already connected.

## Production Checks

```bash
make production-env-check
make container-production-check
```

The API readiness endpoint is:

```text
http://sagittarius-api:5181/api/v1/readiness
```

The public browser routes should be checked through Cloudflare:

```bash
curl -fsS https://joii.13thx.com
curl -fsS https://sagittarius.13thx.com
curl -fsS https://joii.13thx.com/api/v1/health
```

## Stop

```bash
make container-production-down
```

This stops the app containers. The shared database is owned outside this stack.
```

- [ ] **Step 2: Link the runbook from the freeze checklist**

Add this short section near the existing container/probe notes in `docs/production-freeze-checklist.md`:

```md
## Docker And Cloudflare

For the self-hosted zodiac network deploy, follow
`docs/production-docker-cloudflare.md`. The production app is published through
the existing Cloudflare Tunnel at `joii.13thx.com` and `sagittarius.13thx.com`.
```

- [ ] **Step 3: Verify docs mention both hostnames and the external network**

Run:

```bash
rg -n "joii\\.13thx\\.com|sagittarius\\.13thx\\.com|zodiac" docs/production-docker-cloudflare.md docs/production-freeze-checklist.md
```

Expected: output includes both hostnames and `zodiac`.

- [ ] **Step 4: Commit**

Run:

```bash
git add docs/production-docker-cloudflare.md docs/production-freeze-checklist.md
git commit -m "docs: add zodiac cloudflare production runbook"
```

## Task 8: Final Verification

**Files:**

- Verify all changed production deploy files.

- [ ] **Step 1: Run focused frontend tests**

Run:

```bash
cd frontend && bun run vitest --project unit run src/release-gates.test.ts src/project-contract.test.ts
```

Expected: all focused tests pass.

- [ ] **Step 2: Validate production env example through the gate**

Run:

```bash
set -a
. ./.env.production.example
set +a
make production-env-check
```

Expected: production env check prints `production env check ok`.

- [ ] **Step 3: Validate production compose config**

Run:

```bash
docker compose --env-file .env.production.example -f docker-compose.production.yml config
```

Expected: Docker Compose renders the config without syntax errors.

- [ ] **Step 4: Build production containers**

Run:

```bash
make container-production-build PRODUCTION_ENV_FILE=.env.production.example
```

Expected: frontend and API production images build.

- [ ] **Step 5: Run broader static verification**

Run:

```bash
make frontend-test
```

Expected: frontend unit suite passes.

- [ ] **Step 6: Inspect git status**

Run:

```bash
git status --short
```

Expected: clean working tree.
