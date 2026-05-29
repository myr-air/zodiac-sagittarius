# Account Membership System Design

## Goal

Add a permanent account layer to Sagittarius while preserving the existing guest
trip-member flow. Users can sign in with email or passkeys, create trips, claim
temporary trip identities into an account, manage profile and settings, review
trip history and stats, and transfer trip ownership without ever leaving a trip
ownerless.

## Context

Sagittarius currently has a trip-scoped guest identity model:

- `trips` stores room-level join credentials and `owner_member_id`.
- `trip_members` stores a participant identity, role, access status, optional
  `user_id`, and guest claim fields.
- `trip_member_sessions` stores guest member sessions.
- The frontend uses `TripJoinGate` for trip room access, member selection, and
  participant password claim/login.
- `/members` is already a command center for trip participant management.

This design extends those surfaces instead of replacing them. Existing guest
participants remain useful for invite-first trips, and account users become the
durable identity layer above those trip-scoped member rows.

## Selected Direction

Use an account layer beside the existing guest trip-member system.

Permanent users are represented by `users`. A trip participant remains a
`trip_members` row. Linking `trip_members.user_id` to `users.id` turns a guest
or temporary participant into an account-backed participant without changing how
trip permissions, itinerary authorship, expenses, suggestions, or realtime
events reference members.

This keeps the trip domain stable:

- trip permissions still depend on `trip_members.role`;
- account sessions prove a durable user identity;
- member sessions prove a trip-scoped temporary identity;
- ownership remains a trip-member role plus `trips.owner_member_id`;
- account history and stats are built from member links and trip events.

## Non-Goals

The first implementation does not need production email delivery, billing,
external OAuth providers, team/workspace billing, or notification delivery. It
exposes email-code issuance through deterministic test/dev behavior while
keeping the API shape ready for a real mailer.

The first pass does not need cross-device push notifications or account
deletion hard-delete. Account deletion is explicitly outside this spec because
trips and audit history need separate privacy and retention rules.

## Backend Architecture

Follow the existing Rust service layering:

- `api`: axum routes, JSON request/response DTOs, auth extractors.
- `app`: account auth, trip creation, claim/link, owner transfer, settings, and
  stats use cases.
- `db`: sqlx queries and transactional helpers.
- `domain`: typed roles, session kind, ownership invariants, and validation.

Account auth and trip-member auth are separate authenticators with a shared
request context type. Endpoints that can be used by either kind of session
should say so explicitly. Owner transfer and trip creation require an account
session.

## Storage Model

Add the following tables in a new migration.

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY,
  display_name text NOT NULL,
  avatar_color text NOT NULL,
  locale text NOT NULL DEFAULT 'th-TH',
  timezone text NOT NULL DEFAULT 'Asia/Bangkok',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz
);

CREATE TABLE user_emails (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  email text NOT NULL,
  normalized_email text NOT NULL UNIQUE,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE email_login_challenges (
  id uuid PRIMARY KEY,
  normalized_email text NOT NULL,
  code_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE TABLE webauthn_challenges (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  challenge text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('register', 'login')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE TABLE webauthn_credentials (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  credential_id text NOT NULL UNIQUE,
  public_key jsonb NOT NULL,
  sign_count bigint NOT NULL DEFAULT 0,
  nickname text NOT NULL DEFAULT 'Passkey',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE TABLE trusted_devices (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  label text NOT NULL,
  user_agent text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  revoked_at timestamptz
);

CREATE TABLE user_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  trusted_device_id uuid REFERENCES trusted_devices(id),
  session_token_hash text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('temporary', 'trusted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE TABLE account_audit_events (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  trip_id uuid REFERENCES trips(id),
  actor_user_id uuid REFERENCES users(id),
  actor_member_id uuid REFERENCES trip_members(id),
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Also harden existing trip membership:

- `trip_members.user_id` references `users(id)`.
- Owner members cannot be disabled.
- A partial unique index enforces one owner role per trip:

```sql
CREATE UNIQUE INDEX trip_members_one_owner_per_trip_idx
  ON trip_members (trip_id)
  WHERE role = 'owner';
```

The existing `trips.owner_member_id` foreign key remains the fast lookup for the
current owner. Application transactions must keep it aligned with the single
owner row.

## Account Sessions

Account sessions are bearer tokens stored only as hashes. Temporary sessions are
short-lived and suitable for one-time login or shared/public machines. Trusted
sessions are longer-lived and associated with `trusted_devices`.

Suggested durations:

- temporary account session: 24 hours;
- trusted account session: 30 days;
- email login challenge: 10 minutes;
- WebAuthn challenge: 5 minutes.

The frontend exposes this as a clear choice:

- "เข้าใช้งานชั่วคราว" creates a temporary session.
- "เชื่อถือเครื่องนี้" creates or reuses a trusted device session.

Users can revoke trusted devices and active sessions from settings.

## Email Login

Email login is passwordless:

1. User enters email.
2. Backend normalizes email and creates `email_login_challenges`.
3. In dev/test the challenge code is returned or logged through a test-only
   path; production deployments plug a mailer into the same app service.
4. User submits code.
5. Backend consumes the challenge, creates or finds the user, verifies the email
   if needed, and returns a user session.

Repeated attempts should not reveal whether an email exists. Expired, consumed,
or wrong challenges return `401 unauthenticated` with the same user-facing copy.

## Passkeys

Passkeys use WebAuthn challenge/verify endpoints. The first implementation can
store credential public key material as JSON and keep verification behind a
small domain interface so the exact WebAuthn crate can be swapped without
spreading dependency details through the app.

Required flows:

- begin passkey registration for an authenticated account user;
- finish passkey registration and store credential;
- begin passkey login;
- finish passkey login and return a temporary or trusted account session;
- list and remove passkeys from settings.

If passkey support is unavailable in the browser, the login page keeps email
login as the primary fallback.

## Claiming A Temporary Member Into An Account

Claiming links an existing trip participant identity to the signed-in account:

1. User authenticates through guest trip flow or account flow.
2. User chooses "บันทึกตัวตนนี้เข้าบัญชี".
3. Backend verifies the caller controls the member session or has an account
   session for a matching unlinked claim flow.
4. Backend locks the member row.
5. If `trip_members.user_id` is null, set it to the account user id.
6. If it is already linked to the same user, return success idempotently.
7. If it is linked to another user, return `409 identity_already_linked`.

Claiming must preserve itinerary authorship and role history because existing
rows already point at `trip_members.id`.

## Trip Creation

Account users can create trips from `/trips/new`.

The backend creates the trip in one transaction:

1. Validate trip name, destination, date range, join id, and join password.
2. Generate both the trip id and owner member id before inserts.
3. Insert `trips` with `owner_member_id` set to the generated owner member id
   inside the existing deferrable owner foreign-key transaction.
4. Insert an owner `trip_members` row linked to the creating user.
5. Insert a main `plan_variants` row and set it active.
6. Insert an audit event.

The response returns a trip summary and the new owner member context so the UI
can open the new trip without another join ceremony.

## Owner Transfer

Owner has the same capabilities as organizer plus the legal authority to
transfer ownership. The owner role must remain unique and a trip must always
have one owner.

Rules:

- Only the current owner can transfer ownership.
- The target must be an active member of the same trip.
- The target must have `user_id` set, meaning they have a permanent account.
- The target cannot be disabled.
- Transfer cannot target the current owner.
- The old owner becomes organizer by default.
- The new owner becomes owner.
- `trips.owner_member_id` is updated to the new owner member id.
- Transfer creates an audit event visible in the trip/account history.

The transaction locks the trip row, current owner member row, and target member
row. It updates roles and `owner_member_id` together. If any step fails, no role
changes are committed.

## Profile, Settings, And Account Dashboard

Add account screens that match the cockpit theme and avoid a marketing layout.

### `/account/login`

Compact task-focused auth surface:

- email code login;
- passkey login;
- trusted-PC toggle;
- temp-access option;
- clear error states with `role="alert"`;
- fallback copy when passkeys are unsupported.

### `/account/settings`

Dense settings screen with tabs or segmented sections:

- profile: display name, avatar color, locale, timezone;
- email: primary verified email and add/verify email;
- passkeys: list, rename, remove, add passkey;
- sessions/devices: active sessions, trusted devices, revoke actions;
- privacy: profile visibility inside trips;
- linked identities: trip member identities linked to this account.

### `/account/trips`

Account command center:

- owned trips;
- joined trips;
- upcoming and past trips;
- unclaimed trip-member identities detected from current device/session;
- account stats such as trips created, trips joined, destinations, upcoming
  trip count, past trip count, and last active trip.

### `/members`

Extend the current member command center:

- account-linked status per member;
- owner transfer action visible only to owner;
- disabled target states with explicit text;
- warning when a transfer target has no account;
- audit trail entry for recent owner transfer.

## UX Direction

Use the existing Sagittarius visual language:

- teal primary accent;
- white surfaces;
- light grey workspace;
- compact dashboard density;
- row-level cards only where they represent repeated items;
- SVG icons from the existing icon component;
- no emoji icons.

UI guidance from `ui-ux-pro-max`:

- use accessible error messages, not visual-only borders;
- never rely on color alone for security, ownership, or session state;
- use stable hover states that do not shift layout;
- keep text contrast at WCAG AA or better;
- use controlled forms with explicit submit handlers;
- debounce or defer expensive filtering over trips/members;
- mobile must work down to 320px without horizontal scroll.

The account pages should feel like operational cockpit screens, not landing
pages. The first viewport should show the actual task: login, settings, trip
list, or transfer control.

## Performance Plan

Backend:

- keep account dashboard as one bounded read endpoint instead of frontend
  fan-out;
- index `user_sessions(session_token_hash)`, `user_sessions(user_id,
  expires_at)`, `trusted_devices(user_id, revoked_at)`,
  `trip_members(user_id)`, and `account_audit_events(user_id, created_at)`;
- use UUIDv7 for index locality;
- keep session token lookup hash-only and allocation-light;
- make trip creation and owner transfer single transactions.

Frontend:

- split account pages by route so login/settings/trips do not load trip cockpit
  code unnecessarily;
- keep forms controlled and local;
- use `useDeferredValue` for account trip/member search;
- avoid unnecessary context-wide state updates when editing settings;
- render large lists as compact rows and consider virtualization only if the
  account trip list grows beyond normal travel use.

## API Surface

Initial REST endpoints:

- `POST /v1/account/email-login/start`
- `POST /v1/account/email-login/finish`
- `POST /v1/account/passkeys/register/start`
- `POST /v1/account/passkeys/register/finish`
- `POST /v1/account/passkeys/login/start`
- `POST /v1/account/passkeys/login/finish`
- `GET /v1/account/me`
- `PATCH /v1/account/me`
- `GET /v1/account/trips`
- `GET /v1/account/settings`
- `POST /v1/account/sessions/logout`
- `POST /v1/account/sessions/revoke`
- `POST /v1/trips`
- `POST /v1/trips/:tripId/members/:memberId/link-account`
- `POST /v1/trips/:tripId/owner-transfer`

The frontend `TripApiClient` gains account methods beside existing trip methods
instead of mixing account auth into guest join DTOs.

## Error Handling

Return typed JSON errors matching the existing backend pattern:

- `400 invalid_request` for malformed input or unsupported state transitions;
- `401 unauthenticated` for invalid sessions or login challenges;
- `403 forbidden` for insufficient role or disabled actor;
- `404 not_found` for hidden account/trip/member resources;
- `409 identity_already_linked` for conflicting claim/link attempts;
- `409 owner_transfer_invalid` when ownership invariants would be broken.

Frontend copy should be specific enough to act on:

- target has no account, so ownership cannot transfer;
- passkey unavailable, use email login;
- trusted device revoked, login again;
- email code expired, request a new one.

## Testing

Backend contract tests:

- email login creates or resumes a user and returns temporary/trusted sessions;
- passkey challenge lifecycle rejects expired or consumed challenges;
- account session lookup rejects revoked and expired sessions;
- account user creates a trip and becomes the linked owner member;
- guest member can link to account idempotently;
- guest member cannot link to another account once linked;
- owner transfer requires owner actor;
- owner transfer requires target has account;
- owner transfer preserves exactly one owner;
- owner transfer leaves old owner as organizer;
- disabled members cannot receive ownership;
- account dashboard returns owned/joined trips and stats;
- audit events are inserted for claim, trip creation, and owner transfer.

Frontend tests:

- login page exposes email and passkey flows with accessible errors;
- trusted-PC and temp-access choices produce correct API requests;
- settings page lists passkeys, sessions, devices, and linked identities;
- account trips page separates owned, joined, upcoming, and past trips;
- trip creation form submits valid payload and opens returned trip;
- members page blocks owner transfer to unlinked members with visible copy;
- owner transfer action calls API only for valid account-linked targets;
- mobile account/settings/member transfer layouts avoid horizontal scroll.

Verification:

- backend tests for account and ownership contracts;
- frontend unit tests for account UX;
- lint and typecheck;
- rendered desktop and mobile QA for login, settings, trips, and members owner
  transfer states.

## Rollout Plan

Build in four slices:

1. Account identity backend: schema, sessions, email login, passkey challenge
   skeleton, settings read/write.
2. Trip ownership and claiming: trip creation, link guest member to account,
   owner transfer invariant, account trip dashboard data.
3. Account UX: login, settings, trips dashboard, trip creation, app shell
   account affordances.
4. Stats and polish: richer account stats, audit timeline, responsive QA,
   performance checks.

Each slice should ship with tests and keep existing guest trip access working.

## Open Decisions Resolved For This Spec

- Account layer is additive and does not replace guest member sessions.
- Email login is passwordless code/magic-link style.
- Trusted-PC is represented as a long-lived account session tied to a revocable
  trusted device.
- Temp access is a short-lived account session.
- Owner transfer target must have a permanent account link through
  `trip_members.user_id`.
- A trip owner is still represented by exactly one `trip_members` row with role
  `owner` and by `trips.owner_member_id`.
