# Service Layout Makefile Design

## Goal

Restructure Sagittarius into clear service boundaries: a standalone frontend service, a standalone backend service, and a thin repository root that orchestrates both through `Makefile`.

## Approved Direction

Use a simple microservice-style layout:

```text
sagittarius/
  Makefile
  backend/
  frontend/
  docs/
```

The backend remains the existing Rust workspace under `backend/`. The frontend moves under `frontend/` with its Next.js app, React source, Storybook config, Vitest config, TypeScript config, public assets, and Bun package metadata.

## Frontend Boundary

`frontend/` owns all JavaScript and browser app tooling:

- `frontend/package.json`
- `frontend/bun.lock`
- `frontend/app/`
- `frontend/src/`
- `frontend/public/`
- `frontend/.storybook/`
- `frontend/next.config.ts`
- `frontend/tsconfig.json`
- `frontend/vitest.config.ts`
- `frontend/eslint.config.mjs`
- `frontend/postcss.config.mjs`
- `frontend/next-env.d.ts`
- `frontend/vitest.setup.ts`

Imports may continue to use the `@/*` alias, but the alias resolves from `frontend/` instead of the repository root.

## Backend Boundary

`backend/` remains the Rust API service. No frontend source or frontend toolchain files should be added there.

Backend tests continue to run with:

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/Cargo.toml
```

## Root Orchestration

The repository root should contain cross-service documentation and orchestration, not service implementation files.

Add a root `Makefile` with these targets:

- `frontend-dev`
- `frontend-build`
- `frontend-test`
- `frontend-storybook`
- `frontend-verify`
- `backend-test`
- `verify`

Frontend targets run inside `frontend/` with Bun. Backend targets call Cargo with `--manifest-path backend/Cargo.toml`.

## Testing

Update project contract tests so they assert the new service layout, Makefile targets, and moved frontend files. Run the frontend unit tests from `frontend/` after the move. Run root `make frontend-test` to prove orchestration works.

## Out Of Scope

- Changing product UI or behavior.
- Changing backend API behavior.
- Introducing a full package workspace manager.
- Adding Docker Compose or deployment manifests.
