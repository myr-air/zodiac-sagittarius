---
name: Joii Travel Planning Cockpit
status: approved-design-source-of-truth
lastUpdated: 2026-06-01
inspiredBy:
  - https://getdesign.md/
  - /Users/xiivth/workspaces/zodiac/joii/DESIGN.md
  - /Users/xiivth/workspaces/zodiac/taurus/README.md
  - /Users/xiivth/workspaces/zodiac/taurus/src/trip/components/TripWorkspace.tsx
productType: public landing page + desktop-first collaborative travel planning web app
projectCodename: Sagittarius
publicBrand: Joii
zodiacRationale: Sagittarius / ราศีธนู fits travel, exploration, long-range planning, and route decisions.
backendPlan: REST + WebSocket + Rust + PostgreSQL, built after frontend
---

# Joii Travel Planning Cockpit Design System

This file is the UI source of truth for the public landing page and the
production-oriented travel planning frontend in
`/Users/xiivth/workspaces/zodiac/sagittarius`.

The product combines:

- Joii's friendly, clean group-trip identity and component discipline.
- Taurus' serious planning workflow: smart itinerary table, plan variants,
  suggestions, map context, role-aware views, and local draft persistence.
- A public landing surface that introduces the product with artful travel
  imagery, then hands users into login or trip access without extra navigation
  noise.
- A calmer production visual language suitable for long desktop planning
  sessions before the mobile trip mode is developed.

## 1. Product Direction

Build a desktop-first planning cockpit for people organizing trips together.
The first release should make planning, reviewing, and editing a shared trip
feel clear, fast, and calm.

Primary users:

- Organizers building and maintaining the full trip plan.
- Travelers reviewing the plan, proposing changes, and tracking decisions.
- Viewers reading the plan without editing.

Primary job:

- Give the organizer one trustworthy planning surface where the itinerary table
  is the source of truth, while map, suggestions, conflicts, budget, and people
  context stay visible nearby.

Non-goals for the planning cockpit:

- Do not build the backend.
- Do not optimize for mobile trip mode yet.
- Do not make a decorative dashboard that hides editing behind extra clicks.

## 2. Experience Principles

1. Desktop planning first.
   The public root opens into the Joii landing page. Authenticated and
   trip-access routes open into the planning cockpit, not a mobile trip-day
   view.

2. Smart Table is the source of truth.
   Itinerary edits, day structure, ordering, validation, plan variants, and
   review actions should orbit around the table.

3. Context stays nearby.
   The right rail should show what helps the current planning decision: route
   preview, open suggestions, validation issues, expense summary, people, or
   selected row details.

4. Minimal, not empty.
   Reduce visual noise, but keep strong hierarchy, useful summaries, and
   obvious actions.

5. Backend-ready boundaries.
   Frontend commands and events should map cleanly to future REST and WebSocket
   APIs even while using local seed data.

## 3. Visual Theme

App theme name: **Calm Travel Ops**.

The UI should feel like a refined travel operations desk: clear, quietly warm,
professional, and supportive. It should not feel like a toy prototype, a dense
enterprise admin panel, or a colorful travel agency landing page.

Use:

- White and slate surfaces.
- Teal primary actions.
- Blue for route/map context.
- Orange for warnings, conflicts, and review-needed states.
- Sparse destination/category color only when it clarifies meaning.
- Clean iconography from one set, preferably Lucide.

Avoid:

- Emoji as navigation, button, or status icons.
- Purple-heavy prototype styling.
- Nested cards.
- Decorative blobs, orbs, bokeh, or ornamental gradients.
- Large hero sections.
- Marketing copy inside the app shell.
- One-note color palettes.

### Public Landing Theme

Landing theme name: **Postcard Atlas**.

The landing page may be more visual and editorial than the cockpit, but it must
still feel calm, useful, and product-connected. It should look like a refined
travel notebook with real destination atmosphere: bright paper, teal routes,
warm coral/amber accents, and generated scenic thumbnails.

Landing rules:

- Header is intentionally minimal: Joii brand, EN/TH language switch, `Log in`,
  and `Trip access`. English is the default landing language.
- Do not expose `Sagittarius` as the public app name on the landing page;
  Sagittarius is the local project codename.
- Do not add full navigation links to the landing header.
- Desktop may show the product preview and secondary hero actions.
- Mobile hides the product preview and hero buttons because the header actions
  already provide the main choices.
- Use bitmap travel art for empty destination thumbnails; do not leave gradient
  placeholder blocks in production landing UI.
- Generated landing art should avoid text, logos, close-up faces, and heavy
  shadows.
- Hero background may use broad lat/long-style grid lines, two or three soft
  watercolor blooms, and one clear atlas-style route line behind the content.
  Avoid decorative pattern noise that does not communicate travel planning.
- Do not place decorative map or plane icons around the hero title; the route
  line and grid carry the map metaphor.
- SVG brand icons may be sourced from [theSVG](https://thesvg.org/) for footer
  or external-source links. Generic UI controls should continue using the local
  app icon set for consistency.

## 4. Color Tokens

Use CSS custom properties or equivalent theme tokens with these values.

```css
:root {
  --color-page: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;
  --color-surface-subtle: #f8fafc;

  --color-text: #172033;
  --color-text-muted: #475569;
  --color-text-subtle: #64748b;

  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;

  --color-primary: #0f766e;
  --color-primary-strong: #115e59;
  --color-primary-soft: #ecfeff;
  --color-primary-border: #99f6e4;

  --color-route: #2563eb;
  --color-route-soft: #eff6ff;
  --color-route-border: #bfdbfe;

  --color-warning: #f97316;
  --color-warning-strong: #c2410c;
  --color-warning-soft: #fff7ed;
  --color-warning-border: #fed7aa;

  --color-danger: #dc2626;
  --color-danger-soft: #fef2f2;
  --color-danger-border: #fecaca;

  --color-success: #16a34a;
  --color-success-soft: #f0fdf4;
  --color-success-border: #bbf7d0;
}
```

Color usage:

- Primary teal: main action, selected nav, confirmed state.
- Route blue: map, navigation, transport, route metadata.
- Warning orange: itinerary issues, conflicts, pending reviews.
- Danger red: destructive actions only.
- Success green: completed, approved, settled.
- Muted slate: secondary text, helper text, quiet metadata.
- Landing accent balance: teal remains the action color, sky blue supports route
  and map surfaces, coral and amber add travel warmth, and mint keeps the page
  fresh. Avoid letting any one hue dominate the public page.

## 5. Typography

Use `Noto Sans Thai` as the primary font because the product must support Thai
and English in the same interface.

Fallback stack:

```css
font-family: "Noto Sans Thai", Inter, ui-sans-serif, system-ui, -apple-system,
  BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Type rules:

- Do not scale font size with viewport width.
- Letter spacing is `0` by default.
- Use tabular numerals for times, durations, money, and row metrics.
- Keep heading hierarchy compact inside the app. This is not a hero page.
- Use sentence case for UI labels.

Suggested scale:

- Page title: 28px / 34px, 750-800 weight.
- Section title: 20px / 28px, 700 weight.
- Panel title: 16px / 22px, 700 weight.
- Body: 14px / 22px, 400-500 weight.
- Label: 12px / 16px, 650-700 weight.
- Table cell: 13px / 18px, 450-600 weight.
- Button: 13px / 18px, 700 weight.

## 6. Layout

The primary app screen is a desktop planning cockpit.

Desktop layout at `>= 1200px`:

- Three-column grid:
  - Left rail: 220px expanded or 68px collapsed.
  - Main workspace: fluid, minimum useful table width.
  - Right context rail: 300-340px.
- Main workspace contains:
  - Top command bar.
  - Summary strip.
  - Smart Itinerary Table.
- Right rail contains:
  - Current context card.
  - Map preview.
  - Review queue or selected item details.
  - Budget/people/status modules as needed.

Tablet layout at `768px - 1199px`:

- Left rail defaults collapsed.
- Right context rail moves below the command bar as stacked context panels.
- Smart Table remains the highest-priority content.
- Keep the page itself free from horizontal scroll.

Mobile layout at `320px - 767px`:

- No desktop sidebar.
- Use compact top navigation.
- Keep all planning sections reachable.
- Smart Table may use scoped horizontal scroll or condensed row cards.
- Do not build mobile trip mode as the primary flow in this phase.

Global layout rules:

- The page itself must not horizontally scroll.
- Only the table viewport may scroll horizontally when columns cannot compress.
- Use stable grid tracks and explicit min/max constraints.
- UI state changes must not shift unrelated layout.

## 7. Collapsible Left Rail

The left rail is a first-class UI state.

Expanded state:

- Width: 220px.
- Shows Joii brand, trip identity, nav labels, role/profile summary, and key
  secondary actions.

Collapsed state:

- Width: 68px.
- Shows icon-only navigation.
- Active item remains obvious.
- Tooltips or accessible labels expose item names.
- Toggle control remains visible and keyboard reachable.

Behavior:

- Persist preference in local storage for the frontend prototype.
- Later, store preference in user settings when backend exists.
- On tablet, default to collapsed.
- On mobile, replace with compact top navigation.
- Toggle must have `aria-expanded`, clear focus state, and `aria-label`.

## 8. Component System

### App Shell

Purpose:

- Own navigation, responsive layout, sidebar state, route-level error boundary,
  and global loading/empty states.

Rules:

- No marketing hero.
- No decorative nested card wrapper around the entire app.
- Keep navigation predictable and role-aware.
- Use semantic landmarks: `header`, `nav`, `main`, `aside`.

### Command Bar

Purpose:

- Show destination, date range, selected plan variant, selected day, save/draft
  state, and key actions.

Required controls:

- Plan variant selector.
- Selected day selector.
- Add row/action button.
- Sidebar toggle if left rail is present.
- Draft/save state.

Rules:

- Keep controls compact and aligned.
- Labels must remain visible for form controls.
- Avoid ambiguous icon-only actions unless tooltips and labels exist.

### Smart Itinerary Table

Purpose:

- The planning source of truth.

Required capabilities:

- Group rows by day.
- Edit time, activity, type, location/map link, duration, transport, notes.
- Add, duplicate, delete, reorder rows.
- Show validation issues.
- Open focused day/plan views if needed.
- Respect role capabilities.

Rules:

- Use a scoped table scroll area, not page-level horizontal overflow.
- Preserve keyboard access.
- Row density should be compact but readable.
- The selected row should drive right-context details.
- Warnings must be visible without relying on color alone.

### Right Context Rail

Purpose:

- Support the decision currently being made in the table.

Possible modules:

- Selected stop details.
- Map preview and route links.
- Open suggestions and conflicts.
- Budget/expense summary.
- People/collaborator state.
- Validation summary.

Rules:

- Context modules must not compete with the table.
- Use one primary context at a time when space is tight.
- On tablet/mobile, stack under the command area.

### Cards and Panels

Use cards only for:

- Individual modules.
- Repeated list items.
- Modals.
- Tool panels.

Do not:

- Put cards inside cards.
- Style entire page sections as floating cards.
- Use overly rounded 28-48px prototype cards.

Card tokens:

- Radius: 12-16px.
- Border: `1px solid var(--color-border)`.
- Shadow: optional, subtle only.
- Padding: 12-16px for dense panels, 20-24px for summary panels.

### Buttons

Rules:

- Minimum hit area: 44px.
- Use icons from one set.
- Primary button: teal fill, white text.
- Secondary button: muted surface, slate or teal text.
- Danger button: red only for destructive operations.
- Hover/focus must not resize or shift layout.
- Focus state must be visible.

### Forms and Inputs

Rules:

- Labels remain visible.
- Inputs use 8-12px radius, not pill by default.
- Use helper and error text near the field.
- Do not rely on placeholder as label.
- Focus ring: teal border plus soft outer ring.

### Icons

Use one icon family across the app, preferably Lucide.

Suggested mappings:

- Cockpit: layout-dashboard.
- Itinerary/table: table.
- Ideas/suggestions: lightbulb.
- Map/route: map.
- Expenses: wallet/cards.
- People: users.
- Settings/admin: settings.
- Collapse/expand: panel-left-close / panel-left-open.

## 9. Interaction and Motion

Motion should be quiet and functional.

Use:

- 150-220ms transitions for color, opacity, shadow, and transform.
- Subtle hover lift only for clickable cards.
- Clear selected, hover, active, disabled, and focus states.

Avoid:

- Bouncy prototype motion.
- Continuous decorative animation.
- Hover scale on dense table rows.
- Layout shifts on hover.

Respect `prefers-reduced-motion`.

## 10. Data and Backend Boundary

This frontend pass uses local/mock data, but the architecture must be backend
ready.

Create a data boundary such as `tripRepository` or `tripDataAdapter` so UI code
does not care whether data comes from seed/local storage or backend APIs.

Future REST command examples:

- `GET /trips/:tripId`
- `PATCH /trips/:tripId/plans/:planId`
- `POST /trips/:tripId/itinerary-items`
- `PATCH /trips/:tripId/itinerary-items/:itemId`
- `DELETE /trips/:tripId/itinerary-items/:itemId`
- `POST /trips/:tripId/suggestions`
- `POST /trips/:tripId/suggestions/:suggestionId/approve`
- `POST /trips/:tripId/plans/:planId/promote`

Future WebSocket event examples:

- `trip.updated`
- `plan.updated`
- `itinerary_item.created`
- `itinerary_item.updated`
- `itinerary_item.deleted`
- `suggestion.created`
- `suggestion.resolved`
- `presence.updated`
- `expense.summary_updated`

Frontend state:

- selected route/tab/day/plan
- sidebar expanded/collapsed preference
- draft/save status
- focused table row
- local validation issues
- optimistic update status
- context rail mode

Security note:

- Frontend role labels are only for UX.
- Future backend must enforce capabilities server-side.
- UI should read capability-like flags where possible instead of scattering
  direct role string checks.

## 11. Error, Empty, and Recovery States

Required states:

- Loading trip.
- Trip unavailable.
- Draft saved locally.
- Draft save unavailable.
- Validation issue.
- Suggestion conflict.
- Empty day.
- Empty suggestions.
- Map requires user consent to load external tiles.
- Permission/capability mismatch.

Recovery copy should be short, specific, and actionable.

Examples:

- "Add a start time before this stop can appear in Now / Next."
- "This draft is saved in this browser only."
- "Load live map to preview route tiles."
- "You can view this plan, but editing requires organizer access."

## 12. Accessibility

Requirements:

- All controls keyboard reachable.
- Focus states visible.
- Sidebar toggle has `aria-expanded`.
- Icon-only buttons have accessible labels.
- Tables use proper table semantics.
- Tab panels use correct `role`, `aria-selected`, and keyboard behavior.
- Status changes use polite live regions where useful.
- Text contrast meets WCAG AA.
- Color is not the only warning indicator.
- Reduced motion is respected.

## 13. Testing and Verification

Run verification appropriate to the codebase after implementation.

Expected checks:

- Typecheck.
- Lint.
- Unit tests for itinerary, suggestions, storage, and formatting helpers.
- Component tests for:
  - collapsible sidebar
  - command bar
  - smart table
  - context rail
  - responsive navigation
- Browser QA at:
  - 320px
  - 768px
  - 1024px
  - 1440px
- Visual QA for:
  - no page-level horizontal scroll
  - table scroll contained to table viewport
  - sidebar expanded/collapsed
  - right rail relocation on tablet
  - readable Thai and English mixed text
  - no overlapping controls or clipped labels

## 14. Do and Don't

Do:

- Build the usable app surface as the first screen.
- Keep the Smart Table central.
- Make the sidebar collapsible.
- Design for responsive behavior from the start.
- Use one icon set.
- Keep UI text concise and functional.
- Preserve local state clearly until backend exists.
- Keep architecture ready for REST/WebSocket.

Don't:

- Build a landing page.
- Hide editing behind a decorative dashboard.
- Use emoji as product chrome.
- Use purple-heavy prototype styling.
- Add decorative gradients/orbs/blobs.
- Create nested cards.
- Let the page horizontally scroll on mobile.
- Trust frontend roles as real authorization.
- Over-optimize mobile trip mode in this phase.

## 15. Prompt Guide for Future Agents

When modifying this frontend, follow this prompt:

> Build a desktop-first collaborative travel planning cockpit using the Calm
> Travel Ops design system. The Smart Itinerary Table is the source of truth.
> Keep the left navigation collapsible, preserve responsive behavior across
> desktop/tablet/mobile, and prepare the data boundary for future REST and
> WebSocket integration. Use minimal white/slate UI with teal primary actions,
> blue route accents, orange warning states, Noto Sans Thai typography, and one
> consistent icon set. Do not build a landing page, do not use emoji as app
> chrome, do not create nested cards, and do not allow page-level horizontal
> scroll.
