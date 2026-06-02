# Tailwind Storybook Hybrid Wave 6 People Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `PeoplePanel` member rows, status pills, presence pills, controls, and empty state to Tailwind-first bridge classes and add direct Storybook coverage for the reusable component.

**Architecture:** `PeoplePanel` remains a presentational/member-action component with the same props and callbacks. This wave adds Tailwind utilities via the existing `cn()` helper while preserving legacy selectors such as `.people-module`, `.people-list`, `.person-row`, `.member-controls`, `.member-state-pill`, `.presence-pill`, and `.members-empty-state`. Members route styling can still rely on global CSS while Storybook gains a focused design-system story for row density and read-only states.

**Tech Stack:** Next 16, React 19, TypeScript 6, Tailwind CSS v4, Vitest, Storybook, Playwright fallback for rendered QA.

---

## File Structure

- Modify `frontend/src/components/PeoplePanel.test.tsx`: assert Tailwind bridge classes on module, list, row, status stack, action controls, and empty state.
- Modify `frontend/src/components/PeoplePanel.tsx`: import `cn()` and add Tailwind bridge class arrays for module, rows, status pills, presence pills, controls, buttons/selects, and empty state.
- Create `frontend/src/components/PeoplePanel.stories.tsx`: add direct Storybook stories for manager, read-only, and empty states.
- Modify `frontend/src/storybook.contract.test.ts`: require `Design System/People Panel`.
- Do not remove legacy PeoplePanel CSS selectors from `frontend/app/globals.css` in this wave.

## Task 1: Add PeoplePanel Bridge Tests

**Files:**
- Modify: `frontend/src/components/PeoplePanel.test.tsx`

- [ ] **Step 1: Add bridge assertions to the role/action test**

Inside `lets organizers change roles and disable participant access`, add these assertions after `render(...)` and before interactions:

```ts
    expect(screen.getByRole("region", { name: /People and presence/i })).toHaveClass("detail-section", "people-module", "grid", "gap-3");
    expect(screen.getByText(/Explorer Friend/i).closest(".person-row")).toHaveClass(
      "person-row",
      "grid",
      "rounded-[var(--radius-sm)]",
    );
    expect(screen.getByLabelText(/Status for Explorer Friend/i)).toHaveClass("member-status-stack", "flex", "flex-wrap");
    expect(screen.getByLabelText(/Role for Explorer Friend/i)).toHaveClass("member-role-select", "min-h-8");
    expect(screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i })).toHaveClass("reset-claim-button", "inline-flex");
```

- [ ] **Step 2: Add read-only presence bridge assertions**

Inside `shows a read-only command center for non-managers`, add these assertions after `render(...)`:

```ts
    expect(screen.getByText(/ออฟไลน์ 1 ชม./i)).toHaveClass("presence-pill", "inline-flex", "whitespace-nowrap");
```

- [ ] **Step 3: Add empty-state bridge assertions**

Add this test near the other `PeoplePanel` direct tests:

```ts
  it("bridges the empty member state to Tailwind classes", () => {
    render(
      <PeoplePanel
        members={[]}
        currentMemberId="member-aom"
        emptyMessage="ไม่มีสมาชิกในตัวกรองนี้"
        onResetFilters={vi.fn()}
      />,
    );

    expect(screen.getByText("ไม่มีสมาชิกในตัวกรองนี้").closest(".members-empty-state")).toHaveClass(
      "members-empty-state",
      "grid",
      "rounded-[var(--radius-md)]",
    );
    expect(screen.getByRole("button", { name: /ล้างตัวกรอง/i })).toHaveClass("reset-claim-button", "inline-flex");
  });
```

- [ ] **Step 4: Run focused test and verify it fails**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/components/PeoplePanel.test.tsx
```

Expected result: FAIL because `PeoplePanel` does not yet emit the Tailwind bridge utility classes.

## Task 2: Add PeoplePanel Tailwind Bridge Classes

**Files:**
- Modify: `frontend/src/components/PeoplePanel.tsx`

- [ ] **Step 1: Import `cn()`**

Add this import:

```ts
import { cn } from "@/src/lib/cn";
```

- [ ] **Step 2: Add class arrays after the props type block**

Add these constants below the component props type:

```ts
const peopleModuleClassName = ["detail-section", "people-module", "grid", "min-w-0", "gap-3", "rounded-[var(--radius-md)]", "border", "border-[var(--color-border)]", "bg-[var(--color-surface)]", "p-3.5"];
const peopleListClassName = ["people-list", "grid", "min-w-0", "gap-2"];
const personRowClassName = ["person-row", "grid", "min-w-0", "grid-cols-[34px_minmax(0,1fr)_auto]", "items-center", "gap-2.5", "rounded-[var(--radius-sm)]", "border", "border-[var(--color-border)]", "bg-[var(--color-surface-subtle)]", "p-2.5"];
const personAvatarClassName = ["person-avatar", "grid", "size-[34px]", "place-items-center", "rounded-full", "text-sm", "font-extrabold", "text-white"];
const memberIdentityClassName = ["member-identity", "grid", "min-w-0", "gap-1"];
const memberStatusStackClassName = ["member-status-stack", "flex", "min-w-0", "flex-wrap", "gap-1.5"];
const memberStatePillClassName = ["member-state-pill", "inline-flex", "min-h-[22px]", "items-center", "rounded-full", "border", "px-2", "py-0.5", "text-[11px]", "font-extrabold", "leading-4"];
const memberControlsClassName = ["member-controls", "flex", "min-w-0", "flex-wrap", "justify-end", "gap-1.5"];
const memberRoleSelectClassName = ["member-role-select", "min-h-8", "max-w-32", "rounded-[var(--radius-sm)]", "border", "border-[var(--color-border)]", "bg-[var(--color-surface)]", "px-2", "text-xs", "font-extrabold", "text-[var(--color-text)]"];
const resetClaimButtonClassName = ["reset-claim-button", "inline-flex", "min-h-8", "items-center", "justify-center", "rounded-[var(--radius-sm)]", "border", "border-[var(--color-border)]", "bg-[var(--color-surface)]", "px-2.5", "text-xs", "font-extrabold", "text-[var(--color-primary-strong)]", "transition-[border-color,box-shadow,transform]", "duration-150", "hover:-translate-y-px", "hover:border-[var(--color-primary)]", "focus-visible:outline-none", "focus-visible:ring-2", "focus-visible:ring-[var(--color-primary-border)]"];
const presencePillClassName = ["presence-pill", "inline-flex", "min-h-[22px]", "items-center", "justify-center", "justify-self-end", "whitespace-nowrap", "rounded-full", "px-2", "text-[11px]", "font-extrabold", "leading-4"];
const membersEmptyStateClassName = ["members-empty-state", "grid", "min-w-0", "justify-items-center", "gap-2", "rounded-[var(--radius-md)]", "border", "border-dashed", "border-[var(--color-border-strong)]", "p-7", "text-center", "text-[var(--color-text-muted)]"];
```

- [ ] **Step 3: Apply bridge classes in JSX**

Replace:

```tsx
<section className="detail-section people-module" aria-label="People and presence">
<div className="people-list">
<div className="members-empty-state">
<div className="person-row" data-access-status={member.accessStatus ?? "active"} key={member.id}>
<span className="person-avatar" ...>
<div className="member-identity">
<div className="member-status-stack" aria-label={`Status for ${member.displayName}`}>
<span className={`member-state-pill member-state-pill--...`}>
<div className="member-controls">
className="member-role-select"
className="reset-claim-button"
<span className={`presence-pill presence-pill--${member.presence}`}>
```

with `cn()` calls:

```tsx
<section className={cn(peopleModuleClassName)} aria-label="People and presence">
<div className={cn(peopleListClassName)}>
<div className={cn(membersEmptyStateClassName)}>
<div className={cn(personRowClassName)} data-access-status={member.accessStatus ?? "active"} key={member.id}>
<span className={cn(personAvatarClassName)} ...>
<div className={cn(memberIdentityClassName)}>
<div className={cn(memberStatusStackClassName)} aria-label={`Status for ${member.displayName}`}>
<span className={cn(memberStatePillClassName, `member-state-pill--...`)}>
<div className={cn(memberControlsClassName)}>
className={cn(memberRoleSelectClassName)}
className={cn(resetClaimButtonClassName)}
<span className={cn(presencePillClassName, `presence-pill--${member.presence}`)}>
```

Also update `resetFiltersButton()` to render:

```tsx
return onResetFilters ? <button className={cn(resetClaimButtonClassName)} type="button" onClick={onResetFilters}>ล้างตัวกรอง</button> : null;
```

- [ ] **Step 4: Run focused PeoplePanel tests**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/components/PeoplePanel.test.tsx
```

Expected result: PASS.

## Task 3: Add PeoplePanel Storybook Coverage

**Files:**
- Create: `frontend/src/components/PeoplePanel.stories.tsx`
- Modify: `frontend/src/storybook.contract.test.ts`

- [ ] **Step 1: Add `PeoplePanel.stories.tsx`**

Create:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { seedTrip } from "@/src/trip/seed";
import { PeoplePanel } from "./PeoplePanel";

const managerArgs = {
  members: seedTrip.members.filter((member) => member.id !== "member-viewer"),
  currentMemberId: "member-aom",
  canManagePeople: true,
  onChangeMemberAccessStatus: () => {},
  onChangeCurrentMemberPassword: () => {},
  onChangeMemberRole: () => {},
  onResetMemberClaim: () => {},
};

const meta = {
  title: "Design System/People Panel",
  component: PeoplePanel,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta<typeof PeoplePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Manager: Story = {
  args: managerArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: /People and presence/i })).toHaveClass("people-module", "grid");
    await expect(canvas.getByLabelText(/Status for Explorer Friend/i)).toHaveClass("member-status-stack", "flex");
  },
};

export const ReadOnly: Story = {
  args: {
    ...managerArgs,
    currentMemberId: "member-nam",
    canManagePeople: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/ออฟไลน์ 1 ชม./i)).toHaveClass("presence-pill", "inline-flex");
  },
};

export const Empty: Story = {
  args: {
    members: [],
    currentMemberId: "member-aom",
    emptyMessage: "ไม่มีสมาชิกในตัวกรองนี้",
    onResetFilters: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("ไม่มีสมาชิกในตัวกรองนี้").closest(".members-empty-state")).toHaveClass("grid");
    await userEvent.click(canvas.getByRole("button", { name: /ล้างตัวกรอง/i }));
  },
};
```

- [ ] **Step 2: Update Storybook contract**

In `frontend/src/storybook.contract.test.ts`, add this title to the design-system list:

```ts
"Design System/People Panel",
```

- [ ] **Step 3: Run focused Storybook contract and PeoplePanel tests**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/storybook.contract.test.ts src/components/PeoplePanel.test.tsx
```

Expected result: PASS.

## Task 4: Wave 6 PeoplePanel Verification

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

- [ ] **Step 3: Run full unit tests**

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

- `http://127.0.0.1:6006/iframe.html?id=design-system-people-panel--manager&viewMode=story`
- `http://127.0.0.1:6006/iframe.html?id=design-system-people-panel--read-only&viewMode=story`
- `http://127.0.0.1:6006/iframe.html?id=design-system-people-panel--empty&viewMode=story`

Expected result: all stories are nonblank, have no visible framework overlay, have no console errors, have no horizontal overflow, and screenshots show row controls, read-only presence, and empty state without text overlap.

## Self-Review

- Spec coverage: Wave 6 advances hybrid Tailwind migration for reusable member row UI and adds direct Storybook source-of-truth coverage.
- Red-flag scan: no placeholders or deferred implementation instructions remain inside this selected scope.
- Compatibility note: global CSS selectors remain available so route-level Members responsive rules continue to apply.
