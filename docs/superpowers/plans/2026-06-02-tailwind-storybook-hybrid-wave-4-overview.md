# Tailwind Storybook Hybrid Wave 4 Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start Wave 4 template migration by moving the Overview page shell, hero, and travel cockpit cards to Tailwind-first bridge classes.

**Architecture:** This is an incremental template migration. `OverviewPage` keeps all legacy semantic selectors so the existing CSS and responsive rules remain active, then adds Tailwind utility classes via `cn()` to the shell, hero, hero subregions, and cockpit cards. Dense checklist, dialog, highlight board, and list CSS stay unchanged for later Wave 4 slices.

**Tech Stack:** Next 16, React 19, TypeScript 6, Tailwind CSS v4, Vitest, Storybook, Playwright fallback for rendered QA.

---

## File Structure

- Modify `frontend/src/components/OverviewPage.test.tsx`: add class bridge expectations for the page shell, hero, and cockpit cards.
- Modify `frontend/src/components/OverviewPage.tsx`: import `cn()` and add Tailwind bridge class arrays to the page shell, `OverviewHero`, and `CockpitCard`.
- Modify `frontend/src/components/OverviewTemplate.stories.tsx`: add Storybook play assertions that the Overview template emits the new bridge classes.
- Do not remove `.overview-*` selectors from `frontend/app/globals.css` in this wave.

## Task 1: Add Overview Bridge Tests

**Files:**
- Modify: `frontend/src/components/OverviewPage.test.tsx`

- [ ] **Step 1: Add class assertions to the photo-first overview test**

In `frontend/src/components/OverviewPage.test.tsx`, inside the `renders the photo-first cockpit hero and visual highlight board from trip data` test, add these assertions after `const hero = screen.getByRole("region", { name: /Hong Kong \\+ Shenzhen Trip/i });`:

```ts
    expect(screen.getByRole("region", { name: /Trip overview/i })).toHaveClass("overview-page", "grid", "gap-3");
    expect(hero).toHaveClass("overview-hero", "grid", "overflow-hidden", "rounded-[var(--radius-lg)]");
```

Then add this assertion after `const cockpit = screen.getByRole("region", { name: /travel cockpit/i });`:

```ts
    expect(cockpit).toHaveClass("overview-travel-cockpit", "grid", "grid-cols-3", "gap-3");
    expect(within(cockpit).getByText(/จุดถัดไป/i).closest(".overview-cockpit-card")).toHaveClass(
      "overview-cockpit-card",
      "grid",
      "rounded-[var(--radius-md)]",
    );
```

- [ ] **Step 2: Run focused test and verify it fails**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/components/OverviewPage.test.tsx
```

Expected result: FAIL because `OverviewPage`, `OverviewHero`, and `CockpitCard` do not yet emit the Tailwind bridge classes.

## Task 2: Add Overview Tailwind Bridge Classes

**Files:**
- Modify: `frontend/src/components/OverviewPage.tsx`

- [ ] **Step 1: Import `cn()`**

Add this import below the existing i18n type imports:

```ts
import { cn } from "@/src/lib/cn";
```

- [ ] **Step 2: Add class arrays after the props interface**

Add these constants after `interface OverviewPageProps`:

```ts
const overviewPageClassName = ["overview-page", "grid", "min-h-full", "min-w-0", "gap-3", "bg-transparent", "px-6", "py-[22px]", "pb-7"];
const overviewCockpitClassName = ["overview-travel-cockpit", "grid", "grid-cols-3", "gap-3", "w-full", "mb-3.5"];

const overviewHeroBaseClassName = [
  "overview-hero",
  "relative",
  "grid",
  "min-h-[228px]",
  "grid-cols-[minmax(0,1fr)_minmax(260px,320px)]",
  "items-center",
  "gap-6",
  "overflow-hidden",
  "rounded-[var(--radius-lg)]",
  "border",
  "p-6",
  "shadow-[0_14px_34px_rgb(15_23_42_/_0.07)]",
];

const overviewHeroCopyClassName = ["overview-hero-copy", "relative", "z-[2]", "grid", "min-w-0", "max-w-[760px]", "content-center", "gap-2.5"];
const overviewHeroKickerClassName = [
  "overview-hero-kicker",
  "w-fit",
  "max-w-full",
  "overflow-hidden",
  "rounded-full",
  "border",
  "bg-white/70",
  "px-2.5",
  "py-1.5",
  "text-xs",
  "font-extrabold",
  "leading-4",
  "text-ellipsis",
  "whitespace-nowrap",
];
const overviewHeroMetaClassName = ["overview-hero-meta", "mt-1", "flex", "flex-wrap", "gap-2"];
const overviewHeroVisualClassName = ["overview-hero-visual", "absolute", "z-[1]", "hidden", "overflow-hidden", "rounded-[var(--radius-lg)]", "opacity-40"];
const overviewHeroAsideClassName = [
  "overview-hero-aside",
  "relative",
  "z-[2]",
  "grid",
  "min-w-0",
  "content-center",
  "gap-2.5",
  "self-center",
  "rounded-[var(--radius-lg)]",
  "border",
  "border-white/70",
  "bg-white/80",
  "p-3",
  "shadow-[0_14px_30px_rgb(15_23_42_/_0.07)]",
];
const overviewHeroSettlementsClassName = [
  "overview-hero-settlements",
  "justify-self-stretch",
  "rounded-full",
  "border",
  "bg-white/70",
  "px-2.5",
  "py-1.5",
  "text-center",
  "text-xs",
  "font-extrabold",
  "leading-4",
];

const cockpitCardBaseClassName = [
  "overview-cockpit-card",
  "grid",
  "min-h-[126px]",
  "min-w-0",
  "content-start",
  "gap-2",
  "rounded-[var(--radius-md)]",
  "border",
  "border-[var(--color-border)]",
  "bg-[var(--color-surface)]",
  "p-3.5",
  "text-left",
  "shadow-[0_10px_24px_rgb(15_23_42_/_0.04)]",
];
const cockpitCardButtonClassName = [
  "overview-cockpit-card--button",
  "cursor-pointer",
  "transition-[border-color,box-shadow,transform]",
  "duration-150",
  "hover:-translate-y-px",
  "hover:border-[var(--color-primary)]",
  "hover:shadow-[0_16px_30px_rgb(15_23_42_/_0.08)]",
  "focus-visible:-translate-y-px",
  "focus-visible:border-[var(--color-primary)]",
  "focus-visible:shadow-[0_16px_30px_rgb(15_23_42_/_0.08)]",
  "focus-visible:outline-none",
];
const cockpitCardTitleClassName = ["overview-cockpit-card-title", "inline-flex", "min-w-0", "items-center", "gap-2", "text-xs", "font-extrabold", "leading-4", "text-[var(--color-text-muted)]"];
```

- [ ] **Step 3: Apply bridge classes in JSX**

Make these replacements in `OverviewPage.tsx`:

```tsx
<section className="overview-page" aria-label={t.overview.pageLabel}>
```

becomes:

```tsx
<section className={cn(overviewPageClassName)} aria-label={t.overview.pageLabel}>
```

```tsx
<section className="overview-travel-cockpit" aria-label="travel cockpit">
```

becomes:

```tsx
<section className={cn(overviewCockpitClassName)} aria-label="travel cockpit">
```

In `OverviewHero`, replace the root, copy, kicker, meta, visual, aside, and settlements class names:

```tsx
<section className={`overview-hero overview-hero--${visual.tone}`} aria-label={title}>
<div className="overview-hero-copy">
<span className="overview-hero-kicker">{destinationLabel}</span>
<div className="overview-hero-meta" aria-label="trip facts">
<div className="overview-hero-visual" aria-hidden="true">
<div className="overview-hero-aside">
<span className="overview-hero-settlements">{settlementCount} settlements</span>
```

with:

```tsx
<section className={cn(overviewHeroBaseClassName, `overview-hero--${visual.tone}`)} aria-label={title}>
<div className={cn(overviewHeroCopyClassName)}>
<span className={cn(overviewHeroKickerClassName)}>{destinationLabel}</span>
<div className={cn(overviewHeroMetaClassName)} aria-label="trip facts">
<div className={cn(overviewHeroVisualClassName)} aria-hidden="true">
<div className={cn(overviewHeroAsideClassName)}>
<span className={cn(overviewHeroSettlementsClassName)}>{settlementCount} settlements</span>
```

In `CockpitCard`, replace:

```tsx
<div className="overview-cockpit-card-title">
```

with:

```tsx
<div className={cn(cockpitCardTitleClassName)}>
```

Replace the button return:

```tsx
<button className="overview-cockpit-card overview-cockpit-card--button" type="button" aria-label={ariaLabel} onClick={onClick}>
```

with:

```tsx
<button className={cn(cockpitCardBaseClassName, cockpitCardButtonClassName)} type="button" aria-label={ariaLabel} onClick={onClick}>
```

Replace the non-button return:

```tsx
return <div className="overview-cockpit-card">{content}</div>;
```

with:

```tsx
return <div className={cn(cockpitCardBaseClassName)}>{content}</div>;
```

- [ ] **Step 4: Run focused Overview tests**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/components/OverviewPage.test.tsx
```

Expected result: PASS.

## Task 3: Add Storybook Bridge Assertions

**Files:**
- Modify: `frontend/src/components/OverviewTemplate.stories.tsx`

- [ ] **Step 1: Add class assertions to `OwnerThai` play**

In `frontend/src/components/OverviewTemplate.stories.tsx`, inside `OwnerThai.play`, add these assertions after the existing region checks:

```ts
    await expect(canvas.getByRole("region", { name: /Trip overview/i })).toHaveClass("grid");
    await expect(canvas.getByRole("region", { name: /Hong Kong \\+ Shenzhen Trip/i })).toHaveClass("overview-hero", "grid");
    await expect(canvas.getByRole("region", { name: /travel cockpit/i })).toHaveClass("overview-travel-cockpit", "grid", "grid-cols-3");
```

- [ ] **Step 2: Run focused Storybook contract and Overview tests**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/storybook.contract.test.ts src/components/OverviewPage.test.tsx
```

Expected result: PASS.

## Task 4: Wave 4 Overview Verification

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

Expected result: PASS.

- [ ] **Step 3: Run unit tests**

Run from `frontend/`:

```bash
bun run test
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

- `http://127.0.0.1:6006/iframe.html?id=templates-overview--owner-thai&viewMode=story`
- `http://127.0.0.1:6006/iframe.html?id=templates-overview--empty&viewMode=story`

Expected result: both stories are nonblank, have no framework overlay, have no console errors, and screenshots show the overview hero and cockpit without overlap on desktop and mobile-sized viewports.

## Self-Review

- Spec coverage: Wave 4 starts template migration with the lowest-risk Overview shell and cockpit surface.
- Red-flag scan: no deferred implementation gaps remain.
- Compatibility note: no `.overview-*` CSS selectors are removed because the remaining Overview lists, tasks, dialog, and responsive rules still depend on them.
