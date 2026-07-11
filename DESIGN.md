---
name: Calm Travel Ops
status: approved-design-source-of-truth
lastUpdated: 2026-07-11
product: Joii Travel Planning Cockpit
projectCodename: Sagittarius
publicBrand: Joii
description: |
  Desktop-first collaborative travel planning cockpit. Combines a friendly,
  clean group-trip identity with serious planning workflow: smart itinerary
  table, plan variants, map context, and role-aware views. The Smart Itinerary
  Table is the planning source of truth.
platforms:
  - desktop (primary, 1200px+)
  - tablet (768–1199px)
  - mobile (320–767px, trip-companion mode deferred)
backendPlan: REST + WebSocket + Rust + PostgreSQL (built after frontend)
---

# Design System

## 1. Principles

1. **Smart Table is the source of truth.** Itinerary edits, day structure,
   ordering, validation, plan variants, and review actions orbit around the
   table.

2. **Context stays nearby.** The right rail shows what helps the current
   planning decision: route preview, open suggestions, validation issues,
   expense summary, people, or selected row details.

3. **Minimal, not empty.** Reduce visual noise, but keep strong hierarchy,
   useful summaries, and obvious actions.

4. **Desktop-first.** The authenticated app opens into the planning cockpit.
   Tablet and mobile are supported, but mobile trip-companion mode is deferred.

5. **Calm, professional, warm.** The UI should feel like a refined travel
   operations desk — not a toy prototype, enterprise admin panel, or travel
   agency landing page.

## 2. Visual System

### Theme

**Calm Travel Ops** — white/slate surfaces, teal primary, blue routes, orange
warnings. Sparse category color only when it clarifies meaning.

Use:
- Clean iconography from one set (Lucide).
- Stable grid tracks and explicit min/max constraints.
- Tabular numerals for times, durations, money, and row metrics.
- Sentence case for UI labels.

Avoid:
- Emoji as navigation, button, or status icons.
- Purple-heavy prototype styling.
- Nested cards.
- Decorative blobs, orbs, bokeh, or ornamental gradients.
- Large hero sections inside the app.
- Marketing copy inside the app shell.
- UI state changes that shift unrelated layout.

### Color Tokens

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

Color roles:
- **Primary teal**: main actions, selected nav, confirmed state.
- **Route blue**: map, navigation, transport, route metadata.
- **Warning orange**: itinerary issues, conflicts, pending reviews.
- **Danger red**: destructive actions only.
- **Success green**: completed, approved, settled.
- **Muted slate**: secondary text, helper text, quiet metadata.

### Typography

Primary font: `Noto Sans Thai` (supports Thai + English in the same interface).

```css
font-family: "Noto Sans Thai", Inter, ui-sans-serif, system-ui, -apple-system,
  BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Rules:
- Do not scale font size with viewport width.
- Letter spacing: `0` by default.
- Keep heading hierarchy compact — this is not a hero page.

Scale:

| Role | Size / Line | Weight |
|------|------------|--------|
| Page title | 28px / 34px | 750–800 |
| Section title | 20px / 28px | 700 |
| Panel title | 16px / 22px | 700 |
| Body | 14px / 22px | 400–500 |
| Label | 12px / 16px | 650–700 |
| Table cell | 13px / 18px | 450–600 |
| Button | 13px / 18px | 700 |

### Tailwind Shorthand Convention

For utilities whose value is a single CSS variable token, use the canonical
shorthand form: `text-(--color-text-muted)`, `bg-(--color-surface)`,
`border-(--color-border)`, `rounded-(--radius-md)`.

Reserve bracketed arbitrary values for expressions that are not a single token:
`rgb(...)`, `color-mix(...)`, gradients, fallback vars, shadows, and arbitrary
properties.

## 3. Layout

### Desktop (≥1200px)

Three-column grid:
- **Left rail**: 220px expanded / 68px collapsed.
- **Main workspace**: fluid, minimum useful table width.
- **Right context rail**: 300–340px.

Main workspace contains:
1. Top command bar.
2. Summary strip.
3. Smart Itinerary Table.

Right context rail contains:
- Current context card.
- Map preview.
- Review queue or selected item details.
- Budget/people/status modules as needed.

### Tablet (768–1199px)

- Left rail defaults collapsed.
- Right context rail moves below the command bar as stacked context panels.
- Smart Table remains the highest-priority content.

### Mobile (320–767px)

- No desktop sidebar — compact top navigation.
- Smart Table may use scoped horizontal scroll or condensed row cards.
- All planning sections remain reachable.
- Do not build mobile trip mode as the primary flow.

### Global Rules

- The page itself must not horizontally scroll.
- Only the table viewport may scroll horizontally when columns cannot compress.
- Use stable grid tracks and explicit min/max constraints.
- UI state changes must not shift unrelated layout.

## 4. Collapsible Left Rail

| State | Width | Content |
|-------|-------|---------|
| Expanded | 220px | Joii brand, trip identity, nav labels, role/profile summary, secondary actions |
| Collapsed | 68px | Icon-only navigation, active item obvious, tooltips expose names |

Behavior:
- Persist preference in local storage.
- On tablet, default to collapsed.
- On mobile, replace with compact top navigation.
- Toggle control must have `aria-expanded`, clear focus state, `aria-label`.

## 5. Component Rules

### Surface Selection Ladder

Before adding or changing any surface, choose the right level:

1. **Inline**: field errors, row actions, small edits, validation hints, status
   near the affected control.
2. **Workspace panel**: main work surface (itinerary table, people list,
   expenses ledger, plan filters, summary strips).
3. **Inspector** (right context rail): details tied to current selection (stop
   details, route preview, notes, suggestions, stop expenses).
4. **Task dialog**: focused forms or blocking decisions (create/edit stop,
   confirm deletion, resolve ambiguous place, auth/permission step).
5. **Toast**: short-lived feedback (saved, copied, undone, joined, sync status).

Rules:
- If the user must compare, scan, sort, or edit multiple items continuously →
  workspace panel.
- If the user needs table/page context while reading or editing details →
  inspector, not a task dialog.
- If the interaction is destructive, identity-sensitive, or cannot be left
  half-complete → task dialog.
- If feedback requires user correction → show inline or persistent near the
  source. Do not rely on auto-dismissing toast.
- Toasts auto-dismiss after a short delay unless they contain an undo action.
- On tablet/mobile, inspectors may stack below the command area or become a
  bottom sheet.

### App Shell

- No marketing hero. No decorative nested card wrapper.
- Use semantic landmarks: `header`, `nav`, `main`, `aside`.
- Navigation must be predictable and role-aware.

### Command Bar

Required controls:
- Plan variant selector.
- Selected day selector.
- Add row/action button.
- Sidebar toggle (if left rail present).
- Draft/save state.

Rules: keep controls compact and aligned. Labels must remain visible for form
controls. Avoid ambiguous icon-only actions without tooltips or labels.

### Smart Itinerary Table

The planning source of truth.

Capabilities:
- Group rows by day.
- Edit time, activity, type, location/map link, duration, transport, notes.
- Add, duplicate, delete, reorder rows.
- Show validation issues.
- Open focused day/plan views.
- Respect role capabilities.

Rules:
- Scoped table scroll area, not page-level horizontal overflow.
- Keyboard access preserved.
- Row density compact but readable.
- Selected row drives right-context details.
- Warnings visible without relying on color alone.

### Right Context Rail

Supports the current planning decision.

Modules: selected stop details, map preview, open suggestions/conflicts,
budget/expense summary, people/collaborator state, validation summary.

Rules: context modules must not compete with the table. Use one primary context
at a time when space is tight.

### Cards and Panels

Use cards only for: individual modules, repeated list items, modals, tool
panels.

Do not: put cards inside cards, style entire page sections as floating cards,
use overly rounded 28–48px prototype cards.

Tokens:
- Radius: 12–16px.
- Border: `1px solid var(--color-border)`.
- Shadow: optional, subtle only.
- Padding: 12–16px for dense panels, 20–24px for summary panels.

### Buttons

- Minimum hit area: 44px.
- Primary: teal fill, white text.
- Secondary: muted surface, slate or teal text.
- Danger: red only for destructive operations.
- Hover/focus must not resize or shift layout.
- Focus state must be visible.

### Forms and Inputs

- Labels remain visible.
- Inputs: 8–12px radius, not pill by default.
- Helper and error text near the field.
- Do not rely on placeholder as label.
- Focus ring: teal border + soft outer ring.

### Icons

Use one icon family, preferably Lucide.

Mappings:
- Dashboard: `layout-dashboard`
- Itinerary/table: `table`
- Ideas/suggestions: `lightbulb`
- Map/route: `map`
- Expenses: `wallet` / `cards`
- People: `users`
- Settings: `settings`
- Collapse/expand: `panel-left-close` / `panel-left-open`

## 6. Interaction & Motion

Motion should be quiet and functional.

Use:
- 150–220ms transitions for color, opacity, shadow, and transform.
- Subtle hover lift only for clickable cards.
- Clear selected, hover, active, disabled, and focus states.

Avoid:
- Bouncy prototype motion.
- Continuous decorative animation.
- Hover scale on dense table rows.
- Layout shifts on hover.

Respect `prefers-reduced-motion`.

## 7. States & Recovery

Required states across the app:

| State | Example copy |
|-------|-------------|
| Loading trip | — |
| Trip unavailable | — |
| Draft saved locally | "This draft is saved in this browser only." |
| Draft save unavailable | — |
| Validation issue | — |
| Suggestion conflict | — |
| Empty day | — |
| Empty suggestions | — |
| Map consent required | "Load live map to preview route tiles." |
| Permission mismatch | "You can view this plan, but editing requires organizer access." |
| Now/Next missing start time | "Add a start time before this stop can appear in Now / Next." |

Recovery copy must be short, specific, and actionable.

## 8. Accessibility

- All controls keyboard reachable.
- Focus states visible.
- Sidebar toggle has `aria-expanded`.
- Icon-only buttons have accessible labels.
- Tables use proper table semantics.
- Tab panels use correct `role`, `aria-selected`, and keyboard behavior.
- Status changes use polite live regions.
- Text contrast meets WCAG AA.
- Color is not the only warning indicator.
- Reduced motion respected.

## 9. Architecture Note

The frontend uses local/mock data now, but the UI architecture must be backend
ready. A data boundary (`tripRepository` / `tripDataAdapter`) isolates UI code
from data sources. Components never import backend types or call fetch directly
for trip data.

Future REST commands (reference):
- `GET /trips/:tripId`
- `PATCH /trips/:tripId/plans/:planId`
- `POST /trips/:tripId/itinerary-items`
- `PATCH /trips/:tripId/itinerary-items/:itemId`
- `DELETE /trips/:tripId/itinerary-items/:itemId`
- `POST /trips/:tripId/suggestions`
- `POST /trips/:tripId/suggestions/:suggestionId/approve`
- `POST /trips/:tripId/plans/:planId/promote`

Future WebSocket events (reference):
- `trip.updated`, `plan.updated`
- `itinerary_item.created`, `itinerary_item.updated`, `itinerary_item.deleted`
- `suggestion.created`, `suggestion.resolved`
- `presence.updated`, `expense.summary_updated`

Frontend role labels are UX-only. Future backend enforces capabilities
server-side. UI should read capability-like flags rather than scattering direct
role string checks.

## 10. Landing Surface (Public)

Theme: **Postcard Atlas**. The landing page may be more visual and editorial
than the cockpit, but must still feel calm, useful, and product-connected.

Rules:
- Header is minimally: Joii brand, EN/TH language switch, `Log in`, `Trip
  access`. English is default landing language.
- Do not expose "Sagittarius" on the landing page.
- No full navigation links in the landing header.
- Desktop may show product preview and secondary hero actions.
- Mobile hides product preview and hero buttons (header actions suffice).
- Use bitmap travel art for empty destination thumbnails — no gradient
  placeholder blocks.
- Generated landing art: avoid text, logos, close-up faces, heavy shadows.
- Hero background: broad lat/long-style grid lines, two to three soft
  watercolor blooms, one clear atlas-style route line behind content. Avoid
  decorative pattern noise.
- Do not place decorative map or plane icons around the hero title — the route
  line and grid carry the map metaphor.
- SVG brand icons may be sourced from [theSVG](https://thesvg.org/) for footer
  or external-source links. App controls continue using the local icon set.
