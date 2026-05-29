# Storybook Design System Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Sagittarius so Storybook becomes the reusable design-system, template, and page-state catalog for the actual web frontend.

**Architecture:** Add deterministic trip fixtures first, then build code-native travel motif primitives and Storybook stories around the same props used by the app. Extract page sections into presentational templates where it reduces duplication, while keeping `SagittariusApp` responsible for stateful orchestration and existing user workflows.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, Tailwind CSS 4 globals, Storybook 10 with `@storybook/nextjs-vite`, Vitest, React Testing Library, Bun scripts.

---

## File Structure

- Create `src/trip/fixtures.ts` for deterministic Storybook/test/app demo state.
- Create `src/trip/fixtures.test.ts` for fixture determinism and role/density coverage.
- Create `src/components/motifs.tsx` for code-native SVG/CSS travel motif primitives.
- Create `src/components/ui.stories.tsx`, `src/components/Badge.stories.tsx`, `src/components/PageHeader.stories.tsx`, and `src/components/motifs.stories.tsx`.
- Create `src/components/OverviewTemplate.tsx` and `src/components/OverviewTemplate.stories.tsx`.
- Create page/template stories for current views: `ItineraryTemplate.stories.tsx`, `TimelineTemplate.stories.tsx`, `MapTemplate.stories.tsx`, `MembersTemplate.stories.tsx`, `ItineraryPage.stories.tsx`, `TimelinePage.stories.tsx`, `MapPage.stories.tsx`, and `MembersPage.stories.tsx`.
- Create `src/storybook.contract.test.ts` for required Storybook category coverage.
- Modify `src/app/SagittariusApp.tsx` so seed suggestions, tasks, stop notes, and role fixture lookup come from `src/trip/fixtures.ts`.
- Modify `src/app/SagittariusApp.stories.tsx` to expose full app role/view states.
- Modify `src/components/PageHeader.tsx`, `src/components/ui.tsx`, `src/components/OverviewPage.tsx`, `src/components/TimelineView.tsx`, `src/components/RouteMapView.tsx`, `src/components/TripMembersPage.tsx`, and `src/components/SmartItineraryTable.tsx` only for the fixture, template, and motif integration described in the tasks below.
- Modify `app/globals.css` and `src/styles.contract.test.ts` for Friendly Trip Studio tokens, motif classes, and reduced-motion guardrails.

## Task 1: Shared Trip Fixtures

**Files:**
- Create: `src/trip/fixtures.ts`
- Create: `src/trip/fixtures.test.ts`
- Modify: `src/app/SagittariusApp.tsx`
- Modify: `src/components/OverviewPage.test.tsx`

- [ ] **Step 1: Write failing fixture tests**

Create `src/trip/fixtures.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildDenseTripFixture,
  buildEmptyTripFixture,
  getTripFixtureMember,
  tripFixture,
} from "./fixtures";

describe("trip fixtures", () => {
  it("exposes deterministic owner, traveler, and viewer members", () => {
    expect(getTripFixtureMember("owner").role).toBe("owner");
    expect(getTripFixtureMember("traveler").role).toBe("traveler");
    expect(getTripFixtureMember("viewer").role).toBe("viewer");
    expect(tripFixture.currentMembers.owner.id).toBe(getTripFixtureMember("owner").id);
  });

  it("keeps shared suggestions, tasks, stop notes, and expense summaries deterministic", () => {
    expect(tripFixture.suggestions.map((suggestion) => suggestion.id)).toEqual([
      "suggestion-rating",
      "suggestion-booking",
    ]);
    expect(tripFixture.tasks.map((task) => task.id)).toEqual([
      "task-esim",
      "task-peak-tram",
      "task-dimdim-booking",
      "task-expenses",
    ]);
    expect(tripFixture.stopNotes).toHaveLength(1);
    expect(tripFixture.expenseSummaries.owner.groupSpend).toBeGreaterThan(0);
  });

  it("builds empty and dense trip states without mutating the base seed", () => {
    const empty = buildEmptyTripFixture();
    const dense = buildDenseTripFixture();

    expect(empty.itineraryItems).toEqual([]);
    expect(dense.itineraryItems.length).toBeGreaterThan(tripFixture.trip.itineraryItems.length);
    expect(tripFixture.trip.itineraryItems.length).toBeGreaterThan(0);
    expect(dense.itineraryItems[0]).not.toBe(tripFixture.trip.itineraryItems[0]);
  });
});
```

- [ ] **Step 2: Run red fixture tests**

Run:

```bash
rtk bun run test -- src/trip/fixtures.test.ts
```

Expected: FAIL because `src/trip/fixtures.ts` does not exist.

- [ ] **Step 3: Implement deterministic fixture module**

Create `src/trip/fixtures.ts`:

```ts
import { buildExpenseSummary } from "./expenses";
import { seedTrip } from "./seed";
import type { StopNote, Suggestion, Trip, TripTask } from "./types";

export type TripFixtureRole = "owner" | "organizer" | "traveler" | "viewer";

export const tripFixtureSuggestions: Suggestion[] = [
  {
    id: "suggestion-rating",
    tripId: seedTrip.id,
    proposerId: "member-beam",
    type: "edit",
    targetItemId: "item-dimdim",
    planVariantId: seedTrip.activePlanVariantId,
    proposedPatch: { note: "ร้านนี้ได้รับคะแนนสูง 4.3/5 จาก 8,332 รีวิว" },
    sourceVersion: 4,
    status: "pending",
    createdAt: "2026-05-27T13:00:00.000Z",
  },
  {
    id: "suggestion-booking",
    tripId: seedTrip.id,
    proposerId: "member-beam",
    type: "edit",
    targetItemId: "item-dimdim",
    planVariantId: seedTrip.activePlanVariantId,
    proposedPatch: { note: "แนะนำให้จองคิวล่วงหน้า โดยเฉพาะช่วงสุดสัปดาห์" },
    sourceVersion: 2,
    status: "conflicted",
    createdAt: "2026-05-27T14:00:00.000Z",
  },
];

export const tripFixtureTasks: TripTask[] = [
  { id: "task-esim", title: "ซื้อ eSIM", status: "open", visibility: "private", kind: "prep", createdBy: "member-aom", assigneeId: "member-aom" },
  { id: "task-peak-tram", title: "จอง Peak Tram", status: "done", visibility: "shared", kind: "booking", createdBy: "member-beam", assigneeId: "member-beam", relatedItemId: "item-victoria-peak" },
  { id: "task-dimdim-booking", title: "ยืนยันคิว Dim Dim Sum", status: "open", visibility: "shared", kind: "booking", createdBy: "member-beam", assigneeId: "member-beam", relatedItemId: "item-dimdim" },
  { id: "task-expenses", title: "สรุปค่าใช้จ่ายวันแรก", status: "open", visibility: "shared", kind: "prep", createdBy: "member-beam", assigneeId: "member-beam" },
];

export const tripFixtureStopNotes: StopNote[] = [
  {
    id: "note-dimdim-1",
    tripId: seedTrip.id,
    itemId: "item-dimdim",
    authorId: "member-beam",
    body: "ลองไปเช้าหน่อย ถ้าคิวยาวให้สลับกับ coffee break",
    createdAt: "2026-05-27T12:30:00.000Z",
  },
];

export const tripFixture = {
  trip: seedTrip,
  planItems: seedTrip.itineraryItems.filter((item) => item.planVariantId === seedTrip.activePlanVariantId),
  suggestions: tripFixtureSuggestions,
  tasks: tripFixtureTasks,
  stopNotes: tripFixtureStopNotes,
  currentMembers: {
    owner: seedTrip.members.find((member) => member.role === "owner") ?? seedTrip.members[0],
    organizer: seedTrip.members.find((member) => member.role === "organizer") ?? seedTrip.members[0],
    traveler: seedTrip.members.find((member) => member.role === "traveler") ?? seedTrip.members[0],
    viewer: seedTrip.members.find((member) => member.id === "member-family") ?? seedTrip.members[0],
  },
  expenseSummaries: {
    owner: buildExpenseSummary(seedTrip.expenses, "member-aom"),
    organizer: buildExpenseSummary(seedTrip.expenses, "member-beam"),
    traveler: buildExpenseSummary(seedTrip.expenses, "member-nam"),
    viewer: buildExpenseSummary(seedTrip.expenses, "member-family"),
  },
} as const;

export function getTripFixtureMember(role: TripFixtureRole) {
  return tripFixture.currentMembers[role];
}

export function buildEmptyTripFixture(): Trip {
  return {
    ...seedTrip,
    itineraryItems: [],
    expenses: [],
  };
}

export function buildDenseTripFixture(): Trip {
  const extraItems = seedTrip.itineraryItems.slice(0, 6).map((item, index) => ({
    ...item,
    id: `${item.id}-dense-${index + 1}`,
    day: "2025-05-17",
    sortOrder: 900 + index * 100,
    startTime: `${15 + index}:00`,
    version: item.version + 1,
  }));

  return {
    ...seedTrip,
    itineraryItems: [...seedTrip.itineraryItems.map((item) => ({ ...item })), ...extraItems],
  };
}
```

- [ ] **Step 4: Replace duplicated fixture data in `SagittariusApp`**

In `src/app/SagittariusApp.tsx`, remove local `seedSuggestions`, `seedTasks`, and `seedStopNotes`, then import the fixture constants:

```ts
import {
  tripFixtureStopNotes,
  tripFixtureSuggestions,
  tripFixtureTasks,
} from "@/src/trip/fixtures";
```

Initialize state from copied arrays:

```ts
const [suggestions, setSuggestions] = useState<Suggestion[]>(() => tripFixtureSuggestions.map((suggestion) => ({ ...suggestion })));
const [tasks, setTasks] = useState<TripTask[]>(() => tripFixtureTasks.map((task) => ({ ...task })));
const [stopNotes, setStopNotes] = useState<StopNote[]>(() => tripFixtureStopNotes.map((note) => ({ ...note })));
```

- [ ] **Step 5: Update overview tests to consume fixtures**

In `src/components/OverviewPage.test.tsx`, remove the local `seedTasks` array and import:

```ts
import { tripFixtureTasks } from "@/src/trip/fixtures";
```

Pass `tasks={tripFixtureTasks}` in `renderOverview`.

- [ ] **Step 6: Run green fixture and overview tests**

Run:

```bash
rtk bun run test -- src/trip/fixtures.test.ts src/components/OverviewPage.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit fixtures**

Run:

```bash
rtk git add src/trip/fixtures.ts src/trip/fixtures.test.ts src/app/SagittariusApp.tsx src/components/OverviewPage.test.tsx
rtk git commit -m "refactor: share trip story fixtures"
```

## Task 2: Friendly Trip Studio Tokens And Motifs

**Files:**
- Create: `src/components/motifs.tsx`
- Create: `src/components/motifs.stories.tsx`
- Modify: `app/globals.css`
- Modify: `src/styles.contract.test.ts`

- [ ] **Step 1: Write failing CSS/motif contract assertions**

Add these assertions to `src/styles.contract.test.ts`:

```ts
it("defines Friendly Trip Studio accents and motif classes", () => {
  expect(css).toContain("--color-sunshine: #facc15");
  expect(css).toContain("--color-sky: #38bdf8");
  expect(css).toContain("--color-postcard: #fff7ed");
  expect(css).toContain("--color-coral: #fb7185");
  expect(css).toMatch(/\.travel-motif\s*{/s);
  expect(css).toMatch(/\.travel-motif-path\s*{/s);
  expect(css).toMatch(/\.travel-motif-postcard\s*{/s);
});

it("keeps motif motion reduced-motion safe", () => {
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.travel-motif/s);
});
```

- [ ] **Step 2: Run red CSS contract**

Run:

```bash
rtk bun run test -- src/styles.contract.test.ts
```

Expected: FAIL because the new accent tokens and motif classes do not exist.

- [ ] **Step 3: Implement motif primitives**

Create `src/components/motifs.tsx`:

```tsx
import type { HTMLAttributes } from "react";

type MotifTone = "route" | "sunshine" | "postcard";

interface TravelMotifProps extends HTMLAttributes<HTMLDivElement> {
  tone?: MotifTone;
}

export function TravelMotif({ tone = "route", className = "", ...props }: TravelMotifProps) {
  return (
    <div className={["travel-motif", `travel-motif--${tone}`, className].filter(Boolean).join(" ")} aria-hidden="true" {...props}>
      <svg className="travel-motif-path" viewBox="0 0 220 96" focusable="false">
        <path d="M16 72 C54 18 84 18 112 48 S168 84 204 28" />
        <circle cx="16" cy="72" r="7" />
        <circle cx="112" cy="48" r="6" />
        <circle cx="204" cy="28" r="8" />
      </svg>
      <span className="travel-motif-postcard" />
      <span className="travel-motif-pin" />
    </div>
  );
}

export function TimelineMotif() {
  return <TravelMotif tone="route" className="travel-motif--timeline" />;
}
```

- [ ] **Step 4: Add motif CSS and accent tokens**

In `app/globals.css`, add these tokens to `:root`:

```css
  --color-sunshine: #facc15;
  --color-sky: #38bdf8;
  --color-postcard: #fff7ed;
  --color-coral: #fb7185;
  --color-mint: #a7f3d0;
```

Add motif classes near shared component classes:

```css
.travel-motif {
  position: relative;
  min-width: 180px;
  min-height: 88px;
  color: var(--color-route);
}

.travel-motif-path {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  fill: none;
}

.travel-motif-path path {
  stroke: currentColor;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 8 10;
}

.travel-motif-path circle {
  fill: var(--color-surface);
  stroke: currentColor;
  stroke-width: 3;
}

.travel-motif-postcard,
.travel-motif-pin {
  position: absolute;
  display: block;
  border: 1px solid var(--color-warning-border);
  background: var(--color-postcard);
  box-shadow: 0 10px 24px rgb(15 23 42 / 0.08);
}

.travel-motif-postcard {
  right: 18px;
  bottom: 8px;
  width: 54px;
  height: 36px;
  border-radius: var(--radius-sm);
  transform: rotate(-4deg);
}

.travel-motif-pin {
  left: 34px;
  top: 8px;
  width: 22px;
  height: 22px;
  border-radius: 999px 999px 999px 4px;
  background: var(--color-sunshine);
  transform: rotate(-45deg);
}

.travel-motif--sunshine {
  color: var(--color-warning);
}

.travel-motif--postcard {
  color: var(--color-primary);
}

.travel-motif--timeline {
  min-width: 220px;
}
```

Extend the existing `@media (prefers-reduced-motion: reduce)` block:

```css
  .travel-motif,
  .travel-motif *,
```

- [ ] **Step 5: Add motif stories**

Create `src/components/motifs.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TimelineMotif, TravelMotif } from "./motifs";

const meta = {
  title: "Design System/Travel Motifs",
  component: TravelMotif,
  parameters: { layout: "centered" },
} satisfies Meta<typeof TravelMotif>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Route: Story = { args: { tone: "route" } };
export const Sunshine: Story = { args: { tone: "sunshine" } };
export const Postcard: Story = { args: { tone: "postcard" } };

export const TimelineMoment: Story = {
  render: () => <TimelineMotif />,
};
```

- [ ] **Step 6: Run green CSS contract**

Run:

```bash
rtk bun run test -- src/styles.contract.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit motif system**

Run:

```bash
rtk git add app/globals.css src/styles.contract.test.ts src/components/motifs.tsx src/components/motifs.stories.tsx
rtk git commit -m "feat: add friendly travel motif system"
```

## Task 3: Storybook Contract And Design System Stories

**Files:**
- Create: `src/storybook.contract.test.ts`
- Create: `src/components/ui.stories.tsx`
- Create: `src/components/Badge.stories.tsx`
- Create: `src/components/PageHeader.stories.tsx`
- Modify: `src/components/PageHeader.tsx`
- Modify: `src/components/ui.tsx`
- Modify: `.storybook/preview.ts`

- [ ] **Step 1: Write failing Storybook coverage contract**

Create `src/storybook.contract.test.ts`:

```ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function collectStoryFiles(dir = "src"): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return collectStoryFiles(path);
    return entry.isFile() && entry.name.endsWith(".stories.tsx") ? [path] : [];
  });
}

function storyText() {
  return collectStoryFiles().map((file) => readFileSync(file, "utf8")).join("\n");
}

describe("Storybook template catalog", () => {
  it("contains design system, template, and page story categories", () => {
    const stories = storyText();
    [
      "Design System/Buttons",
      "Design System/Badges",
      "Design System/Page Header",
      "Design System/Travel Motifs",
      "Templates/Workspace Shell",
      "Templates/Overview",
      "Templates/Itinerary",
      "Templates/Timeline",
      "Templates/Map",
      "Templates/Members",
      "Pages/Overview",
      "Pages/Itinerary",
      "Pages/Timeline",
      "Pages/Map",
      "Pages/Members",
    ].forEach((title) => expect(stories).toContain(`title: "${title}"`));
  });

  it("documents role and density states", () => {
    const stories = storyText();
    ["Owner", "Traveler", "Viewer", "Empty", "Dense", "Mobile"].forEach((stateName) => {
      expect(stories).toContain(`export const ${stateName}`);
    });
  });
});
```

- [ ] **Step 2: Run red Storybook contract**

Run:

```bash
rtk bun run test -- src/storybook.contract.test.ts
```

Expected: FAIL because the required stories do not exist yet.

- [ ] **Step 3: Allow page header motifs**

Modify `src/components/PageHeader.tsx` props:

```ts
interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  meta?: ReactNode;
  aside?: ReactNode;
  motif?: ReactNode;
}
```

Render the motif inside the header:

```tsx
{motif ? <div className="page-header-motif">{motif}</div> : null}
{aside}
```

- [ ] **Step 4: Add page header motif CSS**

In `app/globals.css`, add:

```css
.page-header-motif {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  max-width: 240px;
}
```

In the mobile breakpoint, add:

```css
.page-header-motif {
  display: none;
}
```

- [ ] **Step 5: Add button and badge primitive stories**

Create `src/components/ui.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./ui";

const buttonsMeta = {
  title: "Design System/Buttons",
  component: Button,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Button>;

export default buttonsMeta;

type ButtonStory = StoryObj<typeof buttonsMeta>;

export const Primary: ButtonStory = { args: { children: "วางแผนทริป", variant: "primary" } };
export const Secondary: ButtonStory = { args: { children: "ดูรายละเอียด", variant: "secondary" } };
export const Ghost: ButtonStory = { args: { children: "ยกเลิก", variant: "ghost" } };
export const Danger: ButtonStory = { args: { children: "ลบรายการ", variant: "danger" } };
export const Mobile: ButtonStory = {
  args: { children: "เปิดทริป", variant: "primary" },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
```

Create `src/components/Badge.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge, Panel } from "./ui";

const meta = {
  title: "Design System/Badges",
  component: Badge,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { tone: "primary", children: "กำลังวางแผน" } };
export const Route: Story = { args: { tone: "route", children: "Route" } };
export const Warning: Story = { args: { tone: "warning", children: "ต้องคุยกัน" } };

export const Gallery: Story = {
  render: () => (
    <Panel>
      <Badge tone="primary">กำลังวางแผน</Badge>
      <Badge tone="route">Route</Badge>
      <Badge tone="warning">ต้องคุยกัน</Badge>
      <Badge tone="success">พร้อมแล้ว</Badge>
    </Panel>
  ),
};
```

- [ ] **Step 6: Add PageHeader stories**

Create `src/components/PageHeader.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { tripFixture } from "@/src/trip/fixtures";
import { TravelMotif } from "./motifs";
import { formatTripRange, PageHeader, PageUserCard } from "./PageHeader";
import { Icon } from "./icons";

const meta = {
  title: "Design System/Page Header",
  component: PageHeader,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Friendly: Story = {
  args: {
    title: "คุมทริปให้พร้อม",
    subtitle: tripFixture.trip.name,
    description: "พื้นที่กลางของเพื่อน ๆ สำหรับตัดสินใจเรื่องทริป",
    meta: (
      <>
        <span><Icon name="calendar" /> {formatTripRange(tripFixture.trip.startDate, tripFixture.trip.endDate)}</span>
        <span><Icon name="location" /> {tripFixture.trip.destinationLabel}</span>
      </>
    ),
    aside: <PageUserCard color={tripFixture.currentMembers.owner.color} name={tripFixture.currentMembers.owner.displayName} label="จัดทริปกับเพื่อน" />,
    motif: <TravelMotif tone="postcard" />,
  },
};
```

- [ ] **Step 7: Configure Storybook backgrounds**

In `.storybook/preview.ts`, add:

```ts
backgrounds: {
  options: {
    studio: { name: "Friendly Trip Studio", value: "#f8fafc" },
    white: { name: "White", value: "#ffffff" },
  },
},
```

- [ ] **Step 8: Run story contract**

Run:

```bash
rtk bun run test -- src/storybook.contract.test.ts
```

Expected: FAIL with missing `Templates/*` and `Pages/*` categories. This failure is the red state for later template story tasks.

- [ ] **Step 9: Commit design system stories if typecheck passes**

Run:

```bash
rtk bun run typecheck
rtk git add src/storybook.contract.test.ts src/components/ui.stories.tsx src/components/Badge.stories.tsx src/components/PageHeader.stories.tsx src/components/PageHeader.tsx app/globals.css .storybook/preview.ts
rtk git commit -m "test: define storybook catalog contract"
```

Expected: typecheck PASS, and `src/storybook.contract.test.ts` remains in the intentional red state from Step 8 until Task 5 adds the missing template and page stories. Do not run full `bun test` as a green gate yet.

## Task 4: Overview Template Extraction

**Files:**
- Create: `src/components/OverviewTemplate.tsx`
- Create: `src/components/OverviewTemplate.stories.tsx`
- Modify: `src/components/OverviewPage.tsx`
- Modify: `src/components/OverviewPage.test.tsx`

- [ ] **Step 1: Add a focused overview template test**

In `src/components/OverviewPage.test.tsx`, add:

```ts
it("renders the overview from shared fixture data", () => {
  renderOverview("member-aom");

  expect(screen.getByRole("heading", { name: /คุมทริปให้พร้อม/i })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: /Trip checklist/i })).toBeInTheDocument();
  expect(screen.getByText(/Hong Kong \+ Shenzhen/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run overview tests**

Run:

```bash
rtk bun run test -- src/components/OverviewPage.test.tsx
```

Expected: PASS before extraction, establishing behavior to preserve.

- [ ] **Step 3: Create `OverviewTemplate` as a thin presentational wrapper**

Create `src/components/OverviewTemplate.tsx` by moving the stat grid and role-specific section rendering helpers from `OverviewPage.tsx` into exported presentational components. Keep stateful task dialog and filter state in `OverviewPage.tsx` for this pass.

Minimum exported API:

```ts
export interface OverviewTemplateProps {
  trip: Trip;
  currentMember: Member | undefined;
  expenseSummary: ExpenseSummary;
  items: ItineraryItem[];
  suggestions: Suggestion[];
  tasks: TripTask[];
  taskScope: "mine" | "trip" | "all";
  taskStatusFilter: "all" | "open" | "done";
  onTaskScopeChange: (scope: "mine" | "trip" | "all") => void;
  onTaskStatusFilterChange: (status: "all" | "open" | "done") => void;
  onOpenTaskDialog: () => void;
  onToggleTaskStatus: (taskId: string) => void;
}
```

The render output must preserve these labels:

```tsx
<section className="overview-page" aria-label="Trip overview">
  <PageHeader motif={<TravelMotif tone="postcard" />} ... />
  <div className="overview-stat-grid" aria-label="Trip summary">...</div>
  <div className="overview-grid">...</div>
</section>
```

- [ ] **Step 4: Wire `OverviewPage` through `OverviewTemplate`**

Keep local state, `submitTask`, and dialog rendering in `OverviewPage.tsx`, but replace the main page body with:

```tsx
<OverviewTemplate
  trip={trip}
  currentMember={currentMember}
  expenseSummary={expenseSummary}
  items={items}
  suggestions={suggestions}
  tasks={tasks}
  taskScope={taskScope}
  taskStatusFilter={taskStatusFilter}
  onTaskScopeChange={setTaskScope}
  onTaskStatusFilterChange={setTaskStatusFilter}
  onOpenTaskDialog={() => setIsTaskDialogOpen(true)}
  onToggleTaskStatus={onToggleTaskStatus}
/>
```

- [ ] **Step 5: Add overview template stories**

Create `src/components/OverviewTemplate.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildEmptyTripFixture, tripFixture } from "@/src/trip/fixtures";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { OverviewTemplate } from "./OverviewTemplate";

const noop = () => {};

const meta = {
  title: "Templates/Overview",
  component: OverviewTemplate,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof OverviewTemplate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    trip: tripFixture.trip,
    currentMember: tripFixture.currentMembers.owner,
    expenseSummary: tripFixture.expenseSummaries.owner,
    items: tripFixture.planItems,
    suggestions: tripFixture.suggestions,
    tasks: tripFixture.tasks,
    taskScope: "mine",
    taskStatusFilter: "all",
    onTaskScopeChange: noop,
    onTaskStatusFilterChange: noop,
    onOpenTaskDialog: noop,
    onToggleTaskStatus: noop,
  },
};

export const Traveler: Story = {
  args: { ...Owner.args, currentMember: tripFixture.currentMembers.traveler, expenseSummary: tripFixture.expenseSummaries.traveler },
};

export const Viewer: Story = {
  args: { ...Owner.args, currentMember: tripFixture.currentMembers.viewer, expenseSummary: tripFixture.expenseSummaries.viewer },
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    trip: buildEmptyTripFixture(),
    items: [],
    tasks: [],
    suggestions: [],
    expenseSummary: buildExpenseSummary([], tripFixture.currentMembers.owner.id),
  },
};
```

Create `src/components/OverviewPage.stories.tsx` with `title: "Pages/Overview"` if `Pages/Overview` is not covered elsewhere:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OverviewPage } from "./OverviewPage";
import { tripFixture } from "@/src/trip/fixtures";

const meta = {
  title: "Pages/Overview",
  component: OverviewPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof OverviewPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    trip: tripFixture.trip,
    currentMemberId: tripFixture.currentMembers.owner.id,
    expenseSummary: tripFixture.expenseSummaries.owner,
    items: tripFixture.planItems,
    suggestions: tripFixture.suggestions,
    tasks: tripFixture.tasks,
    onCreateTask: () => {},
    onToggleTaskStatus: () => {},
  },
};
```

- [ ] **Step 6: Run overview and story contract tests**

Run:

```bash
rtk bun run test -- src/components/OverviewPage.test.tsx src/storybook.contract.test.ts
```

Expected: Storybook contract still FAILS only for remaining page/template categories. Overview tests PASS.

- [ ] **Step 7: Commit overview extraction**

Run:

```bash
rtk git add src/components/OverviewTemplate.tsx src/components/OverviewTemplate.stories.tsx src/components/OverviewPage.stories.tsx src/components/OverviewPage.tsx src/components/OverviewPage.test.tsx
rtk git commit -m "refactor: expose overview template stories"
```

## Task 5: View Template Stories For Itinerary, Timeline, Map, And Members

**Files:**
- Create: `src/components/ItineraryTemplate.stories.tsx`
- Create: `src/components/TimelineTemplate.stories.tsx`
- Create: `src/components/MapTemplate.stories.tsx`
- Create: `src/components/MembersTemplate.stories.tsx`
- Create: page stories for missing `Pages/*` categories if not already covered.
- Modify: `src/components/TimelineView.tsx`
- Modify: `src/components/RouteMapView.tsx`
- Modify: `src/components/TripMembersPage.tsx`
- Modify: `src/components/SmartItineraryTable.tsx`

- [ ] **Step 1: Add timeline motif to TimelineView**

In `src/components/TimelineView.tsx`, import:

```ts
import { TimelineMotif } from "./motifs";
```

Pass the motif to `PageHeader`:

```tsx
motif={<TimelineMotif />}
```

- [ ] **Step 2: Add route motif to Map and Members pages**

In `src/components/RouteMapView.tsx`, import `TravelMotif` and pass:

```tsx
motif={<TravelMotif tone="route" />}
```

In `src/components/TripMembersPage.tsx`, import `TravelMotif` and pass:

```tsx
motif={<TravelMotif tone="sunshine" />}
```

- [ ] **Step 3: Add itinerary template stories**

Create `src/components/ItineraryTemplate.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildDenseTripFixture, tripFixture } from "@/src/trip/fixtures";
import { SmartItineraryTable } from "./SmartItineraryTable";

const noop = () => {};

const meta = {
  title: "Templates/Itinerary",
  component: SmartItineraryTable,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SmartItineraryTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    canRedo: false,
    canUndo: false,
    contextRailOpen: false,
    endDate: tripFixture.trip.endDate,
    items: tripFixture.planItems,
    role: "owner",
    startDate: tripFixture.trip.startDate,
    selectedItemId: "item-dimdim",
    tripName: tripFixture.trip.name,
    onAddStop: noop,
    onSelectItem: noop,
    onMoveItem: noop,
    onRedo: noop,
    onToggleContextRail: noop,
    onUndo: noop,
  },
};

export const Viewer: Story = { args: { ...Owner.args, role: "viewer" } };
export const Dense: Story = { args: { ...Owner.args, items: buildDenseTripFixture().itineraryItems } };
```

Create `src/components/ItineraryPage.stories.tsx` with `title: "Pages/Itinerary"`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Owner as ItineraryTemplateOwner } from "./ItineraryTemplate.stories";
import { SmartItineraryTable } from "./SmartItineraryTable";

const meta = {
  title: "Pages/Itinerary",
  component: SmartItineraryTable,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SmartItineraryTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = { args: ItineraryTemplateOwner.args };
```

- [ ] **Step 4: Add timeline template stories**

Create `src/components/TimelineTemplate.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildEmptyTripFixture, tripFixture } from "@/src/trip/fixtures";
import { TimelineView } from "./TimelineView";

const noop = () => {};

const meta = {
  title: "Templates/Timeline",
  component: TimelineView,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TimelineView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    contextRailOpen: false,
    endDate: tripFixture.trip.endDate,
    items: tripFixture.planItems,
    selectedItemId: "item-dimdim",
    startDate: tripFixture.trip.startDate,
    tripName: tripFixture.trip.name,
    onSelectItem: noop,
    onToggleContextRail: noop,
  },
};

export const Empty: Story = { args: { ...Owner.args, items: buildEmptyTripFixture().itineraryItems, selectedItemId: "" } };
```

Create `src/components/TimelinePage.stories.tsx` with `title: "Pages/Timeline"`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Owner as TimelineTemplateOwner } from "./TimelineTemplate.stories";
import { TimelineView } from "./TimelineView";

const meta = {
  title: "Pages/Timeline",
  component: TimelineView,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TimelineView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = { args: TimelineTemplateOwner.args };
```

- [ ] **Step 5: Add map template stories**

Create `src/components/MapTemplate.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildDenseTripFixture, tripFixture } from "@/src/trip/fixtures";
import { RouteMapView } from "./RouteMapView";

const meta = {
  title: "Templates/Map",
  component: RouteMapView,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RouteMapView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    endDate: tripFixture.trip.endDate,
    items: tripFixture.planItems,
    startDate: tripFixture.trip.startDate,
    tripName: tripFixture.trip.name,
  },
};

export const Dense: Story = { args: { ...Owner.args, items: buildDenseTripFixture().itineraryItems } };
```

Create `src/components/MapPage.stories.tsx` with `title: "Pages/Map"`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Owner as MapTemplateOwner } from "./MapTemplate.stories";
import { RouteMapView } from "./RouteMapView";

const meta = {
  title: "Pages/Map",
  component: RouteMapView,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RouteMapView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = { args: MapTemplateOwner.args };
```

- [ ] **Step 6: Add members template stories**

Create `src/components/MembersTemplate.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { tripFixture } from "@/src/trip/fixtures";
import { TripMembersPage } from "./TripMembersPage";

const noop = () => {};

const meta = {
  title: "Templates/Members",
  component: TripMembersPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TripMembersPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    trip: tripFixture.trip,
    currentMember: tripFixture.currentMembers.owner,
    canManagePeople: true,
    onChangeMemberAccessStatus: noop,
    onChangeMemberPassword: noop,
    onChangeMemberRole: noop,
    onCreateMember: noop,
    onResetMemberClaim: noop,
  },
};

export const Traveler: Story = {
  args: {
    ...Owner.args,
    currentMember: tripFixture.currentMembers.traveler,
    canManagePeople: false,
  },
};
```

Create `src/components/MembersPage.stories.tsx` with `title: "Pages/Members"`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Owner as MembersTemplateOwner } from "./MembersTemplate.stories";
import { TripMembersPage } from "./TripMembersPage";

const meta = {
  title: "Pages/Members",
  component: TripMembersPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TripMembersPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = { args: MembersTemplateOwner.args };
```

- [ ] **Step 7: Add workspace shell story**

Create `src/components/AppShell.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { tripFixture } from "@/src/trip/fixtures";
import { AppShell } from "./AppShell";
import { OverviewTemplate } from "./OverviewTemplate";

const meta = {
  title: "Templates/Workspace Shell",
  component: AppShell,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    activeView: "overview",
    collapsed: false,
    currentMember: tripFixture.currentMembers.owner,
    trip: tripFixture.trip,
    onToggleCollapsed: () => {},
    children: (
      <main className="workspace-shell">
        <div className="workspace-grid" data-context-rail="closed" data-command-bar="hidden">
          <div className="planning-main">
            <OverviewTemplate
              trip={tripFixture.trip}
              currentMember={tripFixture.currentMembers.owner}
              expenseSummary={tripFixture.expenseSummaries.owner}
              items={tripFixture.planItems}
              suggestions={tripFixture.suggestions}
              tasks={tripFixture.tasks}
              taskScope="mine"
              taskStatusFilter="all"
              onTaskScopeChange={() => {}}
              onTaskStatusFilterChange={() => {}}
              onOpenTaskDialog={() => {}}
              onToggleTaskStatus={() => {}}
            />
          </div>
        </div>
      </main>
    ),
  },
};

export const Mobile: Story = { args: { ...Owner.args, collapsed: true } };
```

- [ ] **Step 8: Run story contract**

Run:

```bash
rtk bun run test -- src/storybook.contract.test.ts
```

Expected: PASS after all required categories and state exports exist.

- [ ] **Step 9: Run view tests**

Run:

```bash
rtk bun run test -- src/components/SagittariusApp.test.tsx src/components/OverviewPage.test.tsx
```

Expected: PASS.

- [ ] **Step 10: Commit view stories**

Run:

```bash
rtk git add src/components/*.stories.tsx src/components/TimelineView.tsx src/components/RouteMapView.tsx src/components/TripMembersPage.tsx src/components/SmartItineraryTable.tsx src/storybook.contract.test.ts
rtk git commit -m "feat: add storybook page template catalog"
```

## Task 6: App Stories And App Fixture Alignment

**Files:**
- Modify: `src/app/SagittariusApp.stories.tsx`
- Modify: `src/app/SagittariusApp.tsx`
- Modify: `src/components/SagittariusApp.test.tsx`

- [ ] **Step 1: Expand app-level stories**

Replace `src/app/SagittariusApp.stories.tsx` with:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SagittariusApp } from "./SagittariusApp";

const meta = {
  title: "Sagittarius/App",
  component: SagittariusApp,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SagittariusApp>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Cockpit: Story = {};
export const Owner: Story = { args: { initialView: "overview" } };
export const Itinerary: Story = { args: { initialView: "itinerary" } };
export const Timeline: Story = { args: { initialView: "timeline" } };
export const Map: Story = { args: { initialView: "map" } };
export const Members: Story = { args: { initialView: "members" } };
export const Mobile: Story = {
  args: { initialView: "overview" },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
```

- [ ] **Step 2: Add app test for fixture-backed initial data**

In `src/components/SagittariusApp.test.tsx`, add:

```ts
it("renders fixture-backed suggestions and tasks in planning views", async () => {
  const user = userEvent.setup();
  render(<SagittariusApp initialView="itinerary" />);

  await user.click(screen.getByRole("button", { name: /Open details/i }));

  expect(screen.getByText(/ร้านนี้ได้รับคะแนนสูง 4\.3\/5/i)).toBeInTheDocument();
  expect(screen.getByText(/จอง Peak Tram/i)).toBeInTheDocument();
});
```

Use `Dim Dim Sum` as the stable fixture-backed assertion when the suggestion note is behind a nested section.

- [ ] **Step 3: Run app tests**

Run:

```bash
rtk bun run test -- src/components/SagittariusApp.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit app story alignment**

Run:

```bash
rtk git add src/app/SagittariusApp.stories.tsx src/app/SagittariusApp.tsx src/components/SagittariusApp.test.tsx
rtk git commit -m "refactor: align app stories with shared fixtures"
```

## Task 7: Verification And Visual QA

**Files:**
- Modify only files found broken by verification.

- [ ] **Step 1: Run full automated checks**

Run:

```bash
rtk bun run test
rtk bun run lint
rtk bun run typecheck
rtk bun run build
rtk bun run build-storybook
```

Expected: all PASS.

- [ ] **Step 2: Start Next dev server**

Run:

```bash
rtk bun run dev
```

Keep the server session running until browser QA completes. Use `http://127.0.0.1:5180`.

- [ ] **Step 3: Start Storybook**

Run:

```bash
rtk bun run storybook
```

Keep the server session running until browser QA completes. Use `http://127.0.0.1:6006`.

- [ ] **Step 4: Browser QA app pages**

Use the Browser plugin for:

- `http://127.0.0.1:5180/`
- `http://127.0.0.1:5180/itinerary`
- `http://127.0.0.1:5180/timeline`
- `http://127.0.0.1:5180/map`
- `http://127.0.0.1:5180/members`

Verify:

- no framework error overlay;
- no horizontal page scroll at desktop and mobile widths;
- shared page header and motif language feel cohesive;
- overview and itinerary remain practical;
- timeline, map, and members have stronger but consistent travel motif accents;
- role/auth behavior still works.

- [ ] **Step 5: Browser QA Storybook**

Use the Browser plugin for `http://127.0.0.1:6006`.

Verify stories exist and render for:

- `Design System/Buttons`
- `Design System/Badges`
- `Design System/Page Header`
- `Design System/Travel Motifs`
- `Templates/Workspace Shell`
- `Templates/Overview`
- `Templates/Itinerary`
- `Templates/Timeline`
- `Templates/Map`
- `Templates/Members`
- `Pages/Overview`
- `Pages/Itinerary`
- `Pages/Timeline`
- `Pages/Map`
- `Pages/Members`

- [ ] **Step 6: Fix verification issues and rerun narrow checks**

For every failure, make the smallest aligned fix and rerun the relevant command. Examples:

```bash
rtk bun run test -- src/storybook.contract.test.ts
rtk bun run test -- src/components/SagittariusApp.test.tsx
rtk bun run build-storybook
```

- [ ] **Step 7: Final status**

Run:

```bash
rtk git status --short --branch
```

Expected: clean. Remove generated temporary QA files before finishing.
