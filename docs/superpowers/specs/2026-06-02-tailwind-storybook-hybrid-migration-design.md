# Tailwind and Storybook Hybrid Migration Design

Date: 2026-06-02
Status: Approved

## Context

The frontend already uses Next, Tailwind CSS v4, and Storybook. Tailwind is imported from `frontend/app/globals.css`, and Storybook is configured with route, page, template, and design-system stories. The current app still relies mostly on semantic CSS selectors in a large global stylesheet.

The migration goal is not a full rewrite. The goal is to make AI-assisted UI work faster and safer by using Tailwind where it gives clear leverage, while preserving the existing design tokens and complex CSS where they remain useful.

## Goals

- Use Tailwind by default for new UI, shared components, simple layout, spacing, responsive rules, and variant styling.
- Keep Storybook as the UI source of truth before production routes depend on new or changed visual surfaces.
- Shrink global CSS gradually after each migration wave.
- Preserve the existing Calm Travel Ops palette, typography, radius, shadow, and accessibility behavior.
- Keep each pull request small enough to visually verify on desktop and mobile.

## Non-Goals

- Do not rewrite all of `frontend/app/globals.css` in one pass.
- Do not migrate map, table, modal, animation, or complex state selectors until there is a focused reason.
- Do not create duplicate Storybook-only markup that diverges from production components.
- Do not replace useful CSS variables with hardcoded Tailwind values.

## Architecture

### Styling Sources

`frontend/app/globals.css` remains responsible for:

- `@import "tailwindcss";`
- global CSS variables
- base document styles
- focus-visible and accessibility helpers
- complex selectors that are clearer in CSS than Tailwind class strings
- map, table, modal, and animation styles until migrated by focused work

React components become responsible for:

- utility-driven layout and spacing
- variant classes
- responsive adjustments
- component-local visual states

Storybook remains responsible for:

- documenting component variants
- documenting page and template states
- exercising mobile, long Thai text, disabled, empty, loading, and error states where relevant

### Shared Class Composition

Add or reuse a small `cn()` helper before migrating shared components. The helper should join conditional classes without introducing a large styling dependency unless the codebase already needs one.

The expected pattern is:

- keep a stable component API
- compute Tailwind classes from props
- allow caller `className` extension
- keep ARIA and semantic markup unchanged

## Migration Waves

### Wave 1: Foundation

Prepare the project for repeated small migrations.

Scope:

- Add or confirm a shared `cn()` helper.
- Document the hybrid rule in the migration plan.
- Confirm that design tokens stay in `globals.css`.
- Add a lightweight CSS cleanup rule: when a component moves to Tailwind, remove only the selectors made unused by that same change.

Verification:

- `bun run lint`
- `bun run typecheck`
- `bun run test`

### Wave 2: Shared UI

Migrate low-risk shared primitives first.

Scope:

- `Button`
- `Badge`
- `Panel`
- `PageHeader` if its dependencies remain simple

Storybook states:

- every variant
- disabled
- long Thai label
- mobile viewport
- at least one visual assertion for a token-backed color

Verification:

- `bun run lint`
- `bun run typecheck`
- `bun run test`
- `bun run test:storybook`
- `bun run build-storybook`
- browser check for the relevant Storybook stories

### Wave 3: Small Components

Migrate isolated components that have limited page-level layout responsibility.

Candidates:

- `LanguageSwitch`
- `PeoplePanel`
- `SuggestionPanel`
- small form controls and simple status panels

Storybook requirements:

- role or state variants where the component behavior changes
- long Thai text where labels can wrap
- mobile viewport when the component appears in constrained layouts

Verification:

- same as Wave 2
- production page browser check when a migrated component appears in a key route

### Wave 4: Page Templates

Migrate template-level layout one surface at a time.

Suggested order:

1. Overview
2. Members
3. Timeline
4. Itinerary
5. Map

Rationale:

- Overview and Members are lower risk than dense table and map surfaces.
- Timeline, Itinerary, and Map have more complex layout, interaction, and visual dependencies.

Storybook requirements:

- template story first
- page story using the same component
- role and density states preserved
- mobile viewport check

Verification:

- same as Wave 2
- browser check for the touched production route
- real-system feature QA if route, auth, session, backend data, or permissions are affected

### Wave 5: CSS Cleanup

Clean global CSS incrementally after each successful migration.

Scope:

- remove selectors that no longer have JSX references
- keep design tokens and complex CSS
- update contract tests only when the design contract intentionally changes

Verification:

- `bun run test`
- `bun run test:storybook`
- `bun run build-storybook`

## Testing Strategy

Each migration PR should choose the smallest verification set that proves the touched surface:

- Shared UI: unit tests, Storybook tests, Storybook build, browser Storybook check.
- Page template: shared UI checks plus production route browser check.
- Real flow: page checks plus real-system feature QA.

No migration PR should be marked complete only because lint, typecheck, or unit tests pass.

## Acceptance Criteria

- New UI prefers Tailwind utilities unless CSS is clearer for the behavior.
- Storybook documents every migrated shared component state needed by users or future AI edits.
- Production pages reuse the same components shown in Storybook.
- `globals.css` decreases gradually without losing global tokens or accessibility behavior.
- Each wave has passing verification evidence before completion.

## Implementation Plan Defaults

- Ship Wave 1 and Wave 2 as separate pull requests unless the Wave 1 inspection finds that no helper or setup change is needed.
- Inspect existing helper utilities before adding `cn()`. Add a new helper only when no equivalent helper already exists.
