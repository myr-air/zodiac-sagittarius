# Tailwind Storybook Hybrid Wave 10 CSS Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shrink `frontend/app/globals.css` by removing route-map side-list selectors that no longer have JSX references after the Map hybrid migration.

**Architecture:** This is a narrow cleanup wave. Keep global tokens, map artwork pseudo-elements, responsive map behavior, table/timeline complex selectors, and dynamic modifier classes that still have runtime references. Remove only `.route-day-stack`, `.route-day-card`, `.route-stop-*`, and `.route-day-more` rules that were tied to the old route-map side list and are not emitted by `RouteMapView`.

**Tech Stack:** CSS, React class reference audit, Vitest, Storybook, Playwright.

---

### Task 1: Confirm Cleanup Candidates

**Files:**
- Inspect: `frontend/app/globals.css`
- Inspect: `frontend/src/components/RouteMapView.tsx`
- Inspect: `frontend/src/components/TimelineView.tsx`

- [ ] **Step 1: Search candidate classes**

Run:

```bash
rg -n "route-day-|route-stop-" frontend/src frontend/app -g '*.tsx' -g '*.ts' -g '*.css'
```

Expected: references only in `frontend/app/globals.css` and route source id helpers such as `trip-route-day-*`; no JSX class usage for `.route-day-stack`, `.route-day-card`, `.route-stop-button`, `.route-stop-time`, `.route-stop-copy`, or `.route-day-more`.

### Task 2: Remove Unused Route Side-List CSS

**Files:**
- Modify: `frontend/app/globals.css`

- [ ] **Step 1: Remove unused route day stack/card/stop rules**

Delete rules for:

- `.route-day-stack`
- `.route-day-card`
- `.route-day-card:last-child`
- `.route-day-card header`
- `.route-day-card header div`
- `.route-day-card strong`
- `.route-day-card header span:not(.badge)`
- `.route-day-card ol`
- `.route-stop-button`
- `.route-stop-button:hover`
- `.route-stop-button--selected`
- `.route-stop-time`
- `.route-stop-copy`
- `.route-stop-copy strong`
- `.route-stop-copy span`
- `.route-day-more`

- [ ] **Step 2: Preserve shared Timeline selectors**

Where selectors were combined, keep the Timeline half:

```css
.timeline-day-header { ... }
.timeline-day-header div { ... }
.timeline-day-header strong { ... }
.timeline-day-header span:not(.badge) { ... }
.timeline-stop-list { ... }
```

- [ ] **Step 3: Remove responsive route-day-stack rules**

Delete `.route-day-stack` rules from responsive blocks. Keep `.route-map-layout`, `.route-map-canvas`, and `.timeline-*` responsive rules.

### Task 3: Verify Cleanup

**Files:**
- Verify: `frontend/app/globals.css`

- [ ] **Step 1: Search deleted selectors**

Run:

```bash
rg -n "route-day-stack|route-day-card|route-stop-button|route-stop-time|route-stop-copy|route-day-more" frontend/app/globals.css frontend/src
```

Expected: no CSS class selector references; route source id strings like `trip-route-day-*` may remain and are unrelated.

- [ ] **Step 2: Run focused tests**

```bash
cd frontend
bun run vitest --project unit run src/components/RouteMapView.test.tsx src/components/TimelineView.test.tsx src/storybook.contract.test.ts
bun run test:storybook
bun run build-storybook
```

Expected: all PASS.

- [ ] **Step 3: Browser QA Map and Timeline**

Check Storybook iframe stories:

- `templates-map--owner-thai`
- `templates-map--dense`
- `templates-timeline--owner-thai`

Expected: nonblank, no console/page errors, no horizontal overflow, map filters and timeline selected stop still render.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-06-02-tailwind-storybook-hybrid-wave-10-css-cleanup.md frontend/app/globals.css
git commit -m "chore: remove unused route map css"
```

## Self-Review

- Spec coverage: This advances Wave 5 CSS Cleanup without rewriting `globals.css`.
- Placeholder scan: No placeholders remain.
- Type consistency: Candidate selectors match the current CSS and source references.
