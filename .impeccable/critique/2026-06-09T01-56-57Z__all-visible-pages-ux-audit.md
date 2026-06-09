---
target: all visible pages UX/UI audit
total_score: 27
p0_count: 0
p1_count: 2
timestamp: 2026-06-09T01-56-57Z
slug: all-visible-pages-ux-audit
---
# All Visible Pages UX/UI Audit

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---:|---:|---|
| 1 | Visibility of System Status | 3 | Most pages show status and counts, but live map failures only surface as console/network noise. |
| 2 | Match System / Real World | 3 | Travel cockpit language is mostly clear; portal empty states feel abstract rather than task-oriented. |
| 3 | User Control and Freedom | 3 | Back/nav controls exist; mobile task dialogs bury save/cancel lower than the first viewport. |
| 4 | Consistency and Standards | 3 | Core components are consistent, but portal shell density differs sharply from cockpit pages. |
| 5 | Error Prevention | 2 | Map external dependency and about API status fetch lack user-visible prevention/recovery. |
| 6 | Recognition Rather Than Recall | 3 | Nav labels and major actions are visible; mobile horizontal nav hides later sections without a strong cue. |
| 7 | Flexibility and Efficiency | 3 | Desktop cockpit is efficient; portal empty pages and mobile dialogs slow primary actions. |
| 8 | Aesthetic and Minimalist Design | 2 | Several portal pages are minimal to the point of looking unfinished; detector also found side/accent border tells. |
| 9 | Error Recovery | 2 | About API version 503 becomes "unavailable" in UI but still logs an error; map tile aborts have no fallback explanation. |
| 10 | Help and Documentation | 3 | Some helper text is good; empty states need stronger next-step guidance. |
| **Total** |  | **27/40** | **fix-then-ship for full product polish** |

## Anti-Patterns Verdict

The product does not read as generically AI-made overall. The cockpit has a coherent travel-ops system: teal primary actions, slate surfaces, strong labels, and reusable app shell patterns. The weaker areas are not "flashy AI", but "unfinished operational surface": portal pages with huge empty backgrounds, placeholder-like panels, and decorative accent borders that make some modules feel generated rather than intentional.

Deterministic scan found 3 warnings:
- `frontend/src/components/OverviewPage.tsx:47`: `border-l-4`
- `frontend/src/components/OverviewPage.tsx:47`: `border-b-4`
- `frontend/src/components/AccountAccessPanel.tsx:259`: `border-t-2`

Browser audit covered 22 Storybook app surfaces, 6 direct Next routes, and 4 interaction overlays. No page-level horizontal overflow was detected. Console/page errors were clean except `/about`, which logs a 503 while displaying API version unavailable, and the map page, which generates aborted external tile requests in headless/mobile QA.

## What's Working

- The main cockpit pages are much stronger than the portal shell. Itinerary, expenses, bookings, photos, members, and timeline have clear task identity, stable controls, and readable density.
- Create trip is substantially improved: mobile sticky CTA, visible menu labels, compact desktop bottom summary, and draft-safe invite artifacts now hold up in browser screenshots.
- Landing page has a coherent first impression on desktop and mobile, with clear primary actions and no overflow.

## Priority Issues

### [P1] Portal pages look unfinished when empty

Evidence:
- `/tmp/sagittarius-all-pages-ux-audit/portal-my-trips__desktop-top.png`
- `/tmp/sagittarius-all-pages-ux-audit/portal-todos__desktop-top.png`
- `/tmp/sagittarius-all-pages-ux-audit/portal-explorer__desktop-top.png`
- `/tmp/sagittarius-all-pages-ux-audit/portal-dashboard__desktop-top.png`

Why it matters:
The account portal is the first authenticated workspace. Large blank bands, generic "Portal" header, and one-line empty cards make the product feel incomplete even when the state is technically valid.

Fix:
Replace the oversized portal hero/header with a compact operational header. Give empty pages purposeful modules: create trip, join/reopen recent trip, add vault item, add task, or explain why explorer has no shared trips. Keep sections dense and aligned to cockpit rhythm.

Suggested command: `$impeccable polish portal account shell`

### [P1] Map page depends on live external tiles without a graceful product fallback

Evidence:
- `/tmp/sagittarius-all-pages-ux-audit/cockpit-map__desktop-top.png`
- `/tmp/sagittarius-all-pages-ux-audit/cockpit-map__mobile-top.png`
- Browser audit logged aborted `https://tiles.openfreemap.org/...pbf` requests.

Why it matters:
The map is a core travel surface. When external tiles fail, users need a clear "map tiles unavailable" or offline route fallback rather than silent console/network failures.

Fix:
Add tile load/error state with user-facing fallback. Keep route pins/list visible even when live tiles fail. Consider a consent/offline placeholder consistent with the design doc's "Map requires user consent to load external tiles" state.

Suggested command: `$impeccable harden map page`

### [P2] Mobile task dialogs bury completion controls below the first viewport

Evidence:
- `/tmp/sagittarius-all-pages-ux-audit/interactions/expenses-add__mobile.png`
- `/tmp/sagittarius-all-pages-ux-audit/interactions/bookings-add__mobile.png`
- `/tmp/sagittarius-all-pages-ux-audit/interactions/photos-add__mobile.png`

Why it matters:
The dialogs are usable but heavy. On mobile, users see a long form with no visible save/cancel footer in the first viewport, so completion feels uncertain.

Fix:
Use a mobile dialog/bottom-sheet pattern with sticky footer actions and a compact section rhythm. If forms stay long, add clear grouping and keep primary action visible.

Suggested command: `$impeccable adapt task dialogs`

### [P2] Mobile cockpit nav hides later sections without enough affordance

Evidence:
- `/tmp/sagittarius-all-pages-ux-audit/cockpit-overview__mobile-top.png`
- `/tmp/sagittarius-all-pages-ux-audit/cockpit-itinerary__mobile-top.png`
- `/tmp/sagittarius-all-pages-ux-audit/cockpit-bookings__mobile-top.png`

Why it matters:
The horizontal nav works technically, but later destinations such as Bookings, Photos, Members, Expenses, and Settings are off-screen. Users may not discover them unless they try horizontal scroll.

Fix:
Add a stronger overflow affordance, segmented "More" menu, or two-row mobile nav with the current section always visible. Ensure the route title and active nav are not competing with the language control.

Suggested command: `$impeccable adapt app shell mobile nav`

### [P2] About route logs a 503 for API version during normal local render

Evidence:
- `/tmp/sagittarius-all-pages-ux-audit/about-route__desktop-top.png`
- `/tmp/sagittarius-all-pages-ux-audit/about-route__mobile-top.png`
- Browser console: `Failed to load resource: the server responded with a status of 503 (Service Unavailable)`

Why it matters:
The UI recovers visually, but clean QA should not treat a normal local status page as an error page. This creates noise that can hide real problems.

Fix:
Handle local API version lookup as an expected unavailable state without logging a failed resource, or gate the fetch behind configured API availability.

Suggested command: `$impeccable harden about/status route`

## Minor Observations

- Portal explorer uses a large crossed-line placeholder map/card that reads like wireframe art. It needs either real useful content or a compact empty state.
- The side/accent border pattern in `OverviewPage.tsx` should be replaced with full-border/background/icon emphasis.
- AppShell language menu in the left rail works, but opening it covers the rail and feels cramped on desktop. Not a blocker, but it is visually noisy.
- Direct `/trips/new` while unauthenticated routes to the account login experience, which is understandable but should be checked against product intent.

## Persona Red Flags

**Organizer power user**:
The cockpit itself supports scanning and editing, but the portal before the trip feels sparse. The organizer opening My Trips or To-dos with no data gets little operational guidance beyond one button.

**First-time traveler**:
Mobile nav hides several trip sections. A traveler may not discover Photos, Bookings, or Expenses unless they horizontally scroll the nav.

**QA/release owner**:
Map tile aborts and `/about` 503 errors add console noise. These are not fatal, but they weaken confidence in "no browser errors" release gates.

## Questions to Consider

- Should the account portal be a true dashboard, or mainly a launcher into trips?
- Should mobile cockpit navigation prioritize trip-day use, planning actions, or account-style sections?
- Is live map required by default, or should route summary be the resilient default and live tiles be progressive?

## Evidence

- Browser results JSON: `/tmp/sagittarius-all-pages-ux-audit/audit-results.json`
- Extra route results JSON: `/tmp/sagittarius-all-pages-ux-audit/route-extra-results.json`
- Screenshot directory: `/tmp/sagittarius-all-pages-ux-audit`
- Interaction screenshots: `/tmp/sagittarius-all-pages-ux-audit/interactions`
