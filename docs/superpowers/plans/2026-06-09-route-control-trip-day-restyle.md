# Route Control Trip Day Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved full visual restyle: desktop/tablet use Route Control Center, mobile uses Trip Day Companion.

**Architecture:** Keep the current React component boundaries and Storybook templates. Restyle by updating existing Tailwind class constants and map CSS hooks instead of introducing a parallel design system.

**Tech Stack:** React, Next.js, Tailwind utilities, Storybook, Vitest, MapLibre fallback/live-map surfaces.

---

## File Map

- Modify `frontend/src/components/RouteMapView.tsx`: Route Control Center map shell, day filters, fallback routes, stop list, loading/error/unresolved panels.
- Modify `frontend/src/components/SmartItineraryTable.tsx`: itinerary cockpit shell, table chrome, selected/overlap states, Trip Day Companion mobile inspector.
- Modify `frontend/app/globals.css`: route-map pseudo layers and live marker styling that cannot be expressed cleanly in component class strings.
- Modify `frontend/src/components/RouteMapView.test.tsx`: update bridge-class expectations only where class tokens intentionally changed.
- Modify `frontend/src/components/SmartItineraryTable.test.tsx`: update bridge-class expectations for table shell and mobile inspector.
- Modify `frontend/src/styles.contract.test.ts` only if design token contract expectations must change.

## Acceptance Criteria

- Desktop/tablet map story visibly reads as route control: darker cockpit frame, stronger map canvas, high-contrast route paths, operational day chips, styled status panels.
- Desktop/tablet itinerary story visually aligns with map: route-control page background, framed table surface, stronger sticky header, clearer selected/overlap rows.
- Mobile itinerary inspector reads as Trip Day Companion: bottom-sheet-like panel, larger touch controls, map/day execution feel, not just a small card.
- Existing data model and itinerary path behavior are untouched.
- Storybook `Templates/Map -- Owner Thai` and `Templates/Itinerary -- Owner Thai` pass play checks.
- Focused component tests pass for map/table shell classes and mobile inspector.
- Browser visual QA checks desktop and mobile viewports.

## Tasks

### Task 1: Route Control Map Surface

**Files:**
- Modify: `frontend/src/components/RouteMapView.tsx`
- Modify: `frontend/app/globals.css`
- Test: `frontend/src/components/RouteMapView.test.tsx`

- [ ] Update map shell class constants to use a Route Control Center look: deep route chrome, stronger canvas border, denser day chips, status panels with dark translucent backgrounds, and stronger stop list.
- [ ] Update fallback CSS pseudo layers and `.ofm-marker` to match the route-control map language.
- [ ] Keep class marker names (`route-map-panel`, `route-map-canvas`, `map-day-filter-button`, `route-marker`) so Storybook/tests can still identify the surface.
- [ ] Run `rtk bun test src/components/RouteMapView.test.tsx`.

### Task 2: Itinerary Cockpit Table Surface

**Files:**
- Modify: `frontend/src/components/SmartItineraryTable.tsx`
- Test: `frontend/src/components/SmartItineraryTable.test.tsx`

- [ ] Update table shell/filter/table/sticky-header class constants to visually match the route-control cockpit without changing DOM roles or handlers.
- [ ] Strengthen selected row, overlap row, add-stop row, and row action affordances.
- [ ] Preserve scoped horizontal table scroll and existing `smart-table min-w-[1080px]` contract.
- [ ] Run `rtk bun test src/components/SmartItineraryTable.test.tsx`.

### Task 3: Trip Day Companion Mobile Inspector

**Files:**
- Modify: `frontend/src/components/SmartItineraryTable.tsx`
- Test: `frontend/src/components/SmartItineraryTable.test.tsx`

- [ ] Restyle `mobile-itinerary-inspector` as a bottom-sheet-like day companion: rounded top sheet, sticky-feeling shadow, larger fields/buttons, clearer selected stop title.
- [ ] Keep inspector outside `.table-scroll`.
- [ ] Keep all inline update handlers and path fields unchanged.
- [ ] Run `rtk bun test src/components/SmartItineraryTable.test.tsx`.

### Task 4: Visual QA And Storybook

**Files:**
- Modify if needed: `frontend/src/components/MapTemplate.stories.tsx`
- Modify if needed: `frontend/src/components/ItineraryTemplate.stories.tsx`

- [ ] Run Storybook stories for `templates-map--owner-thai` and `templates-itinerary--owner-thai`.
- [ ] Use browser screenshots at desktop/tablet/mobile widths to confirm the visual delta is obvious and text does not overlap.
- [ ] Run lint/build checks that match the repo's available scripts.
- [ ] Commit the completed work.

