# Tailwind Storybook Hybrid Wave 5 Members Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Members page shell, summary stats, command bar, and create-member panel to Tailwind-first bridge classes while preserving legacy CSS selectors.

**Architecture:** `TripMembersPage` remains the stateful controller for member filters, invite copy, create-member form, and management callbacks. This wave adds Tailwind utilities through the existing `cn()` helper to the top-level Members surface and command areas, but keeps `.members-*`, `.member-*`, and `.invite-*` selectors in place so existing global CSS and responsive rules still apply. `PeoplePanel` row controls are intentionally left for a later slice because they contain denser permission-specific controls.

**Tech Stack:** Next 16, React 19, TypeScript 6, Tailwind CSS v4, Vitest, Storybook, Playwright fallback for rendered QA.

---

## File Structure

- Modify `frontend/src/components/TripMembersPage.test.tsx`: assert Members bridge classes for the page shell, stats grid/card, command bar/actions/meta, and create panel.
- Modify `frontend/src/components/TripMembersPage.tsx`: import `cn()` and add Tailwind bridge class arrays to Members shell, summary stats, command bar, action buttons, status feedback, and create form/panel.
- Modify `frontend/src/components/MembersTemplate.stories.tsx`: add Storybook play assertions that the template emits the new bridge classes.
- Do not remove `.members-*`, `.member-*`, `.invite-*`, `.people-*`, or `.person-*` selectors from `frontend/app/globals.css` in this wave.

## Task 1: Add Members Bridge Tests

**Files:**
- Modify: `frontend/src/components/TripMembersPage.test.tsx`

- [ ] **Step 1: Add shell and command bridge assertions**

Inside `TripMembersPage`, in the `handles successful member-management actions` test, add these assertions immediately after `const props = renderMembers({ trip: claimedTrip });`:

```ts
    expect(screen.getByRole("region", { name: /สมาชิกทริป/i })).toHaveClass("members-page", "grid", "gap-3");
    expect(screen.getByRole("region", { name: /สรุปสมาชิก/i })).toHaveClass("member-stat-grid", "grid", "gap-3");
    expect(screen.getAllByText(/สมาชิกทั้งหมด/i)[0].closest(".member-stat")).toHaveClass(
      "member-stat",
      "grid",
      "rounded-[var(--radius-md)]",
    );
    expect(screen.getByRole("region", { name: /แถบคำสั่งสมาชิก/i })).toHaveClass("member-command-bar", "grid", "gap-3");
```

- [ ] **Step 2: Add create panel bridge assertions**

In the same test, after clicking the open-create button, add:

```ts
    expect(screen.getByRole("region", { name: /เพิ่มสมาชิก/i })).toHaveClass("member-create-panel", "grid", "rounded-[var(--radius-lg)]");
    expect(screen.getByLabelText(/ชื่อสมาชิกใหม่/i).closest("form")).toHaveClass("member-create-form", "grid", "gap-3");
```

- [ ] **Step 3: Run focused test and verify it fails**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/components/TripMembersPage.test.tsx
```

Expected result: FAIL because `TripMembersPage` does not yet emit the Tailwind bridge utility classes.

## Task 2: Add Members Tailwind Bridge Classes

**Files:**
- Modify: `frontend/src/components/TripMembersPage.tsx`

- [ ] **Step 1: Import `cn()`**

Add this import with the existing local imports:

```ts
import { cn } from "@/src/lib/cn";
```

- [ ] **Step 2: Add bridge class arrays after the props interface**

Add these constants after `interface TripMembersPageProps`:

```ts
const membersPageClassName = ["members-page", "grid", "min-h-full", "min-w-0", "gap-3", "bg-transparent", "px-6", "py-[22px]", "pb-7"];
const memberStatGridClassName = ["member-stat-grid", "grid", "grid-cols-5", "gap-3", "w-full"];
const memberStatClassName = [
  "member-stat",
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
  "shadow-[0_10px_24px_rgb(15_23_42_/_0.04)]",
];
const memberCommandBarClassName = ["member-command-bar", "grid", "min-w-0", "gap-3", "rounded-[var(--radius-lg)]", "border", "border-[var(--color-border)]", "bg-[var(--color-surface)]", "p-4", "shadow-[0_12px_28px_rgb(15_23_42_/_0.05)]"];
const memberCommandFieldsClassName = ["member-command-fields", "grid", "min-w-0", "grid-cols-3", "gap-3"];
const memberCommandActionsClassName = ["member-command-actions", "flex", "min-w-0", "flex-wrap", "items-center", "justify-end", "gap-2"];
const memberCommandMetaClassName = ["member-command-meta", "grid", "min-w-0", "grid-cols-[minmax(0,1fr)_auto]", "items-center", "gap-2"];
const memberActionButtonClassName = ["inline-flex", "min-h-10", "min-w-0", "items-center", "justify-center", "gap-2", "rounded-[var(--radius-md)]", "border", "px-3", "text-sm", "font-extrabold", "leading-5", "transition-[border-color,box-shadow,transform,background,color]", "duration-150", "focus-visible:outline-none", "focus-visible:ring-2", "focus-visible:ring-[var(--color-primary-border)]"];
const memberResetButtonClassName = ["member-filter-reset", "border-[var(--color-border)]", "bg-[var(--color-surface-subtle)]", "text-[var(--color-text-muted)]", "hover:border-[var(--color-primary)]", "hover:text-[var(--color-primary-strong)]"];
const inviteCopyButtonClassName = ["invite-copy-button", "border-[var(--color-primary)]", "bg-[var(--color-primary)]", "text-white", "hover:-translate-y-px", "hover:shadow-[0_12px_22px_rgb(15_118_110_/_0.18)]", "disabled:cursor-not-allowed", "disabled:border-[var(--color-border)]", "disabled:bg-[var(--color-surface-muted)]", "disabled:text-[var(--color-text-muted)]", "disabled:shadow-none"];
const memberCreateButtonClassName = ["member-create-button", "border-[var(--color-primary)]", "bg-[var(--color-primary-soft)]", "text-[var(--color-primary-strong)]", "hover:-translate-y-px", "hover:shadow-[0_12px_22px_rgb(15_118_110_/_0.12)]", "disabled:cursor-not-allowed", "disabled:border-[var(--color-border)]", "disabled:bg-[var(--color-surface-muted)]", "disabled:text-[var(--color-text-muted)]", "disabled:shadow-none"];
const copyFeedbackClassName = ["copy-feedback", "inline-flex", "min-h-8", "items-center", "justify-center", "rounded-full", "border", "border-[var(--color-border)]", "bg-[var(--color-surface-subtle)]", "px-3", "text-xs", "font-extrabold", "leading-4", "text-[var(--color-text-muted)]"];
const memberCreatePanelClassName = ["member-create-panel", "grid", "min-w-0", "gap-3", "rounded-[var(--radius-lg)]", "border", "border-[var(--color-primary-border)]", "bg-[var(--color-primary-soft)]", "p-4"];
const memberCreateFormClassName = ["member-create-form", "grid", "min-w-0", "grid-cols-[minmax(0,1fr)_minmax(180px,240px)_auto]", "items-end", "gap-3"];
```

- [ ] **Step 3: Apply bridge classes in JSX**

Replace these class attributes:

```tsx
<section className="members-page" aria-label={t.members.pageLabel}>
<section className="member-stat-grid" aria-label={t.members.summaryLabel}>
<div className="member-stat">
<section className="member-command-bar" aria-label={t.members.commandBar}>
<div className="member-command-fields">
<div className="member-command-actions">
<button className="member-filter-reset" type="button" onClick={resetFilters}>
<button className="invite-copy-button" type="button" disabled={!canManagePeople} onClick={copyInviteLink}>
className="member-create-button"
<div className="member-command-meta">
<span className={`copy-feedback copy-feedback--${copyState}`} role="status">
<section className="member-create-panel" aria-label={t.members.createLabel}>
<form className="member-create-form" onSubmit={submitNewMember}>
<button className="member-create-button" type="submit" disabled={!canManagePeople || !newMemberName.trim()}>
```

with:

```tsx
<section className={cn(membersPageClassName)} aria-label={t.members.pageLabel}>
<section className={cn(memberStatGridClassName)} aria-label={t.members.summaryLabel}>
<div className={cn(memberStatClassName)}>
<section className={cn(memberCommandBarClassName)} aria-label={t.members.commandBar}>
<div className={cn(memberCommandFieldsClassName)}>
<div className={cn(memberCommandActionsClassName)}>
<button className={cn(memberActionButtonClassName, memberResetButtonClassName)} type="button" onClick={resetFilters}>
<button className={cn(memberActionButtonClassName, inviteCopyButtonClassName)} type="button" disabled={!canManagePeople} onClick={copyInviteLink}>
className={cn(memberActionButtonClassName, memberCreateButtonClassName)}
<div className={cn(memberCommandMetaClassName)}>
<span className={cn(copyFeedbackClassName, `copy-feedback--${copyState}`)} role="status">
<section className={cn(memberCreatePanelClassName)} aria-label={t.members.createLabel}>
<form className={cn(memberCreateFormClassName)} onSubmit={submitNewMember}>
<button className={cn(memberActionButtonClassName, memberCreateButtonClassName)} type="submit" disabled={!canManagePeople || !newMemberName.trim()}>
```

Apply `cn(memberStatClassName)` to all five summary stat cards.

- [ ] **Step 4: Run focused Members tests**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/components/TripMembersPage.test.tsx
```

Expected result: PASS.

## Task 3: Add Storybook Bridge Assertions

**Files:**
- Modify: `frontend/src/components/MembersTemplate.stories.tsx`

- [ ] **Step 1: Add class assertions to `OwnerThai.play`**

In `OwnerThai.play`, add these assertions after the existing page region check:

```ts
    await expect(canvas.getByRole("region", { name: /สมาชิกทริป/i })).toHaveClass("members-page", "grid");
    await expect(canvas.getByRole("region", { name: /สรุปสมาชิก/i })).toHaveClass("member-stat-grid", "grid");
    await expect(canvas.getByRole("region", { name: /แถบคำสั่งสมาชิก/i })).toHaveClass("member-command-bar", "grid");
```

- [ ] **Step 2: Run focused Storybook contract and Members tests**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/storybook.contract.test.ts src/components/TripMembersPage.test.tsx
```

Expected result: PASS.

## Task 4: Wave 5 Members Verification

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

Expected result: PASS. If `frontend/next-env.d.ts` is changed only by `next typegen`, restore the generated side effect before committing.

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

- `http://127.0.0.1:6006/iframe.html?id=templates-members--owner-thai&viewMode=story`
- `http://127.0.0.1:6006/iframe.html?id=templates-members--traveler&viewMode=story`

Expected result: both stories are nonblank, have no visible framework overlay, have no console errors, have no horizontal overflow, and screenshots show the Members header, stats, command bar, and member list without text overlap on desktop and mobile-sized viewports.

## Self-Review

- Spec coverage: Wave 5 advances the template migration to the Members route shell while retaining Storybook source-of-truth coverage.
- Red-flag scan: no placeholders or deferred implementation instructions remain inside the selected scope.
- Compatibility note: `PeoplePanel` row-level action controls stay on legacy CSS in this wave to keep permission behavior isolated for a later slice.
