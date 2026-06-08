# Trip Photos & Albums Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable `Photos` workspace page as a link-first album hub.

**Architecture:** Add a trip photo album link model and frontend domain helpers, then wire a shared page component into the existing workspace shell. The first implementation stores and mutates album link records in the trip draft/local state; backend API persistence is deliberately left as the next vertical slice because it needs database/API contract work.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, Tailwind utility classes.

---

### Task 1: Route And Navigation

**Files:**
- Modify: `frontend/src/routes/app-routes.ts`
- Test: `frontend/src/routes/app-routes.test.ts`

- [x] Write a failing route test for `/trips/:tripId/photos` and nav order.
- [x] Add `tripPhotos` and `photos` nav item.
- [x] Run `bun run test src/routes/app-routes.test.ts`.

### Task 2: Domain Model And Helpers

**Files:**
- Modify: `frontend/src/trip/types.ts`
- Create: `frontend/src/trip/photo-albums.ts`
- Test: `frontend/src/trip/photo-albums.test.ts`

- [x] Write failing tests for summary counts, filtering, safe URL blocking, and relation lookup.
- [x] Add `TripPhotoAlbumLink` types and helper functions.
- [x] Run `bun run test src/trip/photo-albums.test.ts`.

### Task 3: Page Component

**Files:**
- Create: `frontend/src/components/TripPhotosPage.tsx`
- Create: `frontend/src/components/TripPhotosPage.test.tsx`

- [x] Write failing component tests for rendering albums, permission-gated add/edit/delete, copy/open link actions, and unsafe URL handling.
- [x] Implement the component with compact summary, provider filters, album grid, inspector, and dialogs.
- [x] Run `bun run test src/components/TripPhotosPage.test.tsx`.

### Task 4: App Wiring

**Files:**
- Modify: `frontend/src/app/SagittariusApp.tsx`
- Create: `frontend/app/trips/[tripId]/photos/page.tsx`
- Modify: `frontend/src/trip/trip-fixtures.ts`
- Test: `frontend/src/components/SagittariusApp.test.tsx`

- [x] Write failing app tests for routing to Photos and local create persistence.
- [x] Add `photos` planning view, route page, local create/update/delete handlers, fixture albums, and nav label.
- [x] Run focused app tests.

### Task 5: Verification And Commit

**Files:**
- All files touched above.

- [x] Run focused unit/component suites.
- [x] Run `bun run typecheck`.
- [x] Check `git diff`, then commit the implementation.
