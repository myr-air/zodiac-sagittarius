# Sagittarius Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the production-oriented Sagittarius travel planning cockpit frontend in `/Users/xiivth/workspaces/zodiac/sagittarius`.

**Architecture:** Create a Next.js App Router app with a focused client-side planning workspace. Keep a backend-ready `tripRepository` boundary so the UI can later swap local seed/state for Rust REST and WebSocket APIs. The Smart Itinerary Table is the source of truth, with a collapsible left rail and a right context rail driven by selected row, validation, suggestions, expenses, and presence.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Vitest, React Testing Library, Playwright/Built-in Browser for rendered QA.

---

## File Structure

- Create `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `eslint.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`.
- Create `src/app/SagittariusApp.tsx` for the top-level client composition.
- Create `src/trip/types.ts`, `src/trip/seed.ts`, `src/trip/itinerary.ts`, `src/trip/repository.ts`, `src/trip/storage.ts`, `src/trip/suggestions.ts`, `src/trip/expenses.ts`.
- Create component files under `src/components/`: `AppShell.tsx`, `CommandBar.tsx`, `SmartItineraryTable.tsx`, `ContextRail.tsx`, `SuggestionPanel.tsx`, `PeoplePanel.tsx`, `ui.tsx`, `icons.tsx`.
- Create tests for pure logic and important UI interactions in `src/trip/*.test.ts` and `src/components/*.test.tsx`.

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `eslint.config.mjs`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Write scaffold contract tests**

Create `src/project-contract.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Sagittarius project scaffold", () => {
  it("uses Next App Router and the production app entry", () => {
    expect(readFileSync("app/page.tsx", "utf8")).toContain("<SagittariusApp />");
    expect(readFileSync("app/layout.tsx", "utf8")).toContain("Sagittarius");
  });

  it("keeps the Calm Travel Ops design tokens in globals", () => {
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toContain("--color-primary: #0f766e");
    expect(css).toContain("--color-route: #2563eb");
    expect(css).toContain("--color-warning: #f97316");
  });
});
```

- [ ] **Step 2: Run red test**

Run: `npm test -- src/project-contract.test.ts`

Expected: fail because the scaffold does not exist yet.

- [ ] **Step 3: Implement scaffold**

Create a Next App Router app with Tailwind 4, Noto Sans Thai, and Calm Travel Ops tokens from `DESIGN.md`.

- [ ] **Step 4: Run green test**

Run: `npm test -- src/project-contract.test.ts`

Expected: pass.

## Task 2: Backend-Ready Trip Domain

**Files:**
- Create: `src/trip/types.ts`, `src/trip/seed.ts`, `src/trip/itinerary.ts`, `src/trip/repository.ts`, `src/trip/storage.ts`, `src/trip/suggestions.ts`, `src/trip/expenses.ts`
- Test: `src/trip/itinerary.test.ts`, `src/trip/repository.test.ts`

- [ ] **Step 1: Write failing logic tests**

Cover day grouping, validation warnings, now/next calculation, selected plan filtering, repository save/load, capability flags, suggestion conflict states, and expense summary.

- [ ] **Step 2: Run red tests**

Run: `npm test -- src/trip`

Expected: fail because trip domain modules do not exist.

- [ ] **Step 3: Implement trip domain**

Port Taurus' strong typed itinerary model and Joii's capability/expense discipline into a compact Sagittarius model. Use seed data for Hong Kong + Shenzhen with Thai/English rows.

- [ ] **Step 4: Run green tests**

Run: `npm test -- src/trip`

Expected: pass.

## Task 3: Production Planning Cockpit UI

**Files:**
- Create: `src/app/SagittariusApp.tsx`
- Create: `src/components/ui.tsx`, `src/components/icons.tsx`, `src/components/AppShell.tsx`, `src/components/CommandBar.tsx`, `src/components/SmartItineraryTable.tsx`, `src/components/ContextRail.tsx`, `src/components/SuggestionPanel.tsx`, `src/components/PeoplePanel.tsx`
- Test: `src/components/SagittariusApp.test.tsx`, `src/components/SmartItineraryTable.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Test that the app renders the trip cockpit first, not a landing page; that the sidebar collapses; that table row selection drives context rail content; and that organizer/traveler/viewer capabilities affect edit controls.

- [ ] **Step 2: Run red UI tests**

Run: `npm test -- src/components`

Expected: fail because components do not exist.

- [ ] **Step 3: Implement UI components**

Build the three-column cockpit with compact controls, scoped table scroll, Lucide-like inline SVG icons, no emoji chrome, no nested cards, and local interaction state.

- [ ] **Step 4: Run green UI tests**

Run: `npm test -- src/components`

Expected: pass.

## Task 4: Responsive Styling and UX Polish

**Files:**
- Modify: `app/globals.css`
- Modify: component files from Task 3

- [ ] **Step 1: Add CSS contract tests**

Create `src/styles.contract.test.ts` to verify no purple-heavy Joii tokens, table scroll containment selectors, responsive breakpoints, reduced-motion support, and focus-visible styles.

- [ ] **Step 2: Run red CSS contract**

Run: `npm test -- src/styles.contract.test.ts`

Expected: fail until final selectors exist.

- [ ] **Step 3: Implement responsive polish**

Desktop uses 220px rail, fluid table, and 320px context rail. Tablet collapses the rail and stacks context. Mobile uses compact top nav and scoped horizontal table scroll only.

- [ ] **Step 4: Run green CSS contract**

Run: `npm test -- src/styles.contract.test.ts`

Expected: pass.

## Task 5: Verification

**Files:**
- No production file changes unless verification finds issues.

- [ ] **Step 1: Run full automated checks**

Run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

- [ ] **Step 2: Run rendered QA**

Start production app, then verify with the Browser plugin at `320`, `768`, `1024`, and `1440` widths. Check page identity, nonblank render, no framework overlay, console health, screenshot evidence, sidebar toggle, row selection, role switch, and scoped table scroll.

- [ ] **Step 3: Fix any issues and rerun the relevant check**

Do not claim completion until fresh verification evidence passes.
