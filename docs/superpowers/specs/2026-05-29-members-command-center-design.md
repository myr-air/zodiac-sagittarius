# Members Command Center Design

## Goal

Turn `/members` into a polished trip-member command center for organizers while keeping a clear read-only view for travelers and viewers.

## Scope

- Redesign the members page around the selected **A. Command Center** direction.
- Add working member-management features already implied by the UI:
  - search members by display name;
  - filter by role and identity status;
  - copy an invite link with visible feedback;
  - change non-owner member roles;
  - disable or re-enable non-owner access with confirmation;
  - reset a claimed identity with confirmation;
  - show an empty state when filters hide all members.
- Keep trip auth, role capability checks, and local persistence behavior as they work today.

## UX Structure

The page has four stacked regions:

1. **Header**: page title, trip name, current identity, and a concise permission label.
2. **Invite Panel**: invite URL, copy action, and a short hint that only managers can administer members.
3. **Summary And Filters**: compact metrics for total, active, waiting-to-join, disabled, plus search/status/role controls.
4. **Member Management**: dense desktop rows and stacked mobile rows. Each row shows avatar, name, role, access state, identity state, presence, and allowed actions.

## Visual Direction

- Keep the existing Sagittarius cockpit vocabulary: teal accent, white surfaces, light grey workspace, compact controls, and SVG icons.
- Use dashboard density on desktop and stacked rows on mobile.
- Do not rely on color alone for member state; every status uses text plus a visual indicator.
- Avoid nested cards inside decorative containers. Use one main page surface and row-level cards only.
- Mobile must avoid horizontal scroll at common widths down to 320px.

## Permissions

- `canManagePeople=true`: role select, disable/re-enable, reset claim, invite copy are enabled.
- `canManagePeople=false`: management actions are hidden or disabled, and the page explains that organizer access is required.
- Owners cannot be demoted or disabled.

## Error And Feedback States

- Copy invite success appears as short inline status text.
- Destructive actions use native confirmation before mutating state.
- Filter empty state tells the user no members match the current filters and offers a clear filters reset action.

## Testing

- Component tests cover filtering, invite copy feedback, reset filters empty state, and confirmation-gated access changes.
- Existing app tests continue proving `/members` is its own workspace page and the right drawer no longer owns member management.
- Run full unit tests, lint, typecheck, and a rendered screenshot smoke test for desktop and mobile.
