# Tailwind Storybook Hybrid Wave 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start the shared UI migration by making Button, Badge, and Panel emit Tailwind utility classes while preserving the existing semantic bridge classes used by legacy route CSS.

**Architecture:** This is a bridge migration, not a full selector removal. `frontend/src/components/ui.tsx` uses the Wave 1 `cn()` helper and Tailwind utilities as the component-local default, but still emits `button`, `button--*`, `badge`, and `badge--*` classes so existing route-specific selectors keep working. Storybook expands shared UI state coverage before implementation changes land.

**Tech Stack:** Next 16, React 19, TypeScript 6, Tailwind CSS v4, Vitest, Storybook.

---

## File Structure

- Modify `frontend/src/components/ui.test.tsx`: update shared primitive expectations from CSS-only classes to hybrid Tailwind + legacy bridge classes.
- Modify `frontend/src/components/ui.tsx`: import `cn()` and add Tailwind utility class maps for Button, Badge, and Panel.
- Modify `frontend/src/components/ui.stories.tsx`: add disabled and long Thai button states.
- Modify `frontend/src/components/Badge.stories.tsx`: cover all badge tones and add a long Thai label state.
- Do not remove `.button` or `.badge` selectors from `frontend/app/globals.css` in this wave because raw legacy buttons and route-specific selectors still use them.

## Task 1: Update Shared UI Tests First

**Files:**
- Modify: `frontend/src/components/ui.test.tsx`

- [ ] **Step 1: Replace the shared primitive class test**

In `frontend/src/components/ui.test.tsx`, replace the first test body with this content:

```ts
  it("composes Tailwind defaults, legacy bridge classes, and custom classes", () => {
    render(
      <Panel className="trip-panel" aria-label="Panel">
        <Button className="trip-action">Save</Button>
        <Button variant="danger" disabled>
          Delete
        </Button>
        <Badge className="trip-badge">Ready</Badge>
      </Panel>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass(
      "button",
      "button--primary",
      "inline-flex",
      "bg-[var(--color-primary)]",
      "trip-action",
    );
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
      "button",
      "button--danger",
      "disabled:bg-[var(--color-surface-muted)]",
    );
    expect(screen.getByLabelText("Panel")).toHaveClass(
      "panel",
      "grid",
      "gap-3",
      "rounded-[var(--radius-lg)]",
      "trip-panel",
    );
    expect(screen.getByText("Ready")).toHaveClass("badge", "badge--neutral", "inline-flex", "rounded-full", "trip-badge");
  });
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/components/ui.test.tsx
```

Expected result: FAIL because `Button`, `Badge`, and `Panel` do not yet emit Tailwind utility classes.

## Task 2: Migrate Shared UI Primitives To Hybrid Tailwind Classes

**Files:**
- Modify: `frontend/src/components/ui.tsx`

- [ ] **Step 1: Replace `ui.tsx` with the hybrid implementation**

Use this complete content for `frontend/src/components/ui.tsx`:

```tsx
import { cloneElement, isValidElement } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactElement, ReactNode } from "react";
import { cn } from "@/src/lib/cn";

const buttonBaseClassName = [
  "button",
  "inline-flex",
  "min-h-9",
  "items-center",
  "justify-center",
  "gap-2",
  "rounded-[var(--radius-sm)]",
  "border",
  "border-transparent",
  "px-3",
  "py-[7px]",
  "text-[13px]",
  "font-extrabold",
  "no-underline",
  "transition-[background,border-color,color,box-shadow]",
  "duration-150",
  "disabled:text-[var(--color-text-subtle)]",
  "disabled:bg-[var(--color-surface-muted)]",
  "disabled:shadow-none",
];

const buttonVariantClassNames = {
  primary: [
    "button--primary",
    "bg-[var(--color-primary)]",
    "text-white",
    "shadow-[0_10px_20px_rgb(15_118_110_/_0.16)]",
    "hover:enabled:bg-[var(--color-primary-strong)]",
  ],
  secondary: [
    "button--secondary",
    "w-full",
    "border-[var(--color-border)]",
    "bg-[var(--color-surface)]",
    "text-[var(--color-primary-strong)]",
  ],
  ghost: [
    "button--ghost",
    "border-[var(--color-border)]",
    "bg-[var(--color-surface)]",
    "text-[var(--color-text-muted)]",
  ],
  danger: [
    "button--danger",
    "border-[var(--color-danger-border)]",
    "bg-[var(--color-danger-soft)]",
    "text-[#b91c1c]",
  ],
} satisfies Record<ButtonVariant, string[]>;

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  asChild = false,
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; variant?: ButtonVariant }) {
  const nextClassName = cn(buttonBaseClassName, buttonVariantClassNames[variant], className);
  if (asChild && isValidElement<{ className?: string }>(children)) {
    return cloneElement(children as ReactElement<{ className?: string }>, {
      className: cn(nextClassName, children.props.className),
    });
  }

  return (
    <button className={nextClassName} {...props}>
      {children}
    </button>
  );
}

export function Panel({ children, className = "", ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section
      className={cn(
        "panel",
        "grid",
        "gap-3",
        "rounded-[var(--radius-lg)]",
        "border",
        "border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
        "p-4",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

const badgeBaseClassName = [
  "badge",
  "inline-flex",
  "min-h-6",
  "items-center",
  "justify-center",
  "rounded-full",
  "border",
  "border-[var(--color-border)]",
  "bg-[var(--color-surface)]",
  "px-[9px]",
  "py-0.5",
  "text-[11px]",
  "font-extrabold",
  "leading-4",
  "text-[var(--color-text-muted)]",
  "whitespace-nowrap",
];

const badgeToneClassNames = {
  neutral: ["badge--neutral"],
  primary: ["badge--primary", "border-[var(--color-primary-border)]", "bg-[var(--color-primary-soft)]", "text-[var(--color-primary-strong)]"],
  route: ["badge--route", "border-[var(--color-route-border)]", "bg-[var(--color-route-soft)]", "text-[#1d4ed8]"],
  warning: ["badge--warning", "border-[var(--color-warning-border)]", "bg-[var(--color-warning-soft)]", "text-[var(--color-warning-strong)]"],
  success: ["badge--success", "border-[var(--color-success-border)]", "bg-[var(--color-success-soft)]", "text-[#15803d]"],
  danger: ["badge--danger", "border-[var(--color-danger-border)]", "bg-[var(--color-danger-soft)]", "text-[var(--color-danger)]"],
} satisfies Record<BadgeTone, string[]>;

type BadgeTone = "neutral" | "primary" | "route" | "warning" | "success" | "danger";

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return <span className={cn(badgeBaseClassName, badgeToneClassNames[tone], className)}>{children}</span>;
}
```

- [ ] **Step 2: Run the focused test**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/components/ui.test.tsx
```

Expected result: PASS.

- [ ] **Step 3: Run typecheck**

Run from `frontend/`:

```bash
bun run typecheck
```

Expected result: PASS.

## Task 3: Expand Storybook Shared UI States

**Files:**
- Modify: `frontend/src/components/ui.stories.tsx`
- Modify: `frontend/src/components/Badge.stories.tsx`

- [ ] **Step 1: Update button stories**

In `frontend/src/components/ui.stories.tsx`, add these stories after `Danger`:

```tsx
export const Disabled: ButtonStory = { args: { children: "กำลังบันทึก", variant: "primary", disabled: true } };
export const LongThaiLabel: ButtonStory = {
  args: { children: "บันทึกแผนทริปทั้งหมดให้เพื่อนเห็นพร้อมกัน", variant: "secondary" },
};
```

- [ ] **Step 2: Update badge stories**

Replace `frontend/src/components/Badge.stories.tsx` with this complete content:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Badge, Panel } from "./ui";

const meta = {
  title: "Design System/Badges",
  component: Badge,
  parameters: { layout: "centered" },
  tags: ["ai-generated"],
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = { args: { tone: "neutral", children: "Draft" } };
export const Primary: Story = { args: { tone: "primary", children: "กำลังวางแผน" } };
export const Route: Story = { args: { tone: "route", children: "Route" } };
export const Warning: Story = { args: { tone: "warning", children: "ต้องคุยกัน" } };
export const Success: Story = { args: { tone: "success", children: "พร้อมแล้ว" } };
export const Danger: Story = { args: { tone: "danger", children: "ปิดใช้งาน" } };
export const LongThaiLabel: Story = { args: { tone: "warning", children: "ต้องตรวจข้อมูลการจองก่อนแชร์ให้เพื่อน" } };

export const Gallery: Story = {
  args: { tone: "neutral", children: "Gallery" },
  render: () => (
    <Panel>
      <Badge tone="neutral">Draft</Badge>
      <Badge tone="primary">กำลังวางแผน</Badge>
      <Badge tone="route">Route</Badge>
      <Badge tone="warning">ต้องคุยกัน</Badge>
      <Badge tone="success">พร้อมแล้ว</Badge>
      <Badge tone="danger">ปิดใช้งาน</Badge>
    </Panel>
  ),
  play: async ({ canvas }) => {
    const badge = canvas.getByText("พร้อมแล้ว");
    await expect(badge).toHaveClass("badge--success");
    await expect(badge).toHaveClass("bg-[var(--color-success-soft)]");
  },
};
```

- [ ] **Step 3: Run Storybook contract tests**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/storybook.contract.test.ts src/components/ui.test.tsx
```

Expected result: PASS.

## Task 4: Wave 2 Verification

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

- [ ] **Step 6: Check working tree**

Run from repo root:

```bash
git status --short
```

Expected result: only intended Wave 2 files are modified before commit.

## Self-Review

- Spec coverage: Wave 2 migrates shared primitives toward Tailwind and expands Storybook state coverage while preserving route CSS compatibility.
- Red-flag scan: no deferred implementation gaps remain.
- Compatibility note: global `.button` and `.badge` CSS remains because legacy raw buttons and contextual route selectors still depend on it.
