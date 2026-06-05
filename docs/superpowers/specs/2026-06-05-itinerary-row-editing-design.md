# Itinerary Row Editing Design

## Status

Approved for implementation on 2026-06-05.

## Context

The itinerary page is the planning cockpit's source of truth. The table should
support faster row edits without losing the calmer, scan-friendly operations
surface described in `DESIGN.md`.

The current table shows time, activity, type, map, transportation, and actions.
The existing `StopDialog` already handles the full edit form, including day,
path, duration, note, and hidden details. Delete currently uses
`window.confirm`, which does not match the app's modal vocabulary.

Pinterest references used as directional input:

- Notion table ideas: flat cells that look like readable table content until
  focused.
- Inline editing in tables: edit in place for quick visible fields.
- Confirmation modal examples: a focused destructive decision with clear yes/no
  actions.

## Decision

Use a hybrid editing model.

Visible, short table fields become inline-editable:

- `startTime`
- `activity`
- `place`
- `activityType`
- `transportation`

The edit button remains, but opens the full `StopDialog` for fields that are
too wide, hidden, or more error-prone in a row:

- `day`
- `pathId`
- `durationMinutes`
- `note`
- any future detail-only metadata

Delete opens an app-styled confirmation modal with explicit Yes/No actions
instead of using `window.confirm`.

## Interaction

Inline cells should look like the current table content in read mode. When a
row is selected or a user focuses a cell, the input affordance appears with a
subtle border/focus ring using existing teal focus tokens.

Save behavior:

- `Enter` saves the active inline field.
- `Blur` saves if the value changed and is valid.
- `Escape` cancels the active inline edit.
- Empty required values for activity/place should not save; they revert on
  cancel or remain focused with accessible feedback if validation is added.

The row should stay compact. No large helper text should appear inside table
cells. If a field feels cramped, the edit button is the escape hatch to the full
modal.

## Data Flow

Add this table callback for inline updates:

```ts
type InlineItineraryItemPatch = Partial<
  Pick<ItineraryItem, "startTime" | "activity" | "place" | "activityType" | "transportation">
>;

onUpdateItemInline?: (itemId: string, patch: InlineItineraryItemPatch) => void | Promise<void>;
```

The parent app applies the same local/API mutation rules used by
`updateSelectedStop`:

- Local mode updates the draft through the existing commit/history flow.
- API mode patches the backend with the current `expectedVersion`.
- Path fields are not changed by inline editing.

Inline edit must preserve `pathGroupId`, `pathId`, `pathName`, and `pathRole`.

## Components

`SmartItineraryTable`

- Owns transient inline edit UI state.
- Renders flat inputs/selects for the approved visible fields.
- Calls the parent inline update callback with a narrow patch.
- Keeps existing edit button behavior for the full dialog.
- Opens a delete confirmation modal from the delete button.

`SagittariusApp`

- Adds the inline patch handler.
- Reuses existing mutation logic where possible.
- Replaces the browser confirm delete path with modal confirmation.

`StopDialog`

- Continues to be the full edit modal.
- Does not become the default path for quick visible field edits.

## Accessibility

- Inputs/selects need accessible labels derived from the row activity and field
  name.
- Delete confirmation uses `role="dialog"`, `aria-modal="true"`, a labelled
  title, and keyboard-accessible Yes/No buttons.
- Existing table horizontal scroll and sticky mobile columns must remain usable.

## Testing

Focused tests should cover:

- Inline editing activity/place/time/type/transportation calls the new callback.
- `Escape` cancels an inline edit.
- Read-only roles cannot inline edit.
- Edit button still opens the full edit callback.
- Delete button opens a confirmation modal.
- No calls to delete happen when the user chooses No.
- Delete callback runs only after Yes.

Run at least:

- `npm test -- SmartItineraryTable`
- A real browser itinerary flow after implementation, including desktop and
  mobile overflow checks, because this changes a user-facing table workflow.
