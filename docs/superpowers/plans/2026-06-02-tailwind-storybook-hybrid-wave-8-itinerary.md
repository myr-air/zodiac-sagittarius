# Tailwind Storybook Hybrid Wave 8 Itinerary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Itinerary table shell to hybrid Tailwind classes while preserving table behavior, legacy selectors, and Storybook coverage.

**Architecture:** `SmartItineraryTable` remains the stateful table component for grouping, collapse, reorder, drag preview, and row selection. This wave adds Tailwind bridge classes to the top-level panel, action bar, scroll frame, table, day rows, data rows, row controls, map links, and advisory summary while keeping semantic selectors such as `.table-panel`, `.smart-table`, `.day-group`, `.data-row`, and `.row-select` for existing global CSS. Complex table column sizing and collapsed-row animation remain in `globals.css`.

**Tech Stack:** React 19, Next 16, Tailwind CSS v4 utilities, Storybook 10, Vitest, Testing Library, Playwright.

---

### Task 1: Add Itinerary Bridge Class Tests

**Files:**
- Modify: `frontend/src/components/SmartItineraryTable.test.tsx`

- [ ] **Step 1: Add a focused class bridge test**

Add a test inside `describe("SmartItineraryTable", () => { ... })`:

```tsx
  it("exposes hybrid Tailwind bridge classes for the table shell and selected row", () => {
    renderTable();

    const panel = screen.getByRole("region", { name: /ตารางแผนเที่ยว/i });
    expect(panel).toHaveClass("table-panel", "grid", "min-h-full");

    const scrollFrame = screen.getByLabelText(/เลื่อนตารางแผนเที่ยว/i);
    expect(scrollFrame).toHaveClass("table-scroll", "overflow-x-auto", "rounded-[var(--radius-md)]");

    const table = screen.getByRole("table", { name: /ตารางแผนเที่ยว/i });
    expect(table).toHaveClass("smart-table", "w-full", "min-w-[960px]");

    const selectedRow = screen.getByRole("row", { name: /Dim Dim Sum/i });
    expect(selectedRow).toHaveClass("data-row", "data-row--selected");
    expect(within(selectedRow).getByRole("button", { name: /เลือกจุด Dim Dim Sum/i })).toHaveClass("row-select", "grid", "min-w-0");
    expect(within(selectedRow).getByRole("link", { name: /แผนที่/i })).toHaveClass("map-link", "underline");
  });
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
cd frontend
bun run vitest --project unit run src/components/SmartItineraryTable.test.tsx
```

Expected: FAIL because `table-panel`, `table-scroll`, table, row-select, and map link do not yet include the Tailwind bridge classes.

### Task 2: Add Itinerary Storybook Assertions

**Files:**
- Modify: `frontend/src/components/ItineraryTemplate.stories.tsx`

- [ ] **Step 1: Extend OwnerThai play assertions**

Update `OwnerThai.play`:

```tsx
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i })).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("region", { name: /ตารางแผนเที่ยว/i })).toHaveClass("table-panel", "grid");
    await expect(canvas.getByLabelText(/เลื่อนตารางแผนเที่ยว/i)).toHaveClass("table-scroll", "overflow-x-auto");
    await expect(canvas.getByRole("table", { name: /ตารางแผนเที่ยว/i })).toHaveClass("smart-table", "min-w-[960px]");
  },
```

- [ ] **Step 2: Run Storybook contract test and confirm it fails before implementation**

Run:

```bash
cd frontend
bun run vitest --project unit run src/storybook.contract.test.ts
```

Expected: PASS if contract only checks story metadata. The new Storybook play assertions are verified later with `bun run test:storybook`.

### Task 3: Migrate SmartItineraryTable Bridge Classes

**Files:**
- Modify: `frontend/src/components/SmartItineraryTable.tsx`

- [ ] **Step 1: Import `cn()`**

Add:

```tsx
import { cn } from "@/src/lib/cn";
```

- [ ] **Step 2: Add plain string class constants**

Add constants below props:

```tsx
const tablePanelClassName = "table-panel grid min-h-full min-w-0 grid-rows-[auto_auto] overflow-visible bg-[var(--color-page)] px-6 py-[22px] pb-7";
const pageHeaderActionsClassName = "page-header-actions flex min-w-0 flex-wrap items-center justify-end gap-2";
const iconButtonClassName = "icon-button inline-flex min-h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[#334155]";
const detailsToggleButtonClassName = "details-toggle-button";
const tableScrollClassName = "table-scroll min-h-0 w-full max-w-full overflow-x-auto overflow-y-clip rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]";
const smartTableClassName = "smart-table w-full min-w-[960px] table-fixed border-collapse text-xs leading-4 text-[#1f2937]";
const dayGroupClassName = "day-group";
const dayRowClassName = "day-row";
const dayToggleClassName = "day-row-content day-toggle flex h-[39px] w-full min-w-0 items-center gap-[9px] border-0 bg-transparent p-0 text-left text-[#334155]";
const dayRouteClassName = "day-route ml-[18px] font-semibold text-[var(--color-text-muted)]";
const dragCellClassName = "drag-cell text-[var(--color-text-subtle)]";
const reorderControlsClassName = "reorder-controls inline-flex items-center justify-center gap-1";
const dragHandleClassName = "drag-handle inline-grid size-[26px] cursor-grab place-items-center rounded-[var(--radius-sm)] border-0 bg-transparent text-[var(--color-text-subtle)] transition-[color,background] duration-150 disabled:cursor-not-allowed";
const reorderButtonClassName = "reorder-button inline-grid size-[26px] place-items-center rounded-[var(--radius-sm)] border-0 bg-transparent text-[var(--color-text-subtle)] transition-[color,background] duration-150 disabled:cursor-not-allowed disabled:opacity-40";
const timeCellClassName = "time-cell font-semibold tabular-nums text-[#0f172a]";
const activityCellClassName = "activity-cell min-w-0";
const rowSelectClassName = "row-select grid min-w-0 gap-0.5 border-0 bg-transparent p-0 text-left text-inherit";
const mapLinkClassName = "map-link text-[#2563eb] underline underline-offset-2";
const emptyWarningClassName = "empty-warning text-[var(--color-text-subtle)]";
const warningSummaryClassName = "warning-summary inline-flex min-w-0 items-center gap-1.5 rounded-full border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] px-2 py-0.5 text-[var(--color-warning-strong)]";
const dataRowClassName = "data-row transition-[background,box-shadow,transform] duration-150";
```

- [ ] **Step 3: Replace static JSX `className` values**

Use direct `className={...}` for static classes. Use `cn()` only for variant composition:

```tsx
className={cn(iconButtonClassName, detailsToggleButtonClassName)}
className={getRowClassName(item, selectedItemId, dragState)}
```

- [ ] **Step 4: Update `getRowClassName`**

Replace array join with `cn()`:

```tsx
function getRowClassName(...): string {
  return cn(
    dataRowClassName,
    selectedItemId === item.id && "data-row--selected",
    dragState.draggedItemId === item.id && "data-row--dragging",
    dragState.overItemId === item.id && "data-row--drop-target",
  );
}
```

### Task 4: Verify and Commit

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run focused unit tests**

```bash
cd frontend
bun run vitest --project unit run src/components/SmartItineraryTable.test.tsx src/storybook.contract.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full verification**

```bash
cd frontend
bun run lint
bun run typecheck
bun run vitest --project unit run --sequence.concurrent=false
bun run test:storybook
bun run build-storybook
```

Expected: all PASS. If `frontend/next-env.d.ts` changes after typegen, restore it before committing unless the generated import change is intentional.

- [ ] **Step 3: Browser QA Storybook**

Start Storybook:

```bash
cd frontend
bun run storybook -- --ci --host 127.0.0.1
```

Check:

- `http://127.0.0.1:6006/iframe.html?id=templates-itinerary--owner-thai&viewMode=story`
- `http://127.0.0.1:6006/iframe.html?id=templates-itinerary--dense&viewMode=story`
- mobile viewport for OwnerThai

Expected: nonblank, no console/page errors, no unintended horizontal page overflow outside the table scroll frame, selected row visible, table scroll frame still works.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-06-02-tailwind-storybook-hybrid-wave-8-itinerary.md frontend/src/components/SmartItineraryTable.tsx frontend/src/components/SmartItineraryTable.test.tsx frontend/src/components/ItineraryTemplate.stories.tsx
git commit -m "feat: migrate itinerary table to hybrid tailwind"
```

## Self-Review

- Spec coverage: This wave advances Wave 4 Page Templates by migrating Itinerary after Overview, Members, and Timeline. It keeps Storybook as source of truth through template assertions and browser QA.
- Placeholder scan: No placeholders remain.
- Type consistency: All referenced files, props, labels, and command names match the inspected codebase.
