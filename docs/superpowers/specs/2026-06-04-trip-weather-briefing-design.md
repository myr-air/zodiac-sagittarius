# Trip Weather Briefing Design

Date: 2026-06-04
Status: User-approved design direction, pending implementation plan

## Goal

Add a daily travel weather briefing to the trip overview. The feature should help travelers know what to expect for each travel day without making the overview feel crowded. It should cover weather, practical clothing advice, holidays, festivals, and daily local facts for each relevant trip date.

The date window is `trip.startDate - 1 day` through `trip.endDate + 1 day`. The overview shows as many days as fit in one horizontal line; overflow remains accessible by horizontal scrolling.

## Research Inputs

- Pinterest weather forecast card and glassmorphism references showed that attractive weather UIs usually use atmosphere, blur, large icons, and soft gradients instead of dense tables.
- Behance glassmorphism weather concepts reinforced a direction where the forecast layer feels like part of the weather mood rather than a separate dashboard widget.
- Dribbble weather card collections showed clear temperature hierarchy: high temperature is darker/heavier, low temperature is lighter.
- Existing Sagittarius overview design is a photo-first travel cockpit. The weather briefing should extend the hero rather than become another heavy panel.

Reference sources used during brainstorming:

- Pinterest weather app glassmorphism pin: https://www.pinterest.com/pin/weather-forecasting-app-ui-designglassmorphism-behance-in-2025--569353577913047084/
- Pinterest weather card UI ideas: https://www.pinterest.com/ideas/weather-card-ui/939235429466/
- Behance Weather App UI Design using Glassmorphism: https://www.behance.net/gallery/171451405/Weather-App-UI-Design-using-Glassmorphism
- Dribbble Weather Card UI collection: https://dribbble.com/tags/weather-card-ui

## Product Direction

Use an "Atmospheric Glass" forecast strip:

- The strip sits below the overview hero, slightly narrower than the hero.
- The hero visually overlaps the top edge of the strip, so the strip feels tucked behind the hero.
- The strip stays one line high and never wraps into multiple rows.
- The strip is beautiful and glanceable, but full daily details live in a drawer.

This should feel like a travel-day briefing, not a weather dashboard.

## Overview Placement

Place `ForecastStrip` directly after `OverviewHero` and before the existing cockpit cards.

Layout rules:

- Hero remains the dominant first-screen element.
- Forecast strip width is slightly smaller than the hero, approximately `92-96%` of the hero width.
- Forecast strip uses negative top margin so the hero overlaps its top edge.
- Strip has a glass-like surface: soft gradient, translucent wash, subtle blur where supported, and restrained shadow.
- Strip uses stable height and horizontal overflow.
- On mobile, the user sees the first few days and can horizontally scroll.

The strip should not use individual cards or boxed tiles for each day.

## Daily Forecast Segment

Each day is a transparent button-like segment on the strip.

Visible fields:

- Day and date, colored by Thai weekday color.
- Graphic weather icon or generated/local weather graphic.
- High and low temperature shown as `33° 28°`.
- Optional tiny cue when useful, such as rain chance or unavailable state, only if it fits cleanly.

Visual rules:

- No card border around each day.
- No bottom color bar.
- Thai weekday color applies to the day/date text itself.
- Add enough vertical space between day/date, icon, and temperature.
- Weather icon has room above and below so the strip feels airy.
- High temperature uses darker color and heavier weight.
- Low temperature uses lighter color and lower weight.
- Selected/focused day can use a subtle glow, underline, or soft background wash, but it must not become a boxed card.

Thai weekday color mapping:

- Sunday: red.
- Monday: yellow.
- Tuesday: pink.
- Wednesday: green.
- Thursday: orange.
- Friday: blue.
- Saturday: purple.

## Weather Detail Drawer

Tapping a day opens a large detail drawer.

Desktop behavior:

- Right-side drawer.
- Width approximately `min(720px, 78vw)`.
- Backdrop dims the overview.
- Drawer content uses two columns where space allows.

Mobile behavior:

- Bottom sheet.
- Height approximately `85-92vh`.
- Content becomes a single scrollable column.

Motion:

- Backdrop fades in and out.
- Desktop drawer slides in from the right with a slight opacity transition.
- Mobile sheet slides up from the bottom.
- Closing reverses the animation.
- Respect `prefers-reduced-motion` by reducing or removing movement.

Drawer content:

- Weather summary: condition, high/low, humidity, wind speed, rain chance where available.
- Clothing advice: auto-generated from weather, with manual override support.
- Holiday: public holiday information for the country or region when available.
- Festival/local event: best-effort enrichment with source and confidence.
- Daily facts: local practical facts such as country, currency, timezone, emergency number, or travel note.
- Data freshness: source, fetched time, expiry time, and unavailable reason where needed.

Permissions:

- Owner/organizer can edit manual advice, festival notes, and daily facts.
- Traveler/viewer can read the drawer but cannot edit enrichment fields.

## Data Model

Use a cached snapshot plus manual override model.

Add a trip daily enrichment concept keyed by:

- `tripId`
- `date`
- `locationKey`

`locationKey` should be derived from the day's best available place:

- Prefer itinerary item coordinates for that date.
- Fall back to destination/country geocoding.
- Record the chosen label and coordinates so results are explainable.

Suggested shape:

```ts
interface TripDailyBriefing {
  tripId: string;
  date: string;
  locationKey: string;
  locationLabel: string;
  coordinates?: { lat: number; lng: number };
  weather?: WeatherBriefingBlock;
  holiday?: HolidayBriefingBlock;
  festival?: FestivalBriefingBlock;
  facts?: FactsBriefingBlock;
  outfitAdvice?: AdviceBriefingBlock;
  manualOverrides: DailyBriefingOverrides;
  updatedAt: string;
  version: number;
}
```

Each block should include:

- `source`
- `sourceUrl` where available
- `fetchedAt`
- `expiresAt`
- `confidence`
- `unavailableReason` when data cannot be fetched or does not exist

Manual overrides should be stored separately from fetched data and win during rendering. This lets the backend refresh external data without erasing organizer edits.

## Backend Sources

Recommended free or free-friendly sources:

- Weather: Open-Meteo forecast API. It is free, does not require an API key, and supports forecast daily fields for temperature, humidity-related values through hourly data, wind, precipitation, and weather codes.
- Geocoding: Open-Meteo Geocoding API for destination lookup. If using Nominatim later, follow its usage policy and rate limits carefully.
- Public holidays: Nager.Date public holidays API by country/year.
- Country facts: REST Countries API, with a local static fallback for key fields used in UI.
- Festivals/local events: best-effort enrichment only. Free global festival/event coverage is not reliable enough to treat as authoritative. Use source, confidence, and organizer override.

## Expiry Policy

Different data blocks expire differently:

- Weather: refresh every 6-24 hours while inside the forecast window. If a date is too far in the future for forecast data, return an unavailable state or a clearly labeled climate fallback instead of fake weather.
- Holiday: cache for 30-365 days because public holiday calendars change slowly.
- Country facts: cache for 30-365 days, with local static fallback.
- Festival/local event: cache for 7-30 days and include confidence/source.
- Outfit advice: refresh when weather changes, unless the organizer has set a manual advice override.
- Manual overrides: do not expire automatically.

## API Surface

Extend the trip cockpit payload or add a scoped endpoint for briefings.

Recommended initial API:

- `GET /api/v1/trips/:tripId/daily-briefings`
- `PATCH /api/v1/trips/:tripId/daily-briefings/:date`

The `GET` endpoint returns briefings for `startDate - 1` through `endDate + 1`.

The `PATCH` endpoint updates only organizer-editable manual override fields. It must enforce trip membership and role permissions.

The overview can either load briefings as part of the main cockpit response or fetch them after the overview shell renders. Prefer a separate endpoint if the data may be slow or stale-refresh may happen asynchronously.

## Frontend Components

Expected components:

- `ForecastStrip`: overview placement, horizontal one-line forecast, day selection.
- `ForecastDaySegment`: transparent daily segment with Thai weekday color and temperature hierarchy.
- `WeatherBriefingDrawer`: responsive desktop drawer and mobile bottom sheet.
- `WeatherGraphic`: maps weather codes to consistent icon/graphic treatment.
- `BriefingSourceMeta`: small freshness/source summary.
- Organizer edit subcomponents for advice, festival note, and daily fact overrides.

Storybook should include:

- Full forecast window with overflow.
- Mobile width.
- Missing weather for future dates.
- Rainy day, sunny day, storm day, cloudy day.
- Organizer editable drawer.
- Traveler read-only drawer.

## Error And Empty States

Weather unavailable:

- Show day/date and a subtle unavailable label.
- Do not hide the day if it is inside the trip briefing range.
- Drawer explains why data is unavailable, such as outside forecast range or source error.

Partial enrichment:

- Render available blocks.
- Mark missing blocks clearly but quietly.
- Never invent holidays, festivals, or weather.

External source failure:

- Serve last valid cached data if not dangerously stale.
- Show source freshness and stale state in drawer.
- Backend should avoid failing the whole trip overview because an enrichment source failed.

## Testing And QA

Minimum verification before claiming implementation complete:

- Backend tests for date range generation, cache expiry, permission checks, and manual override precedence.
- API contract tests for briefing fetch and organizer-only patch.
- Frontend tests for strip rendering, overflow behavior, day selection, drawer open/close, and role-specific edit controls.
- Storybook stories for strip and drawer states.
- Browser QA on `/trips/:id` desktop and mobile viewport.
- Check animation open/close, reduced motion behavior, horizontal scroll, no text overflow, console errors, network errors, reload/direct-route behavior.

Real System Feature QA applies because this changes a user-facing trip overview route and adds backend API behavior.

## Non-Goals

- Do not build paid event-provider integrations in the first pass.
- Do not build notification scheduling yet.
- Do not add trip image upload or destination photo sourcing.
- Do not redesign the rest of overview, itinerary, map, timeline, or members.
- Do not make festival data appear authoritative unless a trustworthy source or manual organizer edit exists.

## Approved Decisions

- Use the Forecast Strip direction, not a compact cockpit card or full weather page.
- Use the Atmospheric Glass visual direction.
- Use a large drawer for full details.
- Use cached backend enrichment plus organizer manual overrides.
- Keep the overview strip one line only.
- Use Thai weekday color on day/date text, not on bottom bars or boxed cards.
