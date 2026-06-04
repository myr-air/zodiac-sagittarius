# Trip Temp Access Session Design

## Goal

Improve temporary trip access so travelers do not need to log in repeatedly,
while keeping access revocable and bounded by the trip lifecycle.

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

### Organizer / Traveler

Organizers and travelers use trip member sessions.

- They may authenticate from `trip.start_date - 7 days` through
  `trip.end_date + 7 days`.
- On login, session expiry is:
  `min(now + 7 days, trip.end_date + 7 days)`.
- When they return while the session is still valid and the trip access window
  is still open, refresh the session expiry to:
  `min(now + 7 days, trip.end_date + 7 days)`.
- A session must never extend beyond `trip.end_date + 7 days`.
- Disabled members cannot authenticate, refresh, load trip data, mutate data, or
  subscribe to realtime updates.

### Viewer / Guest Link

Viewer access is a quick guest view.

- Viewer sessions last 1 day.
- There is no organizer-selectable viewer duration.
- Viewer expiry is:
  `min(now + 1 day, trip.end_date + 7 days)`.
- Viewer access remains read-only and follows the existing viewer capability
  matrix.

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
7. On eligible organizer/traveler requests, backend extends the session expiry
   using the same centralized expiry function.

## Implementation Shape

Add one shared domain helper for member session policy, for example:

```text
member_session_expires_at(role, trip_start_date, trip_end_date, now)
```

The helper returns either:

- a concrete expiry timestamp;
- or an unauthenticated/forbidden result when the current time is outside the
  role's allowed access window.

Use the same helper for login, claim, refresh, and tests so the date rules do
not drift.

## Error Handling

- Return `401 unauthenticated` for missing, expired, revoked, malformed, or
  unknown session tokens.
- Return `403 forbidden` for valid identities whose role or access status does
  not allow the action.
- Treat access outside the trip window as unauthenticated for login/session
  continuation, so the user is guided back through the join flow.

## Tests

Backend contract tests should cover:

- organizer and traveler can log in from 7 days before start through 7 days
  after end;
- organizer and traveler cannot log in before or after that window;
- organizer and traveler session refresh extends by 7 days but never past
  `trip.end_date + 7 days`;
- viewer session lasts 1 day and has no configurable duration;
- viewer expiry is capped by `trip.end_date + 7 days`;
- owner access through permanent account is not capped by trip end;
- disabled members cannot use an otherwise valid unexpired session;
- revoked sessions stop working immediately.

Frontend/API tests should cover:

- returning organizer/traveler does not need to re-enter the member password
  while the refreshed session remains valid;
- expired viewer guest access returns to the join/access flow;
- stored session state is cleared or replaced when the backend rejects it.

## Out Of Scope

- Stateless JWT session auth.
- User-selectable viewer session durations.
- Changing the existing trip role capability matrix.
- Building the final cookie migration if the smallest implementation step keeps
  bearer token storage temporarily.
