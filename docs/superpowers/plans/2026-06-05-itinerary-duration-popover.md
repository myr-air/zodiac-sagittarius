# Itinerary Duration Popover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a clean inline duration editor to itinerary rows using a duration pill, end-time display, preset chips, and compact custom inputs.

**Architecture:** Keep duration editing inside `SmartItineraryTable` as row-local UI state, then reuse the existing inline patch path through `SagittariusApp`. Extend `InlineItineraryItemPatch` to include `durationMinutes` so local and API mode share the same mutation flow.

**Tech Stack:** React, TypeScript, Tailwind utility classes, Vitest, Testing Library.

---

### Task 1: Smart Table Duration Interaction

**Files:**
- Modify: `frontend/src/components/SmartItineraryTable.test.tsx`
- Modify: `frontend/src/components/SmartItineraryTable.tsx`
- Modify: `frontend/src/i18n/messages.ts`

- [x] **Step 1: Write failing tests**

Add tests that click the duration pill for `item-dimdim`, choose `1 ชม. 30 นาที`, and submit a custom `2 ชม. 10 นาที` value. Also assert viewer roles cannot open the duration editor.

- [x] **Step 2: Run red test**

Run: `cd frontend && rtk bun run test src/components/SmartItineraryTable.test.tsx`

Expected: FAIL because the duration pill dialog and labels do not exist yet.

- [x] **Step 3: Implement duration editor**

In `SmartItineraryTable.tsx`, extend `InlineItineraryItemPatch` with `durationMinutes`, replace the passive duration text with a button pill, show `start-end` time copy, and render one compact dialog/popover with preset buttons and hour/minute number inputs.

- [x] **Step 4: Add i18n labels**

Add EN/TH labels under `itinerary.row` for inline duration, duration dialog title, preset/custom labels, save/cancel, hours, and minutes.

- [x] **Step 5: Run green test**

Run: `cd frontend && rtk bun run test src/components/SmartItineraryTable.test.tsx`

Expected: PASS.

### Task 2: App Mutation Support

**Files:**
- Modify: `frontend/src/app/SagittariusApp.tsx`
- Modify: `frontend/src/components/SagittariusApp.test.tsx`

- [x] **Step 1: Write failing app test**

Add a test or extend an existing inline update/API patch test to prove duration inline editing sends `{ durationMinutes: 90 }` through `patchItineraryItem` with the current `expectedVersion`.

- [x] **Step 2: Run red app test**

Run: `cd frontend && rtk bun run test src/components/SagittariusApp.test.tsx`

Expected: FAIL because the inline patch type/app mutation does not yet include duration.

- [x] **Step 3: Implement mutation support**

Update `buildInlinePatch` in `SagittariusApp.tsx` so `durationMinutes` is allowed, normalized to a positive integer or `null`, compared against the current item, and passed through API/local updates.

- [x] **Step 4: Run focused tests**

Run: `cd frontend && rtk bun run test src/components/SmartItineraryTable.test.tsx src/components/SagittariusApp.test.tsx`

Expected: PASS.

### Task 3: Verification

**Files:**
- Test only unless contract changes are required.

- [x] **Step 1: Run full verification**

Run:
```bash
cd frontend && rtk bun run test
cd frontend && rtk bun run typecheck
cd frontend && rtk bun run lint
```

Expected: tests and typecheck pass; lint may show existing unrelated warnings only.

- [x] **Step 2: Browser QA**

Use the existing dev server or start one if needed. Verify desktop and mobile: duration pill opens, preset saves, custom duration saves, edit modal still opens, delete modal still works, no console/page errors, mobile table remains horizontally scrollable without body overflow.

- [x] **Step 3: Commit**

Run:
```bash
rtk git add docs/superpowers/plans/2026-06-05-itinerary-duration-popover.md frontend/src/app/SagittariusApp.tsx frontend/src/components/SagittariusApp.test.tsx frontend/src/components/SmartItineraryTable.test.tsx frontend/src/components/SmartItineraryTable.tsx frontend/src/i18n/messages.ts
rtk git commit -m "feat: add itinerary duration popover"
```
