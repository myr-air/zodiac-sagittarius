# Tailwind Storybook Hybrid Wave 9 Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the route map template shell and fallback map surface to hybrid Tailwind classes while preserving MapLibre behavior, filter state, and Storybook coverage.

**Architecture:** `RouteMapView` remains the route-map presenter and keeps all live MapLibre effects, marker management, and route projection functions unchanged. This wave adds Tailwind bridge classes to the panel, layout, canvas, day filter buttons, live map/status layer, fallback route diagram zones/SVG/markers, and source note. Existing selectors such as `.route-map-panel`, `.route-map-canvas`, `.map-day-filter-button`, `.route-live-map`, and `.route-marker` stay in place because global CSS still owns map background artwork, marker animation, pseudo-elements, and responsive behavior.

**Tech Stack:** React 19, Next 16, Tailwind CSS v4 utilities, Storybook 10, Vitest, Testing Library, Playwright.

---

### Task 1: Add Map Bridge Class Tests

**Files:**
- Modify: `frontend/src/components/RouteMapView.test.tsx`

- [ ] **Step 1: Add a focused bridge class test**

Add a test inside `describe("RouteMapView", () => { ... })`:

```tsx
  it("exposes hybrid Tailwind bridge classes for the map shell and fallback surface", async () => {
    maplibreMock.throwOnCreate = true;
    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={tripFixture.planItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await waitFor(() => expect(screen.getByText("Hong Kong")).toBeInTheDocument());

    const panel = screen.getByRole("region", { name: /แผนที่เส้นทาง/i });
    expect(panel).toHaveClass("route-map-panel", "grid", "min-h-0");

    const canvas = screen.getByLabelText(/ตัวอย่างแผนที่เส้นทางฮ่องกงและเซินเจิ้น/i);
    expect(canvas).toHaveClass("route-map-canvas", "relative", "overflow-hidden");

    const dayTwoButton = screen.getByRole("button", { name: /วันที่ 2/i });
    expect(dayTwoButton).toHaveClass("map-day-filter-button", "inline-flex");
    expect(screen.getByText("Hong Kong")).toHaveClass("map-zone", "absolute");
    expect(document.querySelector(".route-map-svg")).toHaveClass("route-map-svg", "absolute", "inset-0");
    expect(document.querySelector(".route-marker")).toHaveClass("route-marker", "absolute", "grid");
    expect(screen.getByText(/OpenFreeMap/i)).toHaveClass("map-source-note", "absolute");
  });
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
cd frontend
bun run vitest --project unit run src/components/RouteMapView.test.tsx
```

Expected: FAIL because the map shell still uses legacy-only class strings.

### Task 2: Add Map Storybook Assertions

**Files:**
- Modify: `frontend/src/components/MapTemplate.stories.tsx`

- [ ] **Step 1: Extend `OwnerThai.play`**

Update the play function:

```tsx
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /แผนที่เส้นทาง/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /แผนที่เส้นทาง/i })).toHaveClass("route-map-panel", "grid");
    await expect(canvas.getByLabelText(/ตัวอย่างแผนที่เส้นทางฮ่องกงและเซินเจิ้น/i)).toHaveClass("route-map-canvas", "relative");
    await expect(canvas.getByRole("button", { name: /วันที่ 2/i })).toHaveClass("map-day-filter-button", "inline-flex");
  },
```

### Task 3: Migrate RouteMapView Bridge Classes

**Files:**
- Modify: `frontend/src/components/RouteMapView.tsx`

- [ ] **Step 1: Import `cn()`**

Add:

```tsx
import { cn } from "@/src/lib/cn";
```

- [ ] **Step 2: Add plain string class constants**

Add constants near `routeDayColors`:

```tsx
const routeMapPanelClassName = "route-map-panel grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] bg-[var(--color-page)] px-6 py-[22px] pb-7";
const routeMapLayoutClassName = "route-map-layout block h-full min-h-0 w-full p-0 mb-7";
const routeMapCanvasClassName = "route-map-canvas relative min-h-[520px] h-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-route-soft)]";
const mapDayFilterClassName = "map-day-filter absolute left-3 top-3 z-[8] flex max-w-[min(720px,calc(100%-92px))] flex-wrap gap-[7px]";
const mapDayFilterButtonClassName = "map-day-filter-button inline-flex min-h-[30px] items-center gap-1.5 rounded-full border border-[rgb(203_213_225_/_0.9)] bg-white/90 px-2.5 py-1.5 text-[11px] font-extrabold leading-4 text-[#334155] shadow-[0_8px_18px_rgb(15_23_42_/_0.08)] backdrop-blur transition-[background,border-color,color,box-shadow] duration-150";
const activeMapDayFilterButtonClassName = "map-day-filter-button--active";
const mapDaySwatchClassName = "map-day-swatch size-[9px] rounded-full bg-[var(--day-color,var(--color-route))] shadow-[0_0_0_2px_rgb(255_255_255_/_0.9)]";
const routeLiveMapClassName = "route-live-map absolute inset-0 z-[4] bg-[var(--color-route-soft)]";
const routeMapStatusClassName = "route-map-status absolute left-1/2 top-1/2 z-[5] m-0 -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white/90 px-2.5 py-2 text-xs font-extrabold text-[var(--color-text-muted)]";
const mapZoneClassName = "map-zone absolute z-[1] text-[11px] font-extrabold uppercase leading-[15px] text-[#475569]";
const mapZoneHongKongClassName = "map-zone--hk";
const mapZoneShenzhenClassName = "map-zone--sz";
const mapZoneBayClassName = "map-zone--bay";
const routeMapSvgClassName = "route-map-svg absolute inset-0 z-[2] size-full overflow-visible";
const routeMapPathShadowClassName = "route-map-path route-map-path--shadow";
const routeMapPathClassName = "route-map-path";
const routeMarkerClassName = "route-marker absolute grid size-[30px] place-items-center rounded-full border-2 border-white bg-[var(--day-color,var(--color-route))] text-[11px] font-extrabold tabular-nums text-white shadow-[0_10px_22px_rgb(37_99_235_/_0.24)]";
const mapSourceNoteClassName = "map-source-note absolute bottom-2 right-2.5 z-[6] m-0 rounded-full border border-[rgb(203_213_225_/_0.82)] bg-white/90 px-2 py-1 text-[10px] font-extrabold leading-[14px] text-[#475569]";
```

- [ ] **Step 3: Replace JSX class names**

Use direct `className={...}` for static strings. Use `cn()` only for active day filter variants:

```tsx
className={cn(mapDayFilterButtonClassName, activeDay === "all" && activeMapDayFilterButtonClassName)}
className={cn(mapDayFilterButtonClassName, activeDay === group.day && activeMapDayFilterButtonClassName)}
className={cn(mapZoneClassName, mapZoneHongKongClassName)}
```

Do not change MapLibre effects, marker refs, route projection, or source/layer logic.

### Task 4: Verify and Commit

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run focused unit tests**

```bash
cd frontend
bun run vitest --project unit run src/components/RouteMapView.test.tsx src/storybook.contract.test.ts
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

Expected: all PASS. Restore `frontend/next-env.d.ts` if `next typegen` rewrites the import path.

- [ ] **Step 3: Browser QA Storybook**

Start Storybook:

```bash
cd frontend
bun run storybook -- --ci --host 127.0.0.1
```

Check:

- `http://127.0.0.1:6006/iframe.html?id=templates-map--owner-thai&viewMode=story`
- `http://127.0.0.1:6006/iframe.html?id=templates-map--dense&viewMode=story`
- mobile viewport for OwnerThai

Expected: nonblank, no console/page errors, no unintended horizontal overflow, fallback map zones and markers visible, day filter buttons visible and clickable.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-06-02-tailwind-storybook-hybrid-wave-9-map.md frontend/src/components/RouteMapView.tsx frontend/src/components/RouteMapView.test.tsx frontend/src/components/MapTemplate.stories.tsx
git commit -m "feat: migrate route map to hybrid tailwind"
```

## Self-Review

- Spec coverage: This wave advances the remaining Wave 4 page template surface after Overview, Members, Timeline, and Itinerary.
- Placeholder scan: No placeholders remain.
- Type consistency: All referenced classes, labels, and command names match the inspected codebase.
