# Bilingual Web Design

## Goal

Make the Sagittarius web app bilingual in English and Thai without changing the
current URL structure.

## Decision

Use an in-app language switch with a saved user preference. Do not add locale
segments such as `/en` or `/th` to routes.

English is the default language. If the user has not chosen a language before,
the app renders English. When the user switches language, the app stores the
choice locally and reuses it on later visits.

## User Experience

- Keep existing routes unchanged, including `/login`, `/register`, `/trips`,
  and `/trips/{tripId}` child routes.
- Add a compact `EN | TH` language switch in persistent app chrome.
- Show the same switch on access surfaces where the sidebar is not visible,
  such as login, register, and trip join screens.
- Switching language updates visible UI text immediately without navigation.
- Preserve user-entered and domain data as-is. Trip names, place names, member
  names, task titles, notes, suggestions, and backend-provided content are not
  machine-translated.

## Architecture

Add a small typed i18n layer under `frontend/src/i18n`.

The layer owns:

- `Locale`: the supported locale union, `en | th`.
- `defaultLocale`: `en`.
- Message dictionaries for English and Thai.
- A React provider and hook, exposed as `I18nProvider` and `useI18n`.
- Local persistence through a single browser storage key.
- A side effect that updates `document.documentElement.lang` after hydration.

Components should read UI copy from the i18n hook instead of hardcoded strings.
Dynamic formatting helpers should accept the active locale when the rendered
text differs by language.

## Component Scope

Translate user-facing UI text across the production web app:

- Landing and account access surfaces.
- Trip join and member access flows.
- App shell navigation, summary, role labels, and member switch actions.
- Overview, itinerary, map, timeline, members, context rail, dialogs, and shared
  UI labels.
- Empty states, validation messages, alert/confirm text, aria labels, button
  titles, placeholders, and status labels.

Tests and Storybook should be updated where they assert translated labels.

## Data And Formatting

- Keep currency behavior unchanged.
- Keep date math unchanged.
- Use the active locale for UI date labels where practical.
- Keep backend API payloads unchanged.
- Do not persist locale to the backend in this slice.

## Error Handling

If browser storage is unavailable or contains an unknown value, fall back to
English. Language switching should still work in memory for the current session.

If a message key is missing during development, TypeScript should catch it by
requiring both dictionaries to satisfy the same message shape.

## Testing

Add focused unit tests for the i18n layer:

- English renders by default.
- Switching to Thai updates text immediately.
- The selected locale persists across remounts.
- Unknown stored locale falls back to English.

Update component tests for representative bilingual surfaces:

- App shell navigation and role labels.
- Account access or trip join flow.
- At least one planning surface, such as overview or itinerary.

Update Storybook so English remains the default story language and at least one
Thai variant exists for key page templates.

## Real System QA

Before claiming the feature is done, run real-system feature QA because this is
a user-facing frontend feature with route-level screens and persisted browser
state.

Minimum browser evidence:

- Open the current dev app.
- Confirm the default language is English on first load.
- Switch to Thai and confirm the current screen updates.
- Reload and confirm Thai is remembered.
- Switch back to English and confirm routes remain unchanged.
- Check at least one mobile viewport.
- Check browser console and network errors.

## Non-Goals

- No `/en` or `/th` URL routes.
- No backend locale preference.
- No machine translation of user data.
- No full SEO localization pass.
- No redesign of page layout beyond placing the language switch cleanly.
