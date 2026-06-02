# Tailwind Storybook Hybrid Wave 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Continue the hybrid migration by moving two small isolated components, LanguageSwitch and SuggestionPanel, to Tailwind-first bridge classes with Storybook coverage.

**Architecture:** This wave keeps legacy semantic classes because production routes and shared ContextRail CSS still depend on them. Components add Tailwind utility classes through `cn()` while preserving existing class names and DOM semantics. Storybook gains dedicated stories for LanguageSwitch and SuggestionPanel so future AI edits have isolated visual surfaces.

**Tech Stack:** Next 16, React 19, TypeScript 6, Tailwind CSS v4, Vitest, Storybook, Playwright fallback for rendered QA.

---

## File Structure

- Modify `frontend/src/i18n/LanguageSwitch.tsx`: use `cn()` and Tailwind bridge classes.
- Create `frontend/src/i18n/LanguageSwitch.stories.tsx`: document default, Thai, and compact rail-like states.
- Modify `frontend/src/i18n/I18nProvider.test.tsx`: assert Tailwind bridge classes and active state remain accessible.
- Modify `frontend/src/components/SuggestionPanel.tsx`: use `cn()` and Tailwind bridge classes for panel, title row, list, and suggestion items.
- Create `frontend/src/components/SuggestionPanel.stories.tsx`: document default, Thai, empty, and conflicted-heavy states.
- Modify `frontend/src/components/SuggestionPanel.test.tsx`: assert Tailwind bridge classes while preserving filtering behavior.
- Modify `frontend/src/storybook.contract.test.ts`: require the new story categories.
- Do not remove `language-switch`, `suggestion-*`, `module-title-row`, or `detail-section` selectors from `frontend/app/globals.css` in this wave.

## Task 1: Add Tests For Hybrid Class Bridges

**Files:**
- Modify: `frontend/src/i18n/I18nProvider.test.tsx`
- Modify: `frontend/src/components/SuggestionPanel.test.tsx`

- [ ] **Step 1: Update LanguageSwitch test expectations**

In `frontend/src/i18n/I18nProvider.test.tsx`, add these assertions to the end of the `renders English by default` test:

```ts
    expect(screen.getByRole("group", { name: /language/i })).toHaveClass("language-switch", "inline-flex", "rounded-full");
    expect(screen.getByRole("button", { name: "English" })).toHaveClass("language-switch-option--active", "bg-[var(--text-strong,var(--color-text))]");
```

- [ ] **Step 2: Update SuggestionPanel test expectations**

In `frontend/src/components/SuggestionPanel.test.tsx`, add these assertions before the closing brace of the existing test:

```ts
    expect(screen.getByRole("region", { name: /คิวคำแนะนำ/i })).toHaveClass("detail-section", "suggestion-module", "grid");
    expect(screen.getByText("คำแนะนำ (3)").closest(".module-title-row")).toHaveClass("module-title-row", "flex");
    expect(screen.getByText("ผู้ร่วมเดินทาง เสนอการปรับแผน").closest(".suggestion-item")).toHaveClass(
      "suggestion-item",
      "grid",
      "grid-cols-[18px_minmax(0,1fr)]",
    );
```

- [ ] **Step 3: Run focused tests and verify they fail**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/i18n/I18nProvider.test.tsx src/components/SuggestionPanel.test.tsx
```

Expected result: FAIL because the components do not yet emit the Tailwind bridge classes.

## Task 2: Migrate LanguageSwitch To Tailwind Bridge Classes

**Files:**
- Modify: `frontend/src/i18n/LanguageSwitch.tsx`

- [ ] **Step 1: Replace `LanguageSwitch.tsx` with the hybrid implementation**

Use this complete content:

```tsx
"use client";

import { cn } from "@/src/lib/cn";
import { useI18n } from "./I18nProvider";
import type { Locale } from "./types";

const options: Array<{ locale: Locale; label: string }> = [
  { locale: "en", label: "EN" },
  { locale: "th", label: "TH" },
];

const switchClassName = [
  "language-switch",
  "inline-flex",
  "items-center",
  "gap-0.5",
  "rounded-full",
  "border",
  "border-[var(--border-subtle,var(--color-border))]",
  "bg-[color-mix(in_srgb,var(--surface,var(--color-surface))_88%,transparent)]",
  "p-[3px]",
];

const optionClassName = [
  "language-switch-option",
  "min-h-7",
  "min-w-[38px]",
  "rounded-full",
  "border-0",
  "bg-transparent",
  "text-[0.78rem]",
  "font-bold",
  "text-[var(--text-muted,var(--color-text-muted))]",
];

const activeOptionClassName = [
  "language-switch-option--active",
  "bg-[var(--text-strong,var(--color-text))]",
  "text-[var(--surface,var(--color-surface))]",
];

export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={cn(switchClassName, className)} role="group" aria-label={t.common.language.label}>
      {options.map((option) => (
        <button
          type="button"
          key={option.locale}
          className={cn(optionClassName, option.locale === locale && activeOptionClassName)}
          aria-pressed={option.locale === locale}
          aria-label={option.locale === "en" ? t.common.language.switchToEnglish : t.common.language.switchToThai}
          onClick={() => setLocale(option.locale)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Run focused i18n tests**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/i18n/I18nProvider.test.tsx
```

Expected result: PASS.

## Task 3: Migrate SuggestionPanel To Tailwind Bridge Classes

**Files:**
- Modify: `frontend/src/components/SuggestionPanel.tsx`

- [ ] **Step 1: Replace `SuggestionPanel.tsx` with the hybrid implementation**

Use this complete content:

```tsx
import type { Member, Suggestion } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { Icon } from "./icons";

const panelClassName = [
  "detail-section",
  "suggestion-module",
  "grid",
  "gap-1.5",
  "border-b",
  "border-[var(--color-border)]",
  "px-4",
  "py-2.5",
];

const titleRowClassName = ["module-title-row", "flex", "items-center", "justify-between", "gap-2.5"];
const titleButtonClassName = [
  "min-h-[30px]",
  "rounded-[var(--radius-sm)]",
  "border",
  "border-[var(--color-border)]",
  "bg-[var(--color-surface)]",
  "px-2.5",
  "text-xs",
  "font-bold",
  "text-[#334155]",
];
const listClassName = ["suggestion-list", "grid", "gap-1.5"];
const itemBaseClassName = [
  "suggestion-item",
  "grid",
  "grid-cols-[18px_minmax(0,1fr)]",
  "gap-2",
  "text-xs",
  "leading-4",
  "text-[#334155]",
];
const copyClassName = ["grid", "gap-0.5"];

export function SuggestionPanel({ suggestions, members }: { suggestions: Suggestion[]; members: Member[] }) {
  const { t } = useI18n();
  const openSuggestions = suggestions.filter((suggestion) => suggestion.status === "pending" || suggestion.status === "conflicted");

  return (
    <section className={cn(panelClassName)} aria-label={t.suggestions.queueLabel}>
      <div className={cn(titleRowClassName)}>
        <h3 className="m-0 text-[13px] font-extrabold leading-[18px] text-[#334155]">{t.suggestions.title({ count: openSuggestions.length })}</h3>
        <button className={cn(titleButtonClassName)} type="button">{t.suggestions.seeMore}</button>
      </div>
      <div className={cn(listClassName)}>
        {openSuggestions.map((suggestion) => {
          const proposer = members.find((member) => member.id === suggestion.proposerId);
          return (
            <article className={cn(itemBaseClassName, `suggestion-item--${suggestion.status}`)} key={suggestion.id}>
              <Icon
                name={suggestion.status === "conflicted" ? "alertCircle" : "check"}
                className={suggestion.status === "conflicted" ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}
              />
              <div className={cn(copyClassName)}>
                <strong className="font-semibold">{suggestion.proposedPatch.activity ?? t.suggestions.fallback}</strong>
                <span className="text-[var(--color-text-muted)]">{t.suggestions.suggestedUpdate({ name: proposer?.displayName ?? t.appShell.roles.traveler })}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Run focused SuggestionPanel tests**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/components/SuggestionPanel.test.tsx
```

Expected result: PASS.

## Task 4: Add Storybook Coverage

**Files:**
- Create: `frontend/src/i18n/LanguageSwitch.stories.tsx`
- Create: `frontend/src/components/SuggestionPanel.stories.tsx`
- Modify: `frontend/src/storybook.contract.test.ts`

- [ ] **Step 1: Create LanguageSwitch stories**

Create `frontend/src/i18n/LanguageSwitch.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { LanguageSwitch } from "./LanguageSwitch";

const meta = {
  title: "Design System/Language Switch",
  component: LanguageSwitch,
  parameters: { layout: "centered" },
  tags: ["ai-generated"],
} satisfies Meta<typeof LanguageSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
  },
};

export const ThaiSelected: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "ภาษาไทย" }));
    await expect(canvas.getByRole("button", { name: "ภาษาไทย" })).toHaveAttribute("aria-pressed", "true");
  },
};

export const CompactRail: Story = {
  args: { className: "side-rail-language" },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
```

- [ ] **Step 2: Create SuggestionPanel stories**

Create `frontend/src/components/SuggestionPanel.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { tripFixture } from "@/src/demo/trip-fixtures";
import { SuggestionPanel } from "./SuggestionPanel";

const meta = {
  title: "Design System/Suggestion Panel",
  component: SuggestionPanel,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta<typeof SuggestionPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    members: tripFixture.trip.members,
    suggestions: tripFixture.suggestions,
  },
};

export const Thai: Story = {
  args: {
    members: tripFixture.trip.members,
    suggestions: tripFixture.suggestions,
  },
  parameters: { locale: "th" },
};

export const Empty: Story = {
  args: {
    members: tripFixture.trip.members,
    suggestions: tripFixture.suggestions.map((suggestion) => ({ ...suggestion, status: "approved" })),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: /Suggestions \\(0\\)|คำแนะนำ \\(0\\)/ })).toBeVisible();
  },
};

export const ConflictedHeavy: Story = {
  args: {
    members: tripFixture.trip.members,
    suggestions: tripFixture.suggestions.map((suggestion, index) => ({
      ...suggestion,
      id: `${suggestion.id}-conflicted-${index}`,
      status: "conflicted",
    })),
  },
};
```

- [ ] **Step 3: Update storybook contract categories**

In `frontend/src/storybook.contract.test.ts`, add these titles to the `contains design system, template, and page story categories` list:

```ts
      "Design System/Language Switch",
      "Design System/Suggestion Panel",
```

- [ ] **Step 4: Run Storybook contract tests**

Run from `frontend/`:

```bash
bun run vitest --project unit run src/storybook.contract.test.ts
```

Expected result: PASS.

## Task 5: Wave 3 Verification

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

- `http://127.0.0.1:6006/iframe.html?id=design-system-language-switch--thai-selected&viewMode=story`
- `http://127.0.0.1:6006/iframe.html?id=design-system-suggestion-panel--conflicted-heavy&viewMode=story`

Expected result: both stories are nonblank, have no framework overlay, have no console errors, and screenshots show readable controls without overlap on desktop and mobile-sized viewports.

## Self-Review

- Spec coverage: Wave 3 advances the small-component migration with Tailwind bridge classes and Storybook source-of-truth coverage.
- Red-flag scan: no deferred implementation gaps remain.
- Compatibility note: no legacy CSS selectors are removed because current route and ContextRail surfaces still depend on them.
