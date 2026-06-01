# Trip Photo-First Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/trips/<id>` overview into a travel cockpit with a photo-first hero, operational cockpit cards, and an image-led highlight board while preserving existing trip behavior.

**Architecture:** Keep `SagittariusApp` and route wiring unchanged. Refactor `OverviewPage` into small local view helpers plus a new focused visual module, then style the existing overview surface through `frontend/app/globals.css`. Storybook remains the source of truth before route/browser QA.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS in `globals.css`, Storybook 10, Vitest Testing Library.

---

## File Structure

- Modify `frontend/src/components/OverviewPage.tsx`: keep data derivation and role behavior, replace generic header/stat layout with `OverviewHero`, cockpit cards, and `HighlightBoard`.
- Modify `frontend/src/components/OverviewPage.test.tsx`: add assertions for the photo-first hero, cockpit card labels, highlight cards, and deterministic empty fallback.
- Modify `frontend/src/components/OverviewTemplate.stories.tsx`: make the overview redesign visible in Storybook for owner, traveler, viewer, Thai, and empty states.
- Modify `frontend/src/components/AppShell.stories.tsx`: ensure the workspace shell story renders the redesigned overview through the same production component.
- Modify `frontend/app/globals.css`: add photo-first overview styles, responsive layout, focus/hover states, and mobile rules.
- Do not modify `frontend/app/trips/[tripId]/page.tsx`, backend API files, auth/session files, or route contracts.

## Task 1: Add Redesign Coverage First

**Files:**
- Modify: `frontend/src/components/OverviewPage.test.tsx`
- Modify: `frontend/src/components/OverviewTemplate.stories.tsx`

- [ ] **Step 1: Add failing hero and highlight tests**

Add this test block inside `describe("OverviewPage role lenses", ...)` after the language-switch test:

```tsx
it("renders the photo-first cockpit hero and visual highlight board from trip data", () => {
  renderOverview("member-beam");

  const hero = screen.getByRole("banner", { name: /Hong Kong Food Crawl/i });
  expect(hero).toHaveTextContent(/Hong Kong/i);
  expect(hero).toHaveTextContent(/HK\$/i);
  expect(within(hero).getByText(/ศูนย์จัดการทริป/i)).toBeInTheDocument();

  const cockpit = screen.getByRole("region", { name: /travel cockpit/i });
  expect(within(cockpit).getByText(/Next stop/i)).toBeInTheDocument();
  expect(within(cockpit).getByText(/Trip readiness/i)).toBeInTheDocument();
  expect(within(cockpit).getByText(/Budget/i)).toBeInTheDocument();

  const board = screen.getByRole("region", { name: /trip highlight board/i });
  expect(within(board).getByText(/Dim Dim Sum ที่ Tim Ho Wan/i)).toBeInTheDocument();
  expect(within(board).getByText(/อาหารเย็นที่ Temple Street Night Market/i)).toBeInTheDocument();
});

it("keeps the photo-first overview useful for empty trips", () => {
  render(
    <OverviewPage
      currentMemberId="member-beam"
      expenseSummary={buildExpenseSummary([], "member-beam")}
      items={[]}
      suggestions={[]}
      tasks={[]}
      trip={{ ...seedTrip, itineraryItems: [] }}
      onCreateTask={vi.fn()}
      onOpenExpenses={vi.fn()}
      onToggleTaskStatus={vi.fn()}
    />,
  );

  expect(screen.getByRole("banner", { name: /Hong Kong Food Crawl/i })).toBeInTheDocument();
  expect(screen.getByText(/ยังไม่มี itinerary ในแผนนี้/i)).toBeInTheDocument();
  expect(screen.getByRole("region", { name: /trip highlight board/i })).toHaveTextContent(/ยังไม่มีไฮไลต์ในแผนนี้/i);
});
```

- [ ] **Step 2: Update Storybook play coverage**

In `frontend/src/components/OverviewTemplate.stories.tsx`, update `OwnerThai.play` to assert the new visible surface:

```tsx
export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("banner", { name: /Hong Kong Food Crawl/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /travel cockpit/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /trip highlight board/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /เช็กลิสต์ของทริป/i })).toBeVisible();
  },
};
```

- [ ] **Step 3: Run tests and confirm they fail for missing new UI**

Run:

```bash
cd frontend
bun run test -- src/components/OverviewPage.test.tsx
```

Expected: FAIL because `banner` named `Hong Kong Food Crawl`, `travel cockpit`, and `trip highlight board` do not exist yet.

- [ ] **Step 4: Commit the failing coverage**

```bash
git add frontend/src/components/OverviewPage.test.tsx frontend/src/components/OverviewTemplate.stories.tsx
git commit -m "test: cover trip photo-first overview"
```

## Task 2: Implement Overview Visual Structure

**Files:**
- Modify: `frontend/src/components/OverviewPage.tsx`

- [ ] **Step 1: Add derived cockpit data**

Inside `OverviewPage`, after `const activeMembers = ...`, add:

```tsx
const groupSpendLabel = `HK$${expenseSummary.groupSpend.toLocaleString("en-HK")}`;
const settlementCount = expenseSummary.settlementSuggestions.length;
const heroVisual = buildDestinationVisual(trip.destinationLabel);
const highlightItems = buildHighlightItems(sortedItems);
```

- [ ] **Step 2: Replace `PageHeader` and `overview-stat-grid`**

Replace the current `<PageHeader ... />` and `<div className="overview-stat-grid" ...>` block with:

```tsx
<OverviewHero
  activeMembers={activeMembers}
  currentMemberCard={currentMemberCard}
  destinationLabel={trip.destinationLabel}
  endDate={trip.endDate}
  groupSpendLabel={groupSpendLabel}
  itemCount={items.length}
  locale={locale}
  roleHeading={t.overview.roleHeadings[roleLens]}
  startDate={trip.startDate}
  title={trip.name}
  visual={heroVisual}
/>

<section className="overview-cockpit" aria-label="travel cockpit">
  <CockpitCard icon="route" label="Next stop" value={nextStop?.activity ?? t.overview.empty.itinerary} detail={nextStop ? `${formatDayLabel(nextStop.day, trip.startDate, locale)} · ${nextStop.startTime} · ${nextStop.place}` : trip.destinationLabel} />
  <CockpitCard icon="check" label="Trip readiness" value={t.dates.warningCount({ count: warningCount + pendingSuggestions })} detail={`${myOpenTasks} ${t.overview.readiness.myChecklist} · ${sharedOpenTasks} ${t.overview.readiness.sharedChecklist}`} />
  <button className="overview-cockpit-card overview-cockpit-card--button" type="button" aria-label={t.overview.money.openExpenses} onClick={openExpenses}>
    <span className="overview-cockpit-icon"><Icon name="wallet" /></span>
    <span className="overview-cockpit-label">Budget</span>
    <strong>{groupSpendLabel}</strong>
    <small>{settlementCount} settlements · {expenseSummary.currentUserNetLabel}</small>
  </button>
  <CockpitCard icon="users" label="Crew" value={t.dates.memberCount({ count: activeMembers })} detail={currentMember ? `${currentMember.displayName} · ${t.overview.roleHeadings[roleLens]}` : trip.destinationLabel} />
</section>

<HighlightBoard
  emptyMessage={t.overview.empty.highlights}
  items={highlightItems}
  locale={locale}
  startDate={trip.startDate}
/>
```

- [ ] **Step 3: Update imports**

Change the first import and the `PageHeader` import to:

```tsx
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
```

```tsx
import { formatTripRange, PageUserCard } from "./PageHeader";
```

- [ ] **Step 4: Add helper components at the bottom of the file**

Add these helpers before `function stopLabel(...)`:

```tsx
function OverviewHero({
  activeMembers,
  currentMemberCard,
  destinationLabel,
  endDate,
  groupSpendLabel,
  itemCount,
  locale,
  roleHeading,
  startDate,
  title,
  visual,
}: {
  activeMembers: number;
  currentMemberCard: ReactNode;
  destinationLabel: string;
  endDate: string;
  groupSpendLabel: string;
  itemCount: number;
  locale: Locale;
  roleHeading: string;
  startDate: string;
  title: string;
  visual: DestinationVisual;
}) {
  return (
    <header className={`overview-hero overview-hero--${visual.tone}`} role="banner" aria-label={title}>
      <div className="overview-hero-visual" aria-hidden="true">
        <span className="overview-hero-sky" />
        <span className="overview-hero-sun" />
        <span className="overview-hero-shape overview-hero-shape--one" />
        <span className="overview-hero-shape overview-hero-shape--two" />
        <span className="overview-hero-route" />
      </div>
      <div className="overview-hero-copy">
        <p className="eyebrow">{roleHeading}</p>
        <h1>{title}</h1>
        <h2>{destinationLabel}</h2>
        <div className="overview-hero-meta">
          <span><Icon name="calendar" /> {formatTripRange(startDate, endDate, locale)}</span>
          <span><Icon name="users" /> {activeMembers} travelers</span>
          <span><Icon name="location" /> {itemCount} stops</span>
          <span><Icon name="wallet" /> {groupSpendLabel}</span>
        </div>
      </div>
      {currentMemberCard}
    </header>
  );
}

function CockpitCard({ detail, icon, label, value }: { detail: string; icon: "check" | "route" | "users"; label: string; value: string; }) {
  return (
    <article className="overview-cockpit-card">
      <span className="overview-cockpit-icon"><Icon name={icon} /></span>
      <span className="overview-cockpit-label">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function HighlightBoard({ emptyMessage, items, locale, startDate }: { emptyMessage: string; items: ItineraryItem[]; locale: Locale; startDate: string }) {
  return (
    <section className="overview-highlight-board" aria-label="trip highlight board">
      <div className="overview-board-title">
        <span><Icon name="location" /></span>
        <div>
          <h2>Trip highlights</h2>
          <p>Photo-first stops from this itinerary</p>
        </div>
      </div>
      {items.length ? (
        <div className="overview-highlight-grid">
          {items.map((item, index) => (
            <article className={`overview-highlight-card overview-highlight-card--${highlightTone(item, index)}`} key={item.id}>
              <div className="overview-highlight-art" aria-hidden="true">
                <span />
              </div>
              <div className="overview-highlight-copy">
                <span>{formatDayLabel(item.day, startDate, locale)} · {item.startTime}</span>
                <strong>{item.activity}</strong>
                <small>{item.place}</small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="overview-muted">{emptyMessage}</p>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Add helper functions and types**

Add these before `function OverviewHero(...)`:

```tsx
type DestinationVisual = { tone: "harbor" | "city" | "coast" | "market" };

function buildDestinationVisual(destinationLabel: string): DestinationVisual {
  const normalized = destinationLabel.toLowerCase();
  if (normalized.includes("hong kong") || normalized.includes("harbor")) return { tone: "harbor" };
  if (normalized.includes("beach") || normalized.includes("island") || normalized.includes("coast")) return { tone: "coast" };
  if (normalized.includes("market") || normalized.includes("food")) return { tone: "market" };
  return { tone: "city" };
}

function buildHighlightItems(items: ItineraryItem[]): ItineraryItem[] {
  const preferred = items.filter((item) => ["food", "attraction", "experience", "shopping"].includes(item.activityType));
  return (preferred.length ? preferred : items.filter((item) => item.activityType !== "travel")).slice(0, 6);
}

function highlightTone(item: ItineraryItem, index: number): "food" | "landmark" | "market" | "calm" {
  if (item.activityType === "food") return "food";
  if (item.activityType === "shopping") return "market";
  if (item.activityType === "attraction" || item.activityType === "experience") return "landmark";
  return index % 2 === 0 ? "calm" : "landmark";
}
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
cd frontend
bun run test -- src/components/OverviewPage.test.tsx
```

Expected: FAIL only because CSS classes are unstyled is acceptable in jsdom, but missing imports/types must be fixed until tests PASS.

- [ ] **Step 7: Commit the structure**

```bash
git add frontend/src/components/OverviewPage.tsx
git commit -m "feat: add photo-first trip overview structure"
```

## Task 3: Style The Photo-First Cockpit

**Files:**
- Modify: `frontend/app/globals.css`

- [ ] **Step 1: Add hero and cockpit CSS**

Insert this CSS near the existing `.overview-page` styles:

```css
.overview-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, auto);
  align-items: end;
  gap: 24px;
  min-height: 320px;
  margin: 0 0 16px;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.36);
  border-radius: var(--radius-md);
  padding: 28px;
  color: white;
  background: #172033;
  box-shadow: 0 22px 60px rgb(15 23 42 / 0.16);
}

.overview-hero::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgb(8 13 23 / 0.82), rgb(8 13 23 / 0.42) 56%, rgb(8 13 23 / 0.18));
  content: "";
}

.overview-hero-visual,
.overview-hero-copy,
.overview-hero .page-current-user {
  position: relative;
  z-index: 1;
}

.overview-hero-visual {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(145deg, #1b365d, #f97352 58%, #f8c46d),
    var(--paper-grain);
  background-size: auto, 130px 130px;
}

.overview-hero--coast .overview-hero-visual { background: linear-gradient(145deg, #0f766e, #38bdf8 54%, #fde68a); }
.overview-hero--market .overview-hero-visual { background: linear-gradient(145deg, #7f1d1d, #ef4444 52%, #fbbf24); }
.overview-hero--city .overview-hero-visual { background: linear-gradient(145deg, #111827, #64748b 54%, #fb7185); }

.overview-hero-sun {
  position: absolute;
  right: 14%;
  top: 18%;
  width: 96px;
  height: 96px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.72);
}

.overview-hero-shape {
  position: absolute;
  bottom: 0;
  border-radius: 18px 18px 0 0;
  background: rgb(15 23 42 / 0.42);
}

.overview-hero-shape--one {
  right: 22%;
  width: 140px;
  height: 180px;
}

.overview-hero-shape--two {
  right: 6%;
  width: 190px;
  height: 230px;
}

.overview-hero-route {
  position: absolute;
  left: 42%;
  bottom: 22%;
  width: 36%;
  height: 3px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.54);
  transform: rotate(-8deg);
}

.overview-hero-copy {
  display: grid;
  gap: 8px;
  max-width: 760px;
}

.overview-hero h1,
.overview-hero h2,
.overview-hero .eyebrow {
  margin: 0;
  color: white;
}

.overview-hero h1 {
  font-size: 44px;
  line-height: 50px;
  font-weight: 900;
}

.overview-hero h2 {
  font-size: 18px;
  line-height: 26px;
  font-weight: 800;
  color: rgb(255 255 255 / 0.82);
}

.overview-hero-meta,
.overview-cockpit {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.overview-hero-meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  border: 1px solid rgb(255 255 255 / 0.22);
  border-radius: var(--radius-sm);
  padding: 5px 10px;
  background: rgb(255 255 255 / 0.14);
  color: white;
  font-size: 12px;
  font-weight: 800;
}

.overview-hero .page-current-user {
  min-width: 230px;
  border-color: rgb(255 255 255 / 0.24);
  background: rgb(255 255 255 / 0.16);
  backdrop-filter: blur(14px);
}

.overview-hero .page-current-user strong,
.overview-hero .page-current-user span {
  color: white;
}

.overview-cockpit {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0 0 16px;
}

.overview-cockpit-card {
  display: grid;
  gap: 6px;
  min-height: 148px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  background: rgb(255 255 255 / 0.9);
  color: var(--color-text);
  text-align: left;
}

.overview-cockpit-card--button {
  cursor: pointer;
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.overview-cockpit-card--button:hover,
.overview-cockpit-card--button:focus-visible {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-soft);
  outline: none;
  transform: translateY(-1px);
}

.overview-cockpit-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: rgb(255 90 95 / 0.1);
  color: var(--color-primary-strong);
}

.overview-cockpit-label,
.overview-cockpit-card small {
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.overview-cockpit-card strong {
  overflow-wrap: anywhere;
  font-size: 18px;
  line-height: 24px;
  font-weight: 900;
}
```

- [ ] **Step 2: Add highlight board CSS**

Insert after the cockpit CSS:

```css
.overview-highlight-board {
  display: grid;
  gap: 14px;
  margin: 0 0 16px;
}

.overview-board-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.overview-board-title > span {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-subtle);
  color: var(--color-primary-strong);
}

.overview-board-title h2,
.overview-board-title p {
  margin: 0;
}

.overview-board-title h2 {
  color: var(--color-text);
  font-size: 18px;
  line-height: 24px;
  font-weight: 900;
}

.overview-board-title p {
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 750;
}

.overview-highlight-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.overview-highlight-card {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: 0 12px 28px rgb(15 23 42 / 0.06);
}

.overview-highlight-card:nth-child(2),
.overview-highlight-card:nth-child(5) {
  transform: translateY(18px);
}

.overview-highlight-art {
  position: relative;
  min-height: 132px;
  background: linear-gradient(145deg, #fb7185, #fbbf24);
}

.overview-highlight-card--landmark .overview-highlight-art { background: linear-gradient(145deg, #0f172a, #38bdf8); }
.overview-highlight-card--market .overview-highlight-art { background: linear-gradient(145deg, #be123c, #f97316); }
.overview-highlight-card--calm .overview-highlight-art { background: linear-gradient(145deg, #0f766e, #a7f3d0); }

.overview-highlight-art span {
  position: absolute;
  right: 18px;
  bottom: 0;
  width: 86px;
  height: 96px;
  border-radius: 18px 18px 0 0;
  background: rgb(255 255 255 / 0.34);
}

.overview-highlight-copy {
  display: grid;
  gap: 4px;
  padding: 13px;
}

.overview-highlight-copy span,
.overview-highlight-copy small {
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 750;
}

.overview-highlight-copy strong {
  color: var(--color-text);
  font-size: 14px;
  line-height: 20px;
  font-weight: 900;
}
```

- [ ] **Step 3: Add responsive CSS**

Inside the existing mobile media blocks near `.overview-grid`, add:

```css
@media (max-width: 980px) {
  .overview-hero,
  .overview-cockpit,
  .overview-highlight-grid {
    grid-template-columns: 1fr;
  }

  .overview-hero {
    min-height: 420px;
    align-items: end;
  }

  .overview-highlight-card:nth-child(2),
  .overview-highlight-card:nth-child(5) {
    transform: none;
  }
}

@media (max-width: 640px) {
  .overview-page {
    padding: 14px;
  }

  .overview-hero {
    min-height: 380px;
    padding: 20px;
  }

  .overview-hero h1 {
    font-size: 32px;
    line-height: 38px;
  }

  .overview-hero .page-current-user {
    width: 100%;
    min-width: 0;
  }
}
```

- [ ] **Step 4: Run lint and focused test**

Run:

```bash
cd frontend
bun run lint
bun run test -- src/components/OverviewPage.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit styles**

```bash
git add frontend/app/globals.css
git commit -m "style: refresh trip overview cockpit"
```

## Task 4: Storybook And Shell Verification

**Files:**
- Modify: `frontend/src/components/AppShell.stories.tsx` if the story needs updated assertions.
- Modify: `frontend/src/components/OverviewTemplate.stories.tsx` if Storybook play checks need accessible-name tuning.

- [ ] **Step 1: Run Storybook tests**

Run:

```bash
cd frontend
bun run test:storybook
```

Expected: PASS. If accessible role names differ, update only Storybook play expectations to match rendered accessible names, not visual-only selectors.

- [ ] **Step 2: Run typecheck**

Run:

```bash
cd frontend
bun run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit story/type fixes if needed**

Only run this if files changed:

```bash
git add frontend/src/components/AppShell.stories.tsx frontend/src/components/OverviewTemplate.stories.tsx
git commit -m "test: align overview story coverage"
```

## Task 5: Browser QA On The Real Route

**Files:**
- No planned code edits.

- [ ] **Step 1: Start dev server**

Run:

```bash
cd frontend
bun run dev
```

Expected: Next.js starts at `http://127.0.0.1:5180`.

- [ ] **Step 2: Open route in browser**

Use the in-app Browser plugin if available. Navigate to:

```text
http://127.0.0.1:5180/trips/hong-kong-food-crawl
```

Expected: The route renders the redesigned overview, or the trip access screen if local API auth requires joining. If the route is gated, use the route/story evidence plus the available app flow and state the gate clearly.

- [ ] **Step 3: Check desktop and mobile viewports**

Verify:

- Hero text is readable over the visual.
- Cockpit cards do not overflow.
- Highlight cards use real itinerary text.
- Existing task checklist actions still work.
- Expense shortcut opens the expense rail/workspace behavior that existed before.
- Browser console has no React/Next errors.
- Mobile viewport stacks hero, cockpit, board, and role-specific content in one readable column.

- [ ] **Step 4: Stop dev server**

Stop the running `bun run dev` session cleanly after QA.

## Task 6: Final Verification

**Files:**
- No planned code edits unless verification exposes a bug.

- [ ] **Step 1: Run focused verification**

Run:

```bash
cd frontend
bun run lint
bun run typecheck
bun run test -- src/components/OverviewPage.test.tsx
bun run test:storybook
```

Expected: all PASS.

- [ ] **Step 2: Check git status**

Run:

```bash
git status --short
```

Expected: only intentional frontend changes remain.

- [ ] **Step 3: Commit final fixes if any**

If verification required fixes:

```bash
git add frontend/src/components/OverviewPage.tsx frontend/src/components/OverviewPage.test.tsx frontend/src/components/OverviewTemplate.stories.tsx frontend/src/components/AppShell.stories.tsx frontend/app/globals.css
git commit -m "fix: polish trip overview redesign"
```

## Self-Review

- Spec coverage: hero, cockpit cards, highlight board, Storybook-first workflow, unchanged route/backend/auth, responsive and accessibility checks, and Real System Feature QA are covered.
- Placeholder scan: no placeholder tasks remain.
- Type consistency: helper signatures use existing `ItineraryItem`, `Locale`, `Icon`, `formatTripRange`, and current `OverviewPage` props.
