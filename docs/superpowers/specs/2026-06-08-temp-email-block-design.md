# Temp Email Blocking Design

## Goal

Prevent account access and signup with disposable email domains such as
10-minute mail providers. The backend must be the source of truth so direct API
calls cannot bypass the control.

## Scope

- Block disposable domains for every account auth path that accepts an email:
  email-code challenge start, password login/register, and passkey login start.
- Apply the check after existing trim/lowercase normalization and before any
  database writes, email delivery, challenge creation, user creation, or session
  creation.
- Match exact disposable domains and subdomains of those domains.
- Keep trip temporary access by join ID/password unchanged.

## Non-Goals

- No external validation service, DNS lookup, MX lookup, or network call.
- No database-backed admin UI for the blocklist.
- No migration of existing users.
- No change to passkey registration for already-authenticated sessions.

## Architecture

Add a small domain-policy helper in the account service near existing email
validation. `normalize_email` will continue to produce the canonical email
string, then reject emails whose domain is disposable.

The helper will use a static denylist of common disposable providers, including
families for 10-minute mail and public temp inbox services. Matching should be
case-insensitive through the already-normalized email and should treat
`x.example.com` as blocked when `example.com` is denied.

## Error Handling

Rejected disposable emails return `ServiceError::InvalidRequest`, preserving
the existing API envelope:

- HTTP status: `400`
- code: `invalid_request`

The frontend already maps `invalid_request` to a generic account access error.
A specific frontend copy change is optional and can be added only if product
copy needs to name disposable email blocking explicitly.

## Data Flow

1. User submits an email to an account auth endpoint.
2. Backend trims and lowercases the email.
3. Backend validates syntax and max length.
4. Backend extracts the email domain and checks the denylist.
5. If blocked, the request stops with `invalid_request`.
6. If allowed, existing auth behavior continues unchanged.

## Acceptance Criteria

- Email-code challenge start rejects exact and subdomain disposable email
  domains.
- Password register rejects disposable email domains and creates no user or
  session.
- Password login rejects disposable email domains before auth attempt state is
  changed.
- Passkey login start rejects disposable email domains and creates no challenge.
- Non-disposable email domains continue through existing auth flows.
- The disposable-domain helper is covered by focused backend contract tests.

## Verification

- Run focused Rust contract tests for account auth.
- Run frontend tests only if frontend copy or client behavior changes.

## Risks

Static denylist coverage will never be perfect. This design favors reliability,
privacy, and low operational cost over maximal provider coverage. Future work
can add a maintained config list or external reputation check if abuse volume
requires it.

## Spec Self-Review

- No placeholder requirements remain.
- The backend-only source of truth is consistent across all account auth paths.
- Scope is limited to disposable-domain blocking and does not alter trip
  temporary access.
- The behavior is testable through existing account auth contract tests.
