# Changelog

## [0.7.10] — 2026-07-13

### Changed
- Recolored orange accent (rgb(194,112,0)) to teal (rgb(15,118,110)) across 11 files
- Reduced page title from 24/31px to 28/34px
- Enlarged IconButton tap target from 36px to 44px
- Replaced decorative border-primary with border-strong

### Fixed
- Added focus-visible rings on Button, IconButton, and TextInput
- AboutAppPage skips API fetch when runtimeMode is local
- I18nProvider reads ?locale= query param, localStorage, then navigator.language

## [0.7.9] — 2026-07-13

### Changed
- #64: Replaced raw ⌄ glyphs with chevronDown icon in option picker controls
- #106: Widened time rail column from 64px to 80px desktop / 58px to 72px mobile for locale safety
- #107: Threaded contextRailOpen prop through itinerary table; compute details-open state with visual distinction via left-accent border

## [0.7.8] — 2026-07-13

### Docs
- Surveyed itinerary UX follow-ups #61-#66 from the production flow review
- Filed supplementary issues #111-#114 decomposing E2E linked-workflow verification

## [0.7.7] — 2026-07-13

### Fixed
- #28: ActivityTimeButton redesigned with duration indicator, flexible badge when endTime absent, next-day indicator
- #43: Trip Plan selection wired through real handlers — removed noOpHandler stubs that silently broke persistence
- #44: StopDialog form controls now have programmatic label associations; sub-activity context banner shows parent activity name

## [0.7.6] — 2026-07-13

### Fixed
- #26, #90: Smart Itinerary Table restructured — removed nested card framing, added right context rail, selected-row highlight, and command bar with itinerary actions
- #29: Inspector now opens via double-click or explicit button, not every single click on a row
- #44, #54: Add-activity dialog shows parent/sub-activity context with descriptive headings and progress indicator
- #57: Validation feedback surfaced as inline errors below fields (EN + TH), not silent save failure
- #56: Flexible sub-items no longer lost during activity save — all sub-items persist in trip data
- #58: Consecutive add-activity flows fixed — dialog no longer blocks next entry with stale state
- #43: Selected Trip Plan persists across page reload and direct URL navigation via sessionStorage
- #47: Notes entered during activity creation now persist and display in activity cell after save
- #49: Itinerary summary counts (activities, sub-activities, flexible items) update immediately after add/remove
- #55: Activity Block conversion toggle wired through ActivityCellActionGroup and SubActivityItem — converting itinerary rows to blocks no longer silently fails
- #48: Flexible sub-activities from CSV plan import preserved when entering journey details
- #50: Untimed flexible transport legs preserved during manual itinerary entry and across reload
- #28: Time-window editor redesigned with clearly labeled Start/End fields in readable HH:MM format
- #68: Action button clipping at desktop table edge fixed
- #27: Activity path graph lanes now vertically aligned with itinerary item rows

## [0.7.5] — 2026-07-12

### Fixed
- #95: Trip Map blank canvas — sw.js tile hostname mismatch fixed (`tile.openfreemap.org` → `tiles.openfreemap.org`) enabling cache-first tile strategy
- #95: Map canvas mobile collapse fixed — `min-h-0` replaced with `min-h-[280px]` at ≤767px viewports
- #95: Tile-failure detection added to all 3 MapLibre mount points — `sourcedata` + `styleimagemissing` listeners with 4s timeout transition to static fallback instead of blank canvas
- #95: Regression test for tile-failure → static fallback transition (2 test cases)

## [0.7.4] — 2026-07-12

### Fixed
- #75: Expenses page crash — null-guard `categoryTone()` for unknown categories
- #77: Invalid trip UUID now returns 404 (not 403) — backend `create_trip_member_session` checks trip existence before membership
- #80: Codename "Sagittarius" removed from public About page — replaced with "Joii"
- #82: Portal Vault document file items now have accessible external link action (localized EN/TH)
- #85: Error handling UX — styled 404 page, trip-not-found user message, bad join code descriptive feedback
- #94: Detail Planner plan variant controls restored — `hideTablePlanControls` changed to `false`
- #59: Itinerary path fields (`pathGroupId`, `pathId`, `pathName`, `pathRole`) now preserved in PATCH requests, preventing data loss on reload

## [0.7.2] — 2026-07-11

### Added
- T25: Location sharing toggle with geolocation permission handling and desktop fallback
- T26: On-Trip Companion page — mobile-first Now/Next card, day switcher, check-off with undo toast, companion bottom nav
- PWA manifest, service worker (cache-first for itinerary/map/checklist, network-first for PII), offline banner

### Changed
- Workspace shell: 6-phase workspace fully wired across all phases (Dreamer → Flexible Hunter → Route Builder → Detail Planner → Group Wrangler → On-Trip Companion)
- PhaseBar: On-Trip Companion phase suppresses left rail, enables bottom nav
- i18n: Full EN/TH coverage for all companion views

### Fixed
- useMemo ref lint error in OnTripCompanionPage
- Protected file restoration after rebase (AGENTS.md, DESIGN.md, vitest.config.ts preserved)

## [0.7.1] — 2026-07-11

### Changed
- AGENTS.md: rewritten for SC-Commander integration with resolver gate, lane
  detection, agent delegation, gate discipline, project map, tooling commands,
  git conventions, checkpoint discipline, and 6-phase journey model context.
- DESIGN.md: restructured from 643 to 420 lines — tighter sections, typography
  scale and states as tables, non-design content migrated to AGENTS.md,
  integrated Do/Don't into relevant sections, tightened frontmatter.

### Fixed
- `@/src` path alias now resolved in vitest unit mode via native
  `resolve.tsconfigPaths` (replaced deprecated `vite-tsconfig-paths` plugin).

### Removed
- Legacy docs, infra files, planning artifacts, screenshots, and root
  project files no longer relevant to the current workflow.

## [0.7.0] — 2026-07-11

### Added
- **6-phase journey model**: Dreamer → Flexible Hunter → Route Builder → Detail Planner → Group Wrangler → On-Trip Companion
- **PhaseBar navigation**: Horizontal tab strip with per-phase availability detection and 200ms opacity cross-fade transitions
- **derive-phase**: Automatic phase computation from trip data (activities, waypoints, date window, members, trip active status)
- **Per-phase left rail**: Each phase has curated navigation items; On-Trip Companion has no left rail (mobile bottom nav)
- **Phase-aware context rail**: Right context rail suppressed for dreamer, flexible-hunter, route-builder, and on-trip-companion phases
- **Dreamer page**: Destination imagery, seasonal cards, lightweight trip creation (name + destination)
- **Flexible Hunter page**: Date window range slider, budget progress bars, budget category cards
- **Route Builder page**: MapLibre GL map, waypoint pins, route line with gap suggestions
- **Detail Planner page**: Smart Itinerary Table redesign, CSV/paste import, plan variant switcher
- **Group Wrangler page**: Member avatars with presence dots, invite dialog with QR code, poll cards with vote bars and tie state, RSVP per activity with headcounts, expense settlement summary
- **On-Trip Companion page**: Mobile-first Now/Next card with countdown warning, day switcher strip, check-off with undo toast, companion bottom nav (Now, Map, Checklist, Expenses)
- **PWA infrastructure**: manifest.json, service worker (cache-first for itinerary/map/checklist, network-first for PII), offline banner
- **Location sharing toggle**: Geolocation permission handling, auto-disable after trip end
- **Desktop fallback**: QR code + read-only itinerary summary for companion on desktop
- **EN/TH i18n**: 100% key parity across all 6 phases, PhaseBar labels, workspace pages
- **Caddyfile**: geolocation=(self) for sagittarius host

### Changed
- Trip data model: added dateWindowStart, dateWindowEnd, BudgetCategory, Waypoint
- ItineraryItem: added optional poll and rsvp fields
- App shell routing: extended for phase-aware view resolution
- Smart Itinerary Table: redesigned header controls, plan variant support

### Fixed
- PollCard hover state (was identical to base state — now shows visual feedback)
- Thai label collision: upcomingLabel changed from "ถัดไป" to "กิจกรรมถัดไป"
- Mixed Thai-English in companionDesktopDescription
- ActivityRsvpSection: added aria-pressed to toggle buttons
- OfflineBanner: changed role from alert to status (consistent with aria-live=polite)

### Known Limitations
- Desktop fallback viewport detection deferred (display-first)
- Location sharing toggle, expense capture, bottom nav routing deferred (API integration pending)
