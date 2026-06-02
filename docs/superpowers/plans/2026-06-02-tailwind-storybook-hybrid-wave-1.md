# Tailwind Storybook Hybrid Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the Sagittarius frontend for repeated hybrid Tailwind migrations by adding a shared class composition helper and foundation-level contract coverage.

**Architecture:** Wave 1 does not change visible UI. It adds a tiny `cn()` helper under `frontend/src/lib/`, verifies it with unit tests, and adds CSS contract assertions that preserve the hybrid styling boundary: Tailwind import plus global design tokens stay in `globals.css`. Shared UI migration waits for Wave 2.

**Tech Stack:** Next 16, React 19, TypeScript 6, Tailwind CSS v4, Vitest, Storybook.

---

## File Structure

- Create `frontend/src/lib/cn.ts`: shared class composition helper for future Tailwind migrations.
- Create `frontend/src/lib/cn.test.ts`: unit tests for strings, falsy values, conditional values, nested arrays, and existing semantic class preservation.
- Modify `frontend/src/styles.contract.test.ts`: add contract coverage for Tailwind import and the hybrid global CSS boundary.
- Do not modify `frontend/src/components/ui.tsx` in Wave 1. That migration belongs to Wave 2.
- Do not remove selectors from `frontend/app/globals.css` in Wave 1. CSS cleanup starts when a component actually moves to Tailwind.

## Task 1: Add `cn()` Tests

**Files:**
- Create: `frontend/src/lib/cn.test.ts`

- [ ] **Step 1: Write the failing unit tests**

Create `frontend/src/lib/cn.test.ts` with this content:

```ts
import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins string classes and removes empty values", () => {
    expect(cn("button", "", false, null, undefined, "button--primary")).toBe("button button--primary");
  });

  it("keeps conditional classes when the condition resolves to a string", () => {
    const disabled = true;
    const active = false;

    expect(cn("button", disabled && "opacity-60", active && "bg-[var(--color-primary)]")).toBe("button opacity-60");
  });

  it("flattens nested arrays without changing class order", () => {
    expect(cn("panel", ["grid", ["gap-3", null, ["md:grid-cols-2"]]], "rounded-[var(--radius-lg)]")).toBe(
      "panel grid gap-3 md:grid-cols-2 rounded-[var(--radius-lg)]",
    );
  });

  it("preserves existing semantic classes for incremental migration", () => {
    expect(cn("badge", "badge--success", "inline-flex", "items-center")).toBe("badge badge--success inline-flex items-center");
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/lib/cn.test.ts
```

Expected result: FAIL because `src/lib/cn.ts` does not exist.

## Task 2: Implement `cn()`

**Files:**
- Create: `frontend/src/lib/cn.ts`

- [ ] **Step 1: Add the minimal helper**

Create `frontend/src/lib/cn.ts` with this content:

```ts
type ClassValue = string | false | null | undefined | ClassValue[];

export function cn(...values: ClassValue[]): string {
  return values.flatMap(classTokens).join(" ");
}

function classTokens(value: ClassValue): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(classTokens);
  return [value];
}
```

- [ ] **Step 2: Run the focused helper test**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/lib/cn.test.ts
```

Expected result: PASS.

- [ ] **Step 3: Run typecheck for the new helper**

Run from `frontend/`:

```bash
bun run typecheck
```

Expected result: PASS.

- [ ] **Step 4: Commit the helper**

Run from repo root:

```bash
git add frontend/src/lib/cn.ts frontend/src/lib/cn.test.ts
git commit -m "feat: add class composition helper"
```

Expected result: commit succeeds with only the helper files staged.

## Task 3: Add Hybrid CSS Boundary Contracts

**Files:**
- Modify: `frontend/src/styles.contract.test.ts`

- [ ] **Step 1: Add boundary contract assertions**

In `frontend/src/styles.contract.test.ts`, insert this test after the `const css = readFileSync("app/globals.css", "utf8");` line:

```ts
  it("keeps Tailwind available while preserving global design tokens", () => {
    expect(css).toContain('@import "tailwindcss";');
    expect(css).toContain("--font-sans:");
    expect(css).toContain("--shadow-panel:");
    expect(css).toContain("--radius-lg:");
    expect(css).toMatch(/:where\(button,\s*a,\s*input,\s*select,\s*textarea\):focus-visible/);
  });
```

- [ ] **Step 2: Run the focused contract test**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/styles.contract.test.ts
```

Expected result: PASS. The current stylesheet already satisfies this contract; this test protects the migration boundary for later waves.

- [ ] **Step 3: Run frontend unit tests**

Run from `frontend/`:

```bash
bun run test
```

Expected result: PASS.

- [ ] **Step 4: Commit the contract**

Run from repo root:

```bash
git add frontend/src/styles.contract.test.ts
git commit -m "test: guard hybrid tailwind css boundary"
```

Expected result: commit succeeds with only `frontend/src/styles.contract.test.ts` staged.

## Task 4: Wave 1 Verification

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

- [ ] **Step 4: Confirm no unintended production CSS or component migration happened**

Run from repo root:

```bash
git diff --stat HEAD~2..HEAD
```

Expected result includes only:

```text
frontend/src/lib/cn.ts
frontend/src/lib/cn.test.ts
frontend/src/styles.contract.test.ts
```

- [ ] **Step 5: Record Wave 1 completion**

Run from repo root:

```bash
git status --short
```

Expected result: no unstaged or staged changes.

## Self-Review

- Spec coverage: Wave 1 covers the shared class composition helper, confirms design tokens stay in `globals.css`, and adds a CSS boundary guard. It intentionally does not migrate shared UI or remove CSS selectors.
- Red-flag scan: no deferred implementation gaps remain.
- Type consistency: `cn()` accepts `string | false | null | undefined | nested arrays`, matching the tests and future conditional Tailwind usage.
