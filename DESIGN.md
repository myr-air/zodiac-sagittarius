---
version: alpha
name: Joii Calm Travel Ops
description: >-
  Visual identity for Joii (codename Sagittarius): a calm group-trip planning
  cockpit with a Postcard Atlas public landing surface.
colors:
  page: "#f8fafc"
  surface: "#ffffff"
  surface-muted: "#f1f5f9"
  surface-subtle: "#f8fafc"
  text: "#172033"
  text-muted: "#475569"
  text-subtle: "#64748b"
  border: "#e2e8f0"
  border-strong: "#cbd5e1"
  primary: "#0f766e"
  primary-strong: "#115e59"
  primary-soft: "#ecfeff"
  primary-border: "#99f6e4"
  route: "#2563eb"
  route-soft: "#eff6ff"
  route-border: "#bfdbfe"
  warning: "#f97316"
  warning-strong: "#c2410c"
  warning-soft: "#fff7ed"
  warning-border: "#fed7aa"
  danger: "#dc2626"
  danger-soft: "#fef2f2"
  danger-border: "#fecaca"
  success: "#16a34a"
  success-soft: "#f0fdf4"
  success-border: "#bbf7d0"
  on-primary: "#ffffff"
typography:
  brand:
    fontFamily: Noto Sans Thai
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: 0
  page-title:
    fontFamily: Noto Sans Thai
    fontSize: 28px
    fontWeight: 700
    lineHeight: 34px
    letterSpacing: 0
  section-title:
    fontFamily: Noto Sans Thai
    fontSize: 20px
    fontWeight: 700
    lineHeight: 28px
    letterSpacing: 0
  panel-title:
    fontFamily: Noto Sans Thai
    fontSize: 16px
    fontWeight: 700
    lineHeight: 22px
    letterSpacing: 0
  body:
    fontFamily: Noto Sans Thai
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22px
    letterSpacing: 0
  label:
    fontFamily: Noto Sans Thai
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0
  table-cell:
    fontFamily: Noto Sans Thai
    fontSize: 13px
    fontWeight: 500
    lineHeight: 18px
    letterSpacing: 0
  button:
    fontFamily: Noto Sans Thai
    fontSize: 13px
    fontWeight: 700
    lineHeight: 18px
    letterSpacing: 0
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  rail-expanded: 220px
  rail-collapsed: 68px
  context-rail: 320px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 12px
    typography: "{typography.button}"
  button-primary-hover:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: 12px
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 12px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: 16px
---

# Joii Design System

Public brand is **Joii**. Local project codename is **Sagittarius** — never use
Sagittarius as the customer-facing product name.

## Overview

**Calm Travel Ops** for the planning cockpit. **Postcard Atlas** for the public
landing page.

The product should feel like a refined travel operations desk: clear, quietly
warm, professional, and supportive for long desktop planning sessions. Landing
may be more editorial and atmospheric, but still calm and product-connected —
bright paper, teal routes, soft map-grid metaphors — not a marketing carnival.

Primary users are organizers, travelers, and viewers collaborating on a shared
trip. The emotional target is trustworthy, scan-friendly, and lightly travel-
energetic. Avoid toy prototypes, dense enterprise admin chrome, purple-heavy AI
defaults, and decorative dashboards that hide editing behind extra clicks.

## Colors

Palette roles:

- **Primary teal (`#0f766e`):** main actions, selected nav, confirmed state.
- **Route blue (`#2563eb`):** map, navigation, transport, route metadata.
- **Warning orange (`#f97316`):** itinerary issues, conflicts, review-needed.
- **Danger red (`#dc2626`):** destructive actions only.
- **Success green (`#16a34a`):** completed, approved, settled.
- **Slate neutrals:** page/surface/text/border hierarchy for long sessions.

Landing may add restrained coral/amber warmth and soft route-grid atmosphere.
Do not let any single hue dominate. Never use emoji as status or navigation
icons.

In CSS/Tailwind, prefer token shorthand such as `text-(--color-text-muted)`,
`bg-(--color-surface)`, `border-(--color-border)`, `rounded-(--radius-md)`.

## Typography

Use **Noto Sans Thai** as the primary face so Thai and English share one
interface. Fallbacks: Inter, ui-sans-serif, system-ui.

Rules:

- Do not scale type with viewport width.
- Default letter-spacing is `0`.
- Use tabular numerals for times, durations, money, and row metrics.
- Sentence case for UI labels.
- Inside the cockpit, keep heading hierarchy compact — not a hero page.

## Layout

Desktop-first planning cockpit at `>= 1200px`:

- Left rail: `220px` expanded or `68px` collapsed.
- Main workspace: fluid; Smart Itinerary Table is the source of truth.
- Right context rail: about `300–340px` for selection, map preview, suggestions,
  budget, or people context.

Tablet (`768–1199px`): collapse left rail by default; stack context under the
command bar. Mobile (`320–767px`): compact top nav; do not make mobile trip-day
mode the primary flow in this phase.

Global rules:

- The page itself must not horizontally scroll.
- Only the table viewport may scroll horizontally when columns cannot compress.
- UI state changes must not shift unrelated layout.
- Landing header stays minimal: Joii brand, EN/TH switch, Log in, Trip access.

## Elevation & Depth

Prefer tonal layers and hairline borders over heavy shadows. Surfaces sit on
`page` / `surface` / `surface-muted`. Optional shadow is subtle only. Cockpit
pages stay flatter than the landing atmosphere; reserve postcard treatment for
landing, empty states, photo covers, and selected trip identity — not every
operational header.

## Shapes

Corner language is soft-operational, not pill-heavy:

- Inputs and dense controls: `8–12px`.
- Panels and cards: `12–16px`.
- Avoid `28–48px` prototype cards and nested cards.
- Minimum interactive hit area: `44px`.

## Components

**Surface ladder** (preserve context; interrupt only when required):

1. Inline — field errors, row actions, validation near the source.
2. Workspace panel — itinerary table, people list, expenses ledger.
3. Inspector — right rail / contextual drawer for selection details.
4. Task dialog — destructive, identity-sensitive, or must-finish flows.
5. Toast — short confirmation only; never the sole place for recoverable errors.

**Buttons:** primary teal fill + white text; secondary muted surface; danger red
only for destructive work. Hover/focus must not resize layout. Focus rings must
be visible.

**Forms:** visible labels; helper/error text beside the field; no placeholder-as-
label. Focus: teal border plus soft outer ring.

**Icons:** one family (prefer Lucide). No emoji controls.

**Cards:** only for modules, list items, modals, and tool panels — never card-
in-card page shells.

## Do's and Don'ts

- Do keep the itinerary table as the planning source of truth.
- Do put the next decision near relevant context (rail, inspector, inline).
- Do support English and Thai with the same type system and contrast.
- Do respect `prefers-reduced-motion`; keep motion quiet (150–220ms).
- Don't put marketing heroes, postcard stacks, or explanatory promo copy inside
  the cockpit.
- Don't use purple-on-white AI-default themes, cream+terracotta serif tropes, or
  broadsheet hairline newspaper layouts.
- Don't flatten itinerary path / trip-plan models into a single undifferentiated
  list for import, export, or overlap handling.
- Don't expose the codename Sagittarius on public surfaces.
