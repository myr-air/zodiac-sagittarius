# Service Layout Makefile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the frontend into `frontend/`, keep backend isolated under `backend/`, and add a root `Makefile` for cross-service commands.

**Architecture:** The repository root becomes an orchestration layer. Frontend tooling runs from `frontend/`; backend tooling keeps using `backend/Cargo.toml`.

**Tech Stack:** Next.js, React, Storybook, Vitest, Bun, Rust Cargo, GNU Make-compatible Makefile.

---

### Task 1: Layout Contract

**Files:**
- Modify: `src/project-contract.test.ts`

- [ ] Update the scaffold contract to read frontend files from `frontend/` and assert the root `Makefile` targets.
- [ ] Run `rtk bun run test src/project-contract.test.ts` and confirm it fails because files have not moved yet.

### Task 2: Move Frontend Service

**Files:**
- Move: `app/` to `frontend/app/`
- Move: `src/` to `frontend/src/`
- Move: `public/` to `frontend/public/`
- Move: `.storybook/` to `frontend/.storybook/`
- Move: `package.json` to `frontend/package.json`
- Move: `bun.lock` to `frontend/bun.lock`
- Move: `next.config.ts` to `frontend/next.config.ts`
- Move: `tsconfig.json` to `frontend/tsconfig.json`
- Move: `vitest.config.ts` to `frontend/vitest.config.ts`
- Move: `vitest.setup.ts` to `frontend/vitest.setup.ts`
- Move: `eslint.config.mjs` to `frontend/eslint.config.mjs`
- Move: `postcss.config.mjs` to `frontend/postcss.config.mjs`
- Move: `next-env.d.ts` to `frontend/next-env.d.ts`

- [ ] Move the files with `git mv` so history follows the restructure.
- [ ] Leave docs, backend, Rust config, and repository metadata at root.

### Task 3: Update Frontend Tooling

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vitest.config.ts`
- Modify: `frontend/tsconfig.json`
- Modify: `frontend/.storybook/main.ts`
- Modify: `frontend/.storybook/preview.ts`
- Modify: `frontend/eslint.config.mjs`
- Modify: frontend contract tests under `frontend/src/`

- [ ] Ensure package scripts run from `frontend/`.
- [ ] Ensure Storybook reads `frontend/src` stories and `frontend/public`.
- [ ] Ensure Vitest setup paths resolve from `frontend/`.
- [ ] Update contract tests to use the new frontend-relative paths.

### Task 4: Add Root Makefile

**Files:**
- Create: `Makefile`

- [ ] Add frontend and backend orchestration targets.
- [ ] Make `verify` depend on `frontend-verify` and `backend-test`.

### Task 5: Verify

**Commands:**
- `rtk make frontend-test`
- `rtk make frontend-build`
- `rtk make backend-test`

- [ ] Fix path or config failures.
- [ ] Report any verification blocked by missing external services.
