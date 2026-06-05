# Trip Temp Access Session Design

## Goal

Improve temporary trip access so travelers do not need to log in repeatedly,
while keeping access revocable. Trip member sessions are first-class trip-scoped
sessions and do not require account linking.

## Current Context

The backend already uses database-backed opaque session tokens:

- account sessions are stored in `user_sessions` as hashed tokens;
- trusted account sessions last 30 days;
- temporary account sessions last 1 day;
- trip member sessions are stored in `trip_member_sessions` as hashed tokens;
- trip join sessions are short-lived and consumed after claim or login.

This design keeps that model. It does not introduce JWT as the primary session
mechanism.

## Decision

Use opaque random session tokens backed by database rows for temporary trip
access. Store only token hashes in the database, and verify each request against
the current member, trip, session, and access status.

JWT should not be the default for trip sessions because trip access must be
revocable immediately when a member is disabled, a session is revoked, a trip
date changes, or a token is suspected to be leaked. A long-lived JWT would need
a denylist or database check to support those cases, which removes the main
benefit of stateless JWTs.

## Access Rules

### Owner / Permanent Account

Owner access is tied to the permanent account session and trip ownership.

- Owners use the permanent account session.
- Owner trip access is not capped by `trip.end_date + 7 days`.
- Access still depends on the account session being active and the user not
  being disabled.

### Trip Members

Owners, organizers, travelers, and viewers can use trip member sessions.
Account linking is optional and must not be required for normal trip workspace
access.

- Organizer and traveler session expiry is `now + 7 days`, except during the
  active trip window (`trip.start_date - 7 days` through `trip.end_date`), where
  the session lasts through `trip.end_date + 7 days`.
- Viewer session expiry is `now + 1 day`, capped at `trip.end_date + 7 days`.
- Returning organizer/traveler sessions may be refreshed while still valid;
  viewer sessions are not refreshed.
- A valid member session is enough to load and operate the trip workspace within
  the member's role capability matrix.
- Disabled members cannot authenticate, refresh, load trip data, mutate data, or
  subscribe to realtime updates.

## Token Storage

Prefer `HttpOnly`, `Secure`, `SameSite=Lax` cookies for session tokens when the
frontend and backend are ready for cookie-based auth. This gives users the
convenience of staying signed in without exposing tokens to JavaScript.

If the current frontend still needs bearer tokens during the transition, keep
the existing client storage path for the smallest implementation step, but do
not make local storage the long-term security target.

## Data Flow

1. User joins a trip with the trip join code and trip password.
2. Backend issues a short-lived join session.
3. User claims or logs in as a member.
4. Backend calculates the member session expiry from role, current time, and
   trip dates.
5. Backend stores only the token hash and returns the raw token once.
6. Authenticated trip APIs verify the token hash, session expiry, revocation,
   member access status, role, and trip id.
7. On successful trip workspace load, backend extends eligible organizer/traveler
   session expiry.

## Implementation Shape

Add one shared domain helper for member session policy, for example:

```text
member_session_expires_at(role, trip_start_date, trip_end_date, now)
```

The helper returns a concrete expiry timestamp. Keep this helper as the single
policy point so login and tests do not drift.

Use the same helper for login, claim, refresh, and tests so the date rules do
not drift.

## Error Handling

- Return `401 unauthenticated` for missing, expired, revoked, malformed, or
  unknown session tokens.
- Return `403 forbidden` for valid identities whose role or access status does
  not allow the action.
- Treat expired, revoked, or disabled sessions as unauthenticated/forbidden so
  the user is guided back through the join flow.

## Tests

Backend contract tests should cover:

- organizer and traveler member sessions use the 7-day/trip-window policy;
- viewer member sessions last 1 day and are capped at `trip.end_date + 7 days`;
- trip workspace load refreshes organizer/traveler sessions while leaving viewer
  sessions unchanged;
- valid unexpired member sessions remain first-class proof for account linking;
- owner access through permanent account is not capped by trip end;
- disabled members cannot use an otherwise valid unexpired session;
- revoked sessions stop working immediately.

Frontend/API tests should cover:

- returning trip members do not need to re-enter the member password while the
  refreshed session remains valid;
- expired trip member access returns to the join/access flow;
- stored session state is cleared or replaced when the backend rejects it.

## Out Of Scope

- Stateless JWT session auth.
- User-selectable viewer session durations.
- Changing the existing trip role capability matrix.
- Building the final cookie migration if the smallest implementation step keeps
  bearer token storage temporarily.
