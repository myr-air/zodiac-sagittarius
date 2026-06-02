# Tailwind Storybook Hybrid Wave 7 Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Timeline template shell, day cards, stop list, stop buttons, copy, metadata, and warning chips to Tailwind-first bridge classes.

**Architecture:** `TimelineView` remains a presentational route/template component that receives itinerary items and callback props. This wave adds Tailwind utilities through `cn()` while preserving legacy selectors such as `.timeline-panel`, `.timeline-grid`, `.timeline-day`, `.timeline-stop`, `.timeline-stop-button`, and `.timeline-warning`, because route-level responsive CSS still depends on them. No timeline behavior, grouping, or route data derivation changes in this wave.

**Tech Stack:** Next 16, React 19, TypeScript 6, Tailwind CSS v4, Vitest, Storybook, Playwright fallback for rendered QA.

---

## File Structure

- Create `frontend/src/components/TimelineView.test.tsx`: focused bridge and interaction tests for `TimelineView`.
- Modify `frontend/src/components/TimelineView.tsx`: import `cn()` and add Tailwind bridge class arrays for timeline shell, grid, day cards, stop list, stop rows, buttons, time/copy/meta/warning areas.
- Modify `frontend/src/components/TimelineTemplate.stories.tsx`: add Storybook play assertions that the Timeline template emits the bridge classes.
- Do not remove `.timeline-*` selectors from `frontend/app/globals.css` in this wave.

## Task 1: Add Timeline Bridge Tests

**Files:**
- Create: `frontend/src/components/TimelineView.test.tsx`

- [ ] **Step 1: Create the focused Timeline test file**

Create:

```tsx
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/demo/trip-fixtures";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { TimelineView } from "./TimelineView";

function renderTimeline(overrides: Partial<Parameters<typeof TimelineView>[0]> = {}) {
  const props: Parameters<typeof TimelineView>[0] = {
    contextRailOpen: false,
    endDate: tripFixture.trip.endDate,
    items: tripFixture.planItems,
    selectedItemId: "item-dimdim",
    startDate: tripFixture.trip.startDate,
    tripName: tripFixture.trip.name,
    onSelectItem: vi.fn(),
    onToggleContextRail: vi.fn(),
    ...overrides,
  };
  renderWithI18n(<TimelineView {...props} />, { locale: "th" });
  return props;
}

describe("TimelineView", () => {
  it("bridges the timeline shell and selected stop to Tailwind classes", () => {
    renderTimeline();

    const timeline = screen.getByRole("region", { name: /ไทม์ไลน์ทริป/i });
    expect(timeline).toHaveClass("timeline-panel", "grid", "gap-3");

    const grid = timeline.querySelector(".timeline-grid");
    expect(grid).toHaveClass("timeline-grid", "grid", "gap-3");

    const selectedButton = screen.getByRole("button", { name: /เลือกจุดในไทม์ไลน์ Dim Dim Sum/i });
    const selectedStop = selectedButton.closest(".timeline-stop");
    expect(selectedStop).toHaveClass("timeline-stop", "timeline-stop--selected", "relative");
    expect(selectedButton).toHaveClass("timeline-stop-button", "grid", "min-h-[86px]");
    expect(within(selectedButton).getByText(/Dim Dim Sum/i).closest(".timeline-copy")).toHaveClass("timeline-copy", "grid", "min-w-0");
  });

  it("keeps stop selection and details toggle behavior", async () => {
    const user = userEvent.setup();
    const props = renderTimeline();

    await user.click(screen.getByRole("button", { name: /เลือกจุดในไทม์ไลน์ Symphony of Lights/i }));
    expect(props.onSelectItem).toHaveBeenCalledWith("item-symphony");

    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));
    expect(props.onToggleContextRail).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run focused test and verify it fails**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/components/TimelineView.test.tsx
```

Expected result: FAIL because `TimelineView` does not yet emit the Tailwind bridge utility classes.

## Task 2: Add Timeline Tailwind Bridge Classes

**Files:**
- Modify: `frontend/src/components/TimelineView.tsx`

- [ ] **Step 1: Import `cn()`**

Add this import:

```ts
import { cn } from "@/src/lib/cn";
```

- [ ] **Step 2: Add bridge class arrays after props interface**

Add these constants after `interface TimelineViewProps`:

```ts
const timelinePanelClassName = ["timeline-panel", "grid", "min-h-full", "min-w-0", "gap-3", "bg-[var(--color-page)]", "px-6", "py-[22px]", "pb-7"];
const timelineGridClassName = ["timeline-grid", "grid", "w-full", "grid-cols-3", "gap-3", "p-0", "mb-[30px]"];
const timelineDayClassName = ["timeline-day", "overflow-hidden", "rounded-[var(--radius-md)]", "border", "border-[var(--color-border)]", "bg-[var(--color-surface)]"];
const timelineDayHeaderClassName = ["timeline-day-header", "flex", "min-h-[50px]", "items-center", "justify-between", "gap-2.5", "border-b", "border-[var(--color-border)]", "bg-[var(--color-surface)]", "px-3.5", "py-2.5"];
const timelineDayHeaderCopyClassName = ["grid", "min-w-0", "gap-px"];
const timelineStopListClassName = ["timeline-stop-list", "grid", "m-0", "list-none", "gap-1.5", "p-0"];
const timelineStopClassName = ["timeline-stop", "relative"];
const timelineStopButtonClassName = ["timeline-stop-button", "relative", "z-[1]", "grid", "min-h-[86px]", "w-full", "grid-cols-[56px_34px_minmax(0,1fr)]", "items-start", "gap-2.5", "border-0", "border-b", "border-[var(--color-border)]", "bg-[var(--color-surface)]", "px-3.5", "py-2.5", "text-left", "text-[var(--color-text)]", "transition-[background,box-shadow]", "duration-150", "hover:bg-[var(--color-primary-soft)]", "focus-visible:bg-[var(--color-primary-soft)]", "focus-visible:outline-none"];
const timelineTimeClassName = ["timeline-time", "col-start-1", "row-span-3", "grid", "min-w-0", "gap-0.5"];
const timelineNodeClassName = ["timeline-node", "col-start-2", "row-start-1", "grid", "size-8", "place-items-center", "rounded-full", "border-2", "border-[var(--color-surface)]", "bg-[var(--color-route-soft)]", "text-[var(--color-route)]", "shadow-[0_0_0_1px_var(--color-route-border)]"];
const timelineCopyClassName = ["timeline-copy", "col-start-3", "row-start-1", "grid", "min-w-0", "gap-0.5"];
const timelineMetaClassName = ["timeline-meta", "col-start-3", "row-start-2", "flex", "min-w-0", "flex-wrap", "content-start", "gap-x-2", "gap-y-1"];
const timelineWarningClassName = ["timeline-warning", "col-start-3", "row-start-3", "inline-flex", "min-h-6", "w-fit", "items-center", "gap-1.5", "rounded-[var(--radius-sm)]", "border", "border-[var(--color-warning-border)]", "px-2", "py-0.5"];
```

- [ ] **Step 3: Apply bridge classes in JSX**

Replace class attributes:

```tsx
<section className="timeline-panel" ...>
<div className="timeline-grid">
<article className="timeline-day" ...>
<header className="timeline-day-header">
<div>
<ol className="timeline-stop-list">
<li className={selected ? "timeline-stop timeline-stop--selected" : "timeline-stop"} ...>
className="timeline-stop-button"
<span className="timeline-time">
<span className="timeline-node" ...>
<span className="timeline-copy">
<span className="timeline-meta">
<span className="timeline-warning">
```

with:

```tsx
<section className={cn(timelinePanelClassName)} ...>
<div className={cn(timelineGridClassName)}>
<article className={cn(timelineDayClassName)} ...>
<header className={cn(timelineDayHeaderClassName)}>
<div className={cn(timelineDayHeaderCopyClassName)}>
<ol className={cn(timelineStopListClassName)}>
<li className={cn(timelineStopClassName, selected && "timeline-stop--selected")} ...>
className={cn(timelineStopButtonClassName)}
<span className={cn(timelineTimeClassName)}>
<span className={cn(timelineNodeClassName)} ...>
<span className={cn(timelineCopyClassName)}>
<span className={cn(timelineMetaClassName)}>
<span className={cn(timelineWarningClassName)}>
```

- [ ] **Step 4: Run focused Timeline tests**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/components/TimelineView.test.tsx
```

Expected result: PASS.

## Task 3: Add Storybook Bridge Assertions

**Files:**
- Modify: `frontend/src/components/TimelineTemplate.stories.tsx`

- [ ] **Step 1: Add class assertions to `OwnerThai.play`**

In `OwnerThai.play`, add:

```ts
    await expect(canvas.getByRole("region", { name: /ไทม์ไลน์ทริป/i })).toHaveClass("timeline-panel", "grid");
    await expect(canvas.getByRole("button", { name: /เลือกจุดในไทม์ไลน์ Dim Dim Sum/i })).toHaveClass("timeline-stop-button", "grid");
```

- [ ] **Step 2: Run focused Storybook contract and Timeline tests**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/storybook.contract.test.ts src/components/TimelineView.test.tsx
```

Expected result: PASS.

## Task 4: Wave 7 Timeline Verification

**Files:**
- No file edits.

- [ ] **Step 1: Run lint**

Run from `frontend/`:

```bash
bun run lint
```

Expected result: PASS.

- [ ] **Step 2: Run typecheck**

Run from `frontend/`:

```bash
bun run typecheck
```

Expected result: PASS. If `frontend/next-env.d.ts` changes only because of `next typegen`, restore that generated side effect before committing.

- [ ] **Step 3: Run unit tests**

Run from `frontend/`:

```bash
bun run vitest --project unit run --sequence.concurrent=false
```

Expected result: PASS.

- [ ] **Step 4: Run Storybook tests**

Run from `frontend/`:

```bash
bun run test:storybook
```

Expected result: PASS.

- [ ] **Step 5: Build Storybook**

Run from `frontend/`:

```bash
bun run build-storybook
```

Expected result: PASS.

- [ ] **Step 6: Rendered Storybook QA**

Start Storybook from `frontend/`:

```bash
bun run storybook -- --ci --host 127.0.0.1
```

Use Playwright fallback if the Browser plugin is unavailable. Check:

- `http://127.0.0.1:6006/iframe.html?id=templates-timeline--owner-thai&viewMode=story`
- `http://127.0.0.1:6006/iframe.html?id=templates-timeline--empty&viewMode=story`

Expected result: both stories are nonblank, have no visible framework overlay, have no console errors, have no horizontal overflow, and screenshots show the Timeline header, day cards, selected stop, and empty state without text overlap on desktop and mobile-sized viewports.

## Self-Review

- Spec coverage: Wave 7 follows the approved suggested order by migrating Timeline after Overview and Members.
- Red-flag scan: no placeholders or deferred implementation instructions remain inside this selected scope.
- Compatibility note: no `.timeline-*` selectors are removed because route CSS still owns connector lines and responsive timeline rules.
