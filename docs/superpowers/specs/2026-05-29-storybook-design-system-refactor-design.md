# Storybook Design System Refactor Design

## Goal

Refactor the Sagittarius frontend so Storybook becomes the template source for
real web pages and reusable components, while the app becomes more joyful,
friendly, minimal, and clean for groups of friends planning trips together.

The selected direction is a design-system refactor plus Storybook templates.
This is broader than visual polish: the component boundaries, shared fixtures,
page templates, and visual system should all support the same product surface.

## Product Direction

Sagittarius should feel like a friendly trip studio for friends planning a trip
together. It should still be useful for real planning work, but it should no
longer feel like a formal operations desk.

The visual direction is a hybrid system:

- `overview` and `itinerary` stay focused and practical, with friendly color,
  warmer copy, and clearer shared-planning states.
- `timeline`, `map`, `members`, empty states, and celebration states can use
  stronger travel motifs.
- All pages must share one theme, one token system, and one motif vocabulary.
  Motifs are accents inside a shared system, not separate page themes.

## Current State

The repo is a Next.js 16 / React 19 app using Tailwind CSS 4, Vitest, and
Storybook 10 through `@storybook/nextjs-vite`.

Relevant current files:

- `src/app/SagittariusApp.tsx` owns most app state and page composition.
- `src/app/SagittariusApp.stories.tsx` exposes only one app-level Storybook
  story.
- `src/components/ui.tsx` contains small primitives for `Button`, `Panel`, and
  `Badge`.
- `src/components/PageHeader.tsx` exists in the current working tree and is a
  useful starting point for reusable page chrome.
- `app/globals.css` contains the full visual system, page styles, and component
  classes in one large stylesheet.
- Existing docs already describe the older `Calm Travel Ops` system and a
  shared workspace layout direction.

The working tree currently contains unrelated uncommitted frontend changes.
Implementation must preserve user work and only change files needed for this
refactor.

## Approved Approach

Use three layers.

### 1. Design System Layer

This layer defines primitives and shared styling used by both the app and
Storybook:

- tokens for page, surface, text, border, primary, route, warning, success,
  danger, and joyful accent colors;
- component primitives such as buttons, badges, panels, avatars, icon buttons,
  empty states, page headers, and motif primitives;
- code-native SVG/CSS travel motifs such as route lines, pins, postcards,
  compact map paths, companion avatars, checklist markers, and luggage tags;
- reduced-motion-safe animation utilities.

Generated or bitmap assets are allowed only for special moments where they add
meaning, such as an empty timeline or a completed planning celebration. The
default motif system should be code-native SVG/CSS.

### 2. Template and Section Layer

This layer contains reusable page sections that Storybook can render as
templates:

- workspace shell and page frame;
- page header with optional motif slot;
- overview stat grid;
- shared checklist/task panel;
- itinerary table frame;
- timeline strip and timeline motif moment;
- members roster and invite/access panels;
- map context frame;
- empty, dense, read-only, and role-specific states.

Templates should be presentational where possible. They accept typed props and
callbacks, and they use fixtures from a shared Storybook/app fixture layer.

### 3. App Orchestration Layer

`SagittariusApp` remains the stateful orchestration surface for the prototype:

- auth/join state;
- local trip state, undo/redo, and selected item state;
- role selection for previewing capabilities;
- suggestion review, task creation, stop notes, and stop editing.

The orchestration layer should compose templates instead of embedding large
presentational blocks. This keeps the app behavior intact while making the same
screens available as Storybook templates.

## Storybook Scope

Storybook should become a usable template catalog, not only a demo page.

Required story groups:

- `Design System/Buttons`
- `Design System/Badges`
- `Design System/Page Header`
- `Design System/Travel Motifs`
- `Templates/Workspace Shell`
- `Templates/Overview`
- `Templates/Itinerary`
- `Templates/Timeline`
- `Templates/Map`
- `Templates/Members`
- `Pages/Overview`
- `Pages/Itinerary`
- `Pages/Timeline`
- `Pages/Map`
- `Pages/Members`

Required state coverage:

- organizer or owner;
- traveler;
- viewer;
- empty or near-empty trip;
- dense itinerary;
- pending suggestions;
- desktop viewport;
- mobile or narrow viewport docs.

The app may keep one full `Sagittarius/App/Cockpit` story, but it should no
longer be the only meaningful Storybook surface.

## Fixture Strategy

Create a shared fixture module so Storybook, tests, and templates do not
duplicate seed setup.

The fixture layer should expose:

- base trip data derived from `seedTrip`;
- current members for owner, traveler, and viewer states;
- plan items for active plan variant;
- pending and conflicted suggestions;
- checklist tasks;
- stop notes;
- expense summary;
- helper functions for creating empty and dense states.

Fixtures must remain deterministic. Stories should not depend on local storage,
current time, or random IDs.

## Visual System

The new visual language is **Friendly Trip Studio**.

It keeps the current clean Thai/English typography foundation and introduces a
warmer, more social product feel:

- Noto Sans Thai remains the main font for readability.
- Teal remains the primary action color.
- Route blue remains map/timeline context.
- Warm orange becomes both warning and travel warmth, used carefully.
- Add a small shared accent set for joyful moments: sky, sunshine, postcard,
  mint, and soft coral.
- Preserve high contrast for text and controls.
- Avoid page-specific palettes that make routes feel unrelated.
- Avoid decorative blobs, bokeh, unrelated gradients, emoji chrome, and nested
  card stacks.

Motif rules:

- Use code-native SVG/CSS first.
- Use the same geometry language across pages: clean strokes, small filled
  markers, compact travel objects, and stable 4-8px radii.
- Keep motifs secondary to planning content.
- Timeline and empty states can be more expressive than data-heavy planning
  panels.
- Bitmap/generated illustrations must match the shared palette and should be
  stored as explicit assets with alt text and Storybook coverage.

Motion rules:

- Use subtle 150-250ms transitions for hover, selected, and reveal states.
- Animate no more than one or two focal elements per view.
- Respect `prefers-reduced-motion`.

## Component Boundaries

Prefer these boundaries during implementation:

- Move shared demo data to a fixture module before writing broad stories.
- Extract presentational sections before changing behavior.
- Keep callbacks typed at the section boundary.
- Keep `SagittariusApp` as composition and state orchestration, not a giant
  layout renderer.
- Move repeated CSS into shared component classes or tokens only when at least
  two components use the pattern.
- Do not introduce a new UI library unless the current codebase already uses
  one.

Likely files to create:

- `src/trip/fixtures.ts`
- `src/components/motifs.tsx`
- `src/components/PageHeader.stories.tsx`
- `src/components/ui.stories.tsx`
- `src/components/OverviewTemplate.tsx`
- `src/components/OverviewTemplate.stories.tsx`
- `src/components/TimelineTemplate.stories.tsx`
- `src/components/MembersTemplate.stories.tsx`
- `src/components/MapTemplate.stories.tsx`
- `src/components/ItineraryTemplate.stories.tsx`

Likely files to modify:

- `src/app/SagittariusApp.tsx`
- `src/app/SagittariusApp.stories.tsx`
- `src/components/ui.tsx`
- `src/components/PageHeader.tsx`
- `src/components/OverviewPage.tsx`
- `src/components/TimelineView.tsx`
- `src/components/RouteMapView.tsx`
- `src/components/TripMembersPage.tsx`
- `src/components/SmartItineraryTable.tsx`
- `src/components/icons.tsx`
- `app/globals.css`
- `.storybook/preview.ts`
- tests under `src/components` and `src/styles.contract.test.ts`

The exact implementation plan may split these differently if the current dirty
worktree makes another boundary safer.

## UX Behavior

The refactor should preserve existing product behavior:

- trip join and participant authentication;
- role-aware capabilities;
- itinerary item creation, editing, selection, and moving;
- undo and redo for trip mutations;
- context rail for supported views;
- task creation and status toggling;
- member management;
- map and timeline views.

The redesign should improve perceived friendliness without hiding core tasks.
Buttons, filters, forms, and table controls remain code-native and accessible.

## Testing And Verification

Automated checks:

- `bun test`
- `bun run lint`
- `bun run typecheck`
- `bun run build`
- `bun run build-storybook`

Targeted tests:

- fixture module returns deterministic owner, traveler, viewer, empty, and
  dense states;
- Storybook files exist for all required design system, template, and page
  categories listed in the Storybook Scope section;
- shared motif tokens/classes exist and are not page-specific;
- reduced-motion CSS remains present;
- existing app behavior tests continue to pass.

Rendered QA:

- run the Next app and inspect overview, itinerary, timeline, map, and members;
- run Storybook and inspect design system stories plus at least three page
  templates;
- verify desktop and mobile widths;
- verify no horizontal page scroll except scoped table overflow;
- verify motif usage feels cohesive across pages;
- verify Storybook templates match the app enough to serve as implementation
  references.

## Out Of Scope

- Backend implementation.
- Replacing Next.js, React, Tailwind, Vitest, or Storybook.
- Building a marketing landing page.
- Replacing the whole app shell with a new product.
- Turning every page into illustration-led content.
- Removing role/auth behavior.
- Rewriting trip domain logic that is unrelated to template extraction.

## Success Criteria

The work is complete when:

- Storybook contains reusable design system, template, and page stories.
- Page templates render important role and density states from shared fixtures.
- The app uses the same components/templates represented in Storybook.
- The visual direction is friendlier and more joyful while remaining clean and
  consistent across pages.
- Code-native SVG/CSS motifs are the default, with bitmap assets only where
  they are intentionally useful.
- Existing app behavior remains intact.
- Automated checks and rendered QA pass.
