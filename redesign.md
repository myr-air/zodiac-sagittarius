# Sagittarius Web Redesign Audit

Date: 2026-06-09
Scope: public landing, auth/access, trip cockpit, overview, itinerary, map, timeline, members, expenses, photos, bookings source review.

## Short Answer

Yes, the web needs a repaint pass before production. It does not need a full product reset. The strongest parts are the travel identity, calm teal/slate tokens, good table foundation, and working responsive containment. The main production gap is craft consistency: cockpit pages mix operational UI with decorative postcard treatment, mobile page headers are too tall, photo surfaces are not joyful enough for a photo feature, and several dense controls are below comfortable touch target size.

Target feeling: calm, friendly, joyful, trustworthy, scan-friendly. Not decorative, not marketing-heavy, not generic dashboard, not toy-like.

## Evidence Checked

- Next app: `http://127.0.0.1:5180/`
- Storybook app cockpit: `http://127.0.0.1:6006/iframe.html?id=sagittarius-app--cockpit&viewMode=story`
- Storybook views: `sagittarius-app--itinerary`, `sagittarius-app--map`, `sagittarius-app--timeline`, `sagittarius-app--members`
- Page stories: `pages-expenses--owner`, `pages-photos--owner`
- Viewports: 1440x900, 1280x720, 390x844
- Browser checks: no page-level horizontal overflow on checked routes, no blank landing/auth/cockpit pages, map reaches ready state after about 3 seconds in Storybook, one Next LCP warning for an above-fold auth image.

## Major Issues

### 1. Cockpit visual language is split between operations UI and postcard decoration

Evidence:
- `frontend/app/globals.css` applies `--paper-grain` and watercolor washes globally.
- `frontend/src/components/PageHeader.tsx` uses watercolor surface treatment on all product headers.
- `frontend/src/components/OverviewPage.tsx` adds polaroids, destination art, image highlight cards, and a warm illustrative hero inside the cockpit.

User impact:
- The workspace looks friendly, but it also starts to feel like a landing/product preview instead of a planning tool.
- The organizer's first scan competes with decorative imagery, especially in overview.

Fix direction:
- Keep travel warmth, but move it into specific moments: empty states, selected trip identity, map pins, photo covers, success states.
- Make cockpit headers quieter and flatter.
- Reserve postcard art for landing/auth/onboarding, not every operational page.

### 2. Mobile product headers are too tall and leave decorative blank space

Evidence:
- Timeline mobile: `.page-header` measured about 299px tall before content begins.
- Itinerary mobile: `.page-header` measured about 278px tall.
- Map mobile: `.page-header` measured about 214px tall.
- Header motif area can show a lone icon or blank wash before real content.

User impact:
- On mobile, users wait too long before reaching the useful itinerary/timeline/map content.
- It feels less like a trip companion and more like a page banner.

Fix direction:
- Mobile page header max target: 132-168px for cockpit pages.
- Collapse motif on mobile or convert it to a tiny route chip.
- Put page title, trip name, and 2-3 critical chips only.

### 3. Photos page is not visual enough for a photo feature

Evidence:
- `frontend/src/components/TripPhotosPage.tsx` provider cards are mostly white tiles with small icons and counts.
- Album cards are text-led and do not use `coverUrl` visually.
- Inspector exposes raw URLs that wrap awkwardly.

User impact:
- A photo page that contains almost no photo imagery feels unfinished and less joyful.
- Users cannot quickly distinguish albums by memory, destination, or day.

Fix direction:
- Add album cover strips using `coverUrl` with safe fallback travel thumbnails.
- Replace tall empty provider tiles with compact filter chips or image-backed provider cards.
- In inspector, show provider, status, and a short domain label. Hide raw URL behind "Open album" and copy action.

### 4. Itinerary table is functional but too small for touch and repeated editing

Evidence:
- `frontend/src/components/SmartItineraryTable.tsx` uses many `size-8`, `min-h-8`, and 24px inline row fields.
- Browser audit found many 32px row action buttons and 24px inline inputs.
- Mobile relies on a 1080px table inside a 327px scroll viewport.

User impact:
- Desktop density is useful, but touch editing is hard.
- Mobile users can read, but editing feels like a desktop table squeezed into phone width.

Fix direction:
- Desktop: keep dense table but raise frequent action hit areas to 36-40px.
- Touch/mobile: add a row-card or inspector edit mode for selected stop instead of forcing all inline fields.
- Keep table horizontal scroll for comparison, but make "Open details" the mobile edit path.

### 5. Weather presentation uses emoji/status text that looks prototype-like

Evidence:
- `frontend/src/components/WeatherForecastStrip.tsx` renders emoji-like weather icons and `-- deg -- deg`.
- Itinerary day rows show weather chips with the same visual language.

User impact:
- The weather module looks friendly, but the missing forecast state reads unfinished.
- Emoji status inside product chrome conflicts with the design source of truth.

Fix direction:
- Replace emoji with the app `Icon` set or small custom weather glyph components.
- For missing forecast, show "Forecast pending" once, not repeated `-- deg`.
- Use a skeleton or muted unavailable state with source/timestamp in the drawer.

### 6. System page header uses a banned side-stripe accent

Evidence:
- `frontend/app/globals.css` has `.page-header::before` with a 5px primary strip.

User impact:
- It is not a functional blocker, but it is a visible cross-page design tell.
- The stripe makes every page shout the same way and reduces hierarchy nuance.

Fix direction:
- Remove the side stripe.
- Use selected nav, page title weight, status chips, or a small route motif for identity.

### 7. Map loading state is not useful enough

Evidence:
- Map first rendered as a large pale panel with "Loading map from OpenFreeMap".
- It became ready after about 3 seconds with 16 markers, but there was no adjacent stop list during loading.

User impact:
- Slow or blocked map tiles can make the route view feel empty.
- Production users need route context even if external map tiles are delayed.

Fix direction:
- Show a static route preview and stop list while live tiles load.
- Keep day filters outside the map canvas on mobile or pin them in a compact top overlay.
- Add a clear tile failure state with retry and "use static route" fallback.

## Minor Issues

### 1. Landing H1 accessible text concatenates words

Evidence:
- Browser text read: `Plan trips with friendseasier and more fun`.
- `frontend/src/components/HomeLanding.tsx` uses stacked spans in the H1 without a text-space boundary.

Fix direction:
- Add a space in DOM, visually hidden separator, or restructure text nodes so screen readers read the title naturally.

### 2. Auth pages are slightly too tall at common desktop/mobile viewports

Evidence:
- Login desktop at 1280x720 scroll height was about 840px.
- Login mobile at 390x844 scroll height was about 950px, with secondary actions near/below the fold.

Fix direction:
- Compress auth form vertical rhythm by 8-16px per block.
- Keep primary action and one alternate auth method visible without needing to scroll on common phone heights.

### 3. Overview highlight cards have low text contrast over images

Evidence:
- The "Trip highlights" image cards use dark image overlays with small colored text.
- Screenshot inspection showed title/meta competing with the underlying image.

Fix direction:
- Use a stronger bottom scrim, larger title, and consistent white text.
- Add a clear selected/focus state.

### 4. Mobile top navigation exposes a raw horizontal scrollbar

Evidence:
- Mobile app shell shows a visible scrollbar under nav.
- `.rail-links` has horizontal overflow but no polished scroll affordance.

Fix direction:
- Hide native scrollbar.
- Add left/right fade masks and active-item auto-scroll.
- Consider a compact bottom nav for the highest-frequency views.

### 5. Members page feels utilitarian but not warm

Evidence:
- Members page is readable and operational, but stats/filter/member rows are mostly rectangular admin UI.

Fix direction:
- Add small presence/status warmth: verified/pending clarity, avatar grouping, invite progress, and friendly empty/disabled states.
- Keep management controls restrained.

### 6. Expenses page is strong but dense

Evidence:
- Expenses page is scannable, but left column payback cards and ledger compete for attention.

Fix direction:
- Make "who owes what" the first read, then ledger.
- Use a settlement path visual for paybacks.
- Put copy/record actions closer to each payback amount with consistent 40px targets.

### 7. Bookings source has the same folder-card pattern as Photos

Evidence:
- `frontend/src/components/BookingsDocsPage.tsx` uses six 104px folder cards plus ticket cards and inspector.

Fix direction:
- Keep folders, but reduce empty vertical space.
- Make booking cards look like compact travel documents with type, status, date, code, owner, and action line.

### 8. Above-fold auth image LCP warning

Evidence:
- Browser console warning: `/landing/auth/photo-cappadocia.png` detected as LCP and should be eager if above fold.

Fix direction:
- Add `priority` or `loading="eager"` where the image is truly above fold.
- Avoid eager loading for hidden/mobile-only assets.

## Nano Issues

- Footer landing links wrap acceptably but feel crowded on 390px mobile.
- Landing title accessible text needs spacing even though visual line break looks good.
- Some buttons use "Open add-member form" as visible label. Prefer "Add member".
- Some filter labels are technically clear but long: "All statuses", "All categories", "All payers". Consider tighter labels once context is obvious.
- Map attribution can sit below the initial mobile viewport; not a blocker, but ensure it remains accessible when map is scrolled.
- Photos inspector raw album URL wraps in a narrow column. Replace with domain + copy icon.
- Timeline mobile header has a decorative icon button-looking element that does not communicate purpose.
- Several icon-only buttons are 36px. Acceptable for mouse, marginal for touch.
- Repeated `rounded-(--radius-lg)` panels plus 14-28px shadows create a soft-card rhythm everywhere.
- `--color-paper-warm`, watercolor, mint/coral/sunshine tokens should be scoped to landing/auth unless a cockpit surface explicitly opts in.

## No-Pixel-Perfect Craft Notes

- Alignment: Page headers, stats, filters, and content generally align to a good grid, but header motifs break the key line on mobile.
- Density: Itinerary and expenses are dense in a good way. Photos and bookings are spacious without enough visual information.
- Contrast: Body text is mostly readable. Image-overlay cards need stronger contrast. Muted text over tinted watercolor should be checked route by route.
- Radius: Current 4/6/8px tokens are good. Some auth/join surfaces use 18-24px custom radii and feel less connected to cockpit.
- Shadows: Many panels pair 1px borders with 18px-70px soft shadows. Reduce routine panel shadows; reserve bigger shadows for dialogs/toasts.
- Motion: Existing motion has reduced-motion fallbacks in several places, good. The motion vocabulary is inconsistent: auth floats, portal slides, route markers, toasts, hover lifts. It needs one small system.
- Touch: 44px is not realistic for every dense desktop cell, but mobile-primary controls should be at least 40-44px.
- Icons: Lucide-style icons work well. Weather emoji/glyphs should be replaced by the same icon language.
- Copy: Product copy is usually clear. Some landing copy still uses broad phrases like "beautiful, fluid workspace"; make copy more specific to group trip planning.

## Repaint Plan

### Pass 1: Product Shell Cleanup

- Scope watercolor and paper grain to landing/auth/onboarding only.
- Simplify `PageHeader`: remove side stripe, reduce motif strength, standardize compact mobile variant.
- Add a polished horizontal mobile nav treatment: hidden scrollbar, fade edges, active item auto-scroll.
- Normalize panel shadows: border-first panels, subtle shadow only for floating surfaces.

### Pass 2: Cockpit Information Hierarchy

- Overview: make the first read "trip state and next decision", not decorative travel collage.
- Weather: redesign missing/loaded states and remove emoji.
- Highlight cards: improve image scrim, text contrast, and selected states.
- Add a small right-rail or context summary where decisions need nearby support.

### Pass 3: Itinerary Mobile Editing

- Keep desktop table.
- On mobile, treat row tap as opening a bottom-sheet inspector with edit fields.
- Keep the table as a read/compare surface, not the only edit UI.
- Raise mobile touch controls to 40-44px.

### Pass 4: Joyful Travel Surfaces

- Photos: add album covers, day thumbnails, destination memories, and provider status chips.
- Bookings: style cards as compact travel documents or boarding-pass rows without becoming decorative.
- Members: add small presence and invite-progress moments.
- Expenses: add a simple settlement route visual and clearer current-user balance.

### Pass 5: Production Hardening

- Run contrast checks for image overlays and muted text.
- Verify 320, 390, 768, 1024, 1440 viewports.
- Verify reduced motion.
- Verify keyboard focus order and focus return from dialogs/drawers.
- Verify no page-level horizontal scroll, except scoped table/map/nav regions.

## Motion Suggestions

Use motion to answer state questions, not decorate.

- Page transition: 150-180ms fade/translate for portal-like section changes only.
- Sidebar collapse: 180ms width/content fade, preserve active item position.
- Mobile bottom sheet inspector: 220-260ms slide up with opacity, reduced motion becomes instant/crossfade.
- Itinerary row select: 120ms background and left marker transition.
- Drag/drop: show drop target with 120ms color + 1px marker, no row scale.
- Map markers: keep 180ms marker-in, stagger max 120ms total, no long marker choreography.
- Weather drawer: 220ms slide from right on desktop, 240ms bottom sheet on mobile.
- Toast: existing 220-280ms is fine.
- Photos album hover: 120ms image brighten + subtle border, no card lift on dense lists.
- Success moments: small checkmark draw or pulse for save/copy/payback, max 500ms, no infinite loops.

Reduced motion:
- Keep all content visible by default.
- Disable float loops and route-card float.
- Replace slide/floats with opacity or instant state.

## Production Checklist

- No page-level horizontal overflow at 320, 390, 768, 1024, 1440.
- Mobile app nav has no raw scrollbar.
- Mobile headers do not push primary content below the first screen without reason.
- Public landing H1 has correct accessible text.
- Weather has loaded, loading, stale, unavailable, and error states.
- Map has ready, loading, and tile failure fallback states.
- Photos page shows at least one visual album cover or meaningful destination placeholder.
- Itinerary mobile has a usable selected-stop edit path.
- Image overlays meet WCAG contrast.
- Icon-only controls have labels and visible focus.
- Dialogs trap focus and return focus.
- Motion respects `prefers-reduced-motion`.
- Above-fold Next images are prioritized intentionally.
- Storybook has valid stories for all production pages, including bookings if it remains a route-level surface.

## Suggested Issue Split

1. Repaint product header and mobile app nav.
2. Redesign overview hierarchy and weather states.
3. Add mobile itinerary inspector edit flow.
4. Repaint photos with album covers and clean inspector URL handling.
5. Add map loading/failure fallback with route list.
6. Normalize shadows, panel radius, and side-stripe removal.
7. Add route-level visual QA checklist and Storybook coverage for bookings.
