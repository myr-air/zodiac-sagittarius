# Bookings And Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional `Bookings & Docs` trip workspace page for tickets, reservations, and travel documents without storing files on the server.

**Architecture:** Add `BookingDoc` as a trip-domain entity and source of truth. Implement filtering, summaries, visibility, and relation helpers in `frontend/src/trip/booking-docs.ts`; render the UX through `BookingsDocsPage` with a ledger, inspector, and create/edit dialog; wire it into the existing local trip state and route shell.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Testing Library, Tailwind v4 utilities, existing Sagittarius i18n and component primitives.

---

### Task 1: Domain Types And Helpers

**Files:**
- Modify: `frontend/src/trip/types.ts`
- Create: `frontend/src/trip/booking-docs.ts`
- Create: `frontend/src/trip/booking-docs.test.ts`

- [ ] **Step 1: Write failing helper tests**

Create tests for summary totals, upcoming item, visibility rules, filters, and relation lookups.

Run: `cd frontend && bun run test src/trip/booking-docs.test.ts`

Expected: FAIL because `booking-docs.ts` does not exist.

- [ ] **Step 2: Implement minimal domain helpers**

Add `BookingDoc` types to `types.ts`. Implement helpers:

```ts
buildBookingDocsSummary(docs, members, nowIso)
canViewBookingDoc(doc, member)
filterBookingDocs(docs, filters, trip)
findBookingDocRelations(doc, trip, tasks)
```

- [ ] **Step 3: Run helper tests**

Run: `cd frontend && bun run test src/trip/booking-docs.test.ts`

Expected: PASS.

### Task 2: Seed Data And Routes

**Files:**
- Modify: `frontend/src/trip/seed.ts`
- Modify: `frontend/src/trip/trip-fixtures.ts`
- Modify: `frontend/src/routes/app-routes.ts`
- Modify: `frontend/src/routes/app-routes.test.ts`
- Modify: `frontend/src/components/AppShell.tsx`

- [ ] **Step 1: Write failing route/nav tests**

Add route assertions for `/trips/:tripId/bookings` and nav order:
`Overview`, `Itinerary`, `Map`, `Timeline`, `Bookings & Docs`, `Members`,
`Expenses`.

Run: `cd frontend && bun run test src/routes/app-routes.test.ts`

Expected: FAIL because the route and nav id do not exist.

- [ ] **Step 2: Implement route/nav support**

Add `bookings` to `PlanningView`, `appRoutes.tripBookings`, and nav labels.
Update view resolution in `AppShell`.

- [ ] **Step 3: Add seed booking docs**

Seed flight, hotel, Peak Tram ticket, passport, insurance, and one
`needs_action` item. Use external URLs only.

- [ ] **Step 4: Run route/nav tests**

Run: `cd frontend && bun run test src/routes/app-routes.test.ts`

Expected: PASS.

### Task 3: Bookings & Docs Page

**Files:**
- Create: `frontend/src/components/BookingsDocsPage.tsx`
- Create: `frontend/src/components/BookingsDocsPage.test.tsx`
- Modify: `frontend/src/components/icons.tsx`
- Modify: `frontend/src/i18n/messages.ts`

- [ ] **Step 1: Write failing component tests**

Cover render, filtering, inspector selection, sensitive locked row state, and
create/edit dialog submit.

Run: `cd frontend && bun run test src/components/BookingsDocsPage.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 2: Implement page UI**

Use existing design tokens and primitives. Desktop: summary strip, filter bar,
ledger, inspector. Mobile: compact rows with stable actions. Dialog supports
title, type, status, visibility, provider, confirmation, dates, cost, travelers,
external link, and relations.

- [ ] **Step 3: Run component tests**

Run: `cd frontend && bun run test src/components/BookingsDocsPage.test.tsx`

Expected: PASS.

### Task 4: App Wiring And Mutations

**Files:**
- Modify: `frontend/src/app/SagittariusApp.tsx`
- Modify: `frontend/src/components/SagittariusApp.test.tsx`
- Modify: `frontend/src/trip/api-client.ts`
- Modify: `frontend/src/trip/api-contract.ts`

- [ ] **Step 1: Write failing app wiring tests**

Cover navigation to `Bookings & Docs`, local create/update/delete mutation,
and API cockpit loading retaining `bookingDocs`.

Run: `cd frontend && bun run test src/components/SagittariusApp.test.tsx -t "booking"`

Expected: FAIL because the page is not wired.

- [ ] **Step 2: Implement local state wiring**

Add selected booking state and handlers for create/update/delete. Local mode
uses existing commit/history flow and increments versions.

- [ ] **Step 3: Implement API type boundary**

Allow `bookingDocs` in cockpit data. If backend mutation methods are not yet
available, keep mutations local-only in local mode and preserve loaded API data
read-only until backend endpoints are added.

- [ ] **Step 4: Run app wiring tests**

Run: `cd frontend && bun run test src/components/SagittariusApp.test.tsx -t "booking"`

Expected: PASS.

### Task 5: Verification And QA

**Files:**
- Modify only files touched by prior tasks as needed.

- [ ] **Step 1: Run focused tests**

Run:

```bash
cd frontend
bun run test src/trip/booking-docs.test.ts src/routes/app-routes.test.ts src/components/BookingsDocsPage.test.tsx src/components/SagittariusApp.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `cd frontend && bun run typecheck`

Expected: PASS.

- [ ] **Step 3: Run browser QA**

Start the dev server and verify `/trips/<encoded-trip-id>/bookings` at 1440px,
1024px, 768px, and 320px. Check external link controls, inspector/dialog,
console errors, and page-level horizontal scroll.

- [ ] **Step 4: Commit**

Commit all implementation files with a feature commit after verification.
