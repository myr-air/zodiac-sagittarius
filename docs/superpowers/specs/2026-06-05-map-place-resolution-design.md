# Map Place Resolution Design

Date: 2026-06-05
Status: Approved for implementation planning

## Goal

Make the map page ready for real trip planning by showing each itinerary activity at the correct place whenever the app can resolve a real coordinate. Users should be able to add an activity with a small amount of place information, have Sagittarius resolve the location automatically, and only be asked to choose when the result is ambiguous.

This is a full feature, not frontend-only. Resolved coordinates must persist in both local mode and API mode so a refreshed or shared trip still shows the same markers.

## Current Context

`RouteMapView` already uses MapLibre GL JS with OpenFreeMap tiles. It only renders live markers and route lines for itinerary items that have valid `coordinates`.

The itinerary data model already includes `coordinates?: { lat, lng }`, `address?: string`, and `mapLink`. The backend database already has `address`, `latitude`, and `longitude` columns on `itinerary_items`, and API responses map those columns back to frontend coordinates. The missing part is the write path and place resolution pipeline.

OpenFreeMap remains the free map tile provider. It provides tiles, not geocoding. Its public instance is free and does not require API keys, and attribution is handled by MapLibre when using the standard client.

Public Nominatim is the default free geocoder. It must be used carefully: no autocomplete, cache results, keep requests rate-limited, include an identifying User-Agent or Referer, and allow provider switching. If Nominatim is unavailable or rate-limited, Sagittarius saves the activity as unresolved instead of blocking the organizer.

References:

- OpenFreeMap: https://openfreemap.org/
- Nominatim Usage Policy: https://operations.osmfoundation.org/policies/nominatim/

## Product Behavior

When a user adds or edits an activity, they continue to fill the existing fields: day, time, duration, activity, type, place, transportation, and note. The place field may be short, such as "ติ่มซำ แถว Elements".

On submit, Sagittarius attempts place resolution:

1. Build place context from activity, place hint, trip destination, countries, day, and nearby itinerary stops.
2. Use AI through OpenRouter or agy to normalize the user input into one to three search queries and a confidence estimate.
3. Use Brave Search to collect place evidence: titles, snippets, URLs, and available local-result metadata.
4. Use the free geocoder to resolve coordinates and address from the best query or candidate.
5. If one candidate is high-confidence, save the activity immediately with coordinates.
6. If multiple candidates are plausible, keep the add/edit dialog open and show a compact candidate list under the place field.
7. If resolution fails, is rate-limited, or the user skips selection, save the activity as unresolved.

AI and Brave help find candidates and evidence. They are not the source of truth for coordinates. Coordinates must come from the geocoder or another traceable provider that returns actual latitude and longitude.

## Ambiguous Result UX

The first ambiguous-result UI is inside the existing `StopDialog`.

The dialog shows up to three candidates. Each candidate displays:

- Place name
- Address or area
- Source/provider label
- Confidence
- A choose action

The dialog also offers a save-unresolved fallback. This keeps the organizer moving when a place cannot be resolved yet.

No client-side autocomplete will be built in this feature. Resolution happens only on submit or an explicit "Find place" action so the public geocoder is not queried on every keystroke.

## Map Page Behavior

The map page continues to use MapLibre GL JS with OpenFreeMap.

It renders:

- Real markers for itinerary items with valid coordinates.
- Route lines only between stops that have coordinates.
- Existing day filters.
- Path-aware filtering for `main`, `Plan A`, `Plan B`, and other itinerary paths.
- An unresolved strip/count, such as "3 stops need location".
- A short unresolved list with an action to resolve a stop later.
- Marker click behavior that selects or opens the related stop details.

If live map tiles fail, the page falls back to the existing SVG route diagram and clearly communicates that the live map is unavailable.

Real route directions, ETAs, traffic, and turn-by-turn routing are out of scope for the first implementation. They require a routing engine or provider separate from map tiles and geocoding.

## Backend Architecture

Add a backend place-resolution service behind authenticated trip access.

Proposed endpoint:

`POST /api/v1/trips/:tripId/places/resolve`

Request fields:

- `clientMutationId`
- `activity`
- `placeHint`
- `destinationLabel`
- `countries`
- `day`
- Optional `nearbyStops` or server-derived nearby itinerary context

Response fields:

- `status`: `resolved`, `ambiguous`, or `unresolved`
- `candidates`: zero to three candidates
- Candidate fields: `name`, `address`, `coordinates`, `mapLink`, `confidence`, `source`, `evidence`

The backend owns OpenRouter/agy, Brave, and geocoder calls so API keys are not exposed to the browser.

Provider configuration:

- `PLACE_RESOLUTION_ENABLED=true`
- `OPENROUTER_API_KEY`
- `BRAVE_SEARCH_API_KEY`
- `NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org`
- `NOMINATIM_USER_AGENT=Sagittarius/<environment-contact>`

The geocoder adapter must support rate limiting and caching. Cache keys should include normalized query, country hints, and destination context. Cached successful results are reused before contacting Nominatim.

If `PLACE_RESOLUTION_ENABLED` is false or provider config is missing, the endpoint returns unresolved without failing itinerary creation.

## Persistence

Extend write paths so itinerary coordinates survive refresh and API reloads.

Backend request types:

- `CreateItineraryItemRequest` accepts `address`, `latitude`, and `longitude`, or a structured `coordinates` field that maps to those columns.
- `ItineraryItemPatch` accepts the same fields for editing or later resolution.

Database queries:

- `insert_itinerary_item` writes `address`, `latitude`, and `longitude`.
- `update_itinerary_item` patches `address`, `latitude`, and `longitude`.

Frontend API client:

- `CreateItineraryItemApiRequest` and `PatchItineraryItemApiRequest` support `coordinates` and `address`.
- API response mapping continues to convert `coordinates: null` to `undefined` for frontend items.

Local mode:

- `createStop`, edit stop, and inline place edits update the local trip draft with resolved `coordinates`, `address`, and `mapLink`.

API mode:

- Create and patch requests send resolved location data.
- On `version_conflict`, reload the latest cockpit before retrying or recomputing local placement.

Import/export:

- Preserve `coordinates`, `address`, and `mapLink`.
- Imported items without coordinates remain unresolved until manually resolved.

## Stale Location Rules

When a user changes `place` or `activity` in a way that no longer matches the stored address, the previous coordinate must not silently pretend to be valid.

Rules:

- If the user edits `place`, mark existing coordinates stale before resolving again.
- If resolution succeeds, replace address, coordinates, and map link.
- If resolution fails and the user saves, remove stale coordinates and save unresolved.
- If the user edits non-location fields, keep existing coordinates.

The first implementation can represent unresolved or stale state through an advisory code instead of adding new database columns. If the UI later needs richer provenance, add dedicated metadata columns in a separate migration.

## Error Handling

Place resolution is helpful, not blocking.

- AI failure: continue with Brave plus raw place query.
- Brave failure: continue with AI-normalized query plus geocoder.
- Geocoder failure: return unresolved.
- Rate limit: return unresolved with a retryable reason.
- No candidate: return unresolved.
- Multiple candidates: return ambiguous and let the user choose.
- Provider timeout: return unresolved and allow normal save.

The UI must avoid alarming copy. It should say the place needs location review, not that the activity failed.

## Testing

Focused tests:

- Backend contract tests for create itinerary item with coordinates.
- Backend contract tests for patch itinerary item coordinates and clearing stale coordinates.
- Place resolution service tests with mocked AI, Brave, and geocoder providers.
- Frontend API client tests for coordinate/address request and response mapping.
- `StopDialog.test.tsx` for ambiguous candidate list and save-unresolved fallback.
- `SagittariusApp.test.tsx` for create activity resolved, ambiguous, and unresolved paths in local and API modes.
- `RouteMapView.test.tsx` for real marker count, unresolved count, path/day filter behavior, and fallback map copy.
- Import/export tests for preserving coordinates and address.

Real browser QA:

- Add an activity with high-confidence resolution and confirm the map marker appears.
- Add an ambiguous activity, choose a candidate, and confirm the marker appears.
- Save an unresolved activity and confirm the map unresolved strip appears.
- Edit a place and confirm stale coordinates are not reused.
- Check context rail interaction, console/page errors, and mobile overflow on the map page.

## Implementation Boundaries

In scope:

- Free map tiles with OpenFreeMap.
- Free geocoding through Nominatim by default.
- Backend proxy, cache, rate limit, and provider adapters.
- AI plus Brave query/evidence support.
- Persisted coordinates in local and API modes.
- Ambiguous result confirmation in the stop dialog.
- Unresolved activity fallback and map-page unresolved state.

Out of scope:

- Paid geocoding providers.
- Client-side autocomplete.
- Real route directions, ETA, traffic, or turn-by-turn navigation.
- Replacing MapLibre or OpenFreeMap.
- A separate map-first activity creation workflow.
