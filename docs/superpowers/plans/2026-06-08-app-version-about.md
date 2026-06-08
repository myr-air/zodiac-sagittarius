# App Version About Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe About App surface that shows frontend, backend, build, environment, runtime, and schema version details.

**Architecture:** Backend exposes `/api/v1/version` from crate metadata and build env vars. Frontend keeps web app metadata in a small module, renders a reusable About page component, and fetches backend metadata through the existing Next API proxy with an unavailable fallback.

**Tech Stack:** Rust/Axum, Next.js App Router, React, Vitest, Testing Library, Playwright.

---

### Task 1: Backend Version Endpoint

**Files:**
- Modify: `backend/crates/sagittarius-api/src/api/health.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`
- Test: `backend/crates/sagittarius-api/tests/http_contract.rs`

- [ ] **Step 1: Write failing contract test** for `GET /api/v1/version` expecting service, version, build SHA, build time, environment, and schema version fields.
- [ ] **Step 2: Run backend focused test** with `cargo test -p sagittarius-api version_endpoint_returns_application_metadata`.
- [ ] **Step 3: Implement endpoint** using `env!("CARGO_PKG_NAME")`, `env!("CARGO_PKG_VERSION")`, `option_env!("SAGITTARIUS_BUILD_SHA")`, `option_env!("SAGITTARIUS_BUILD_TIME")`, `option_env!("SAGITTARIUS_ENVIRONMENT")`, and a latest migration constant.
- [ ] **Step 4: Re-run focused backend test** and keep the endpoint unauthenticated.

### Task 2: Frontend About App

**Files:**
- Create: `frontend/src/app-version.ts`
- Create: `frontend/src/components/AboutAppPage.tsx`
- Create: `frontend/src/components/AboutAppPage.test.tsx`
- Create: `frontend/app/about/page.tsx`
- Modify: `frontend/src/routes/app-routes.ts`

- [ ] **Step 1: Write failing component tests** for rendered web version, API version, build details, safe API host, runtime mode, schema version, and API unavailable fallback.
- [ ] **Step 2: Run focused frontend test** with `bun run test src/components/AboutAppPage.test.tsx`.
- [ ] **Step 3: Implement metadata helper, About component, and route** with no secret/env dumping.
- [ ] **Step 4: Re-run focused frontend test**.

### Task 3: Verification And Commit

**Files:**
- Verify backend, frontend, browser route, and git state.

- [ ] **Step 1: Run focused backend contract test.**
- [ ] **Step 2: Run focused frontend component test.**
- [ ] **Step 3: Run typecheck or build-level verification relevant to the new route.**
- [ ] **Step 4: Start local services and verify `/about` in desktop and mobile browser with console/pageerror/network checks.**
- [ ] **Step 5: Commit all finished files.**
