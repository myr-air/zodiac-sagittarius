# Changelog

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
