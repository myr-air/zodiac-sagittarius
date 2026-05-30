# Real System Feature QA Workflow

This workflow is the required review gate for user-facing features that cross frontend, backend, auth/session state, roles/permissions, browser storage, SSR hydration, logs, or responsive UI.

## Rule

Do not call a feature complete from unit, contract, lint, or typecheck alone. Those checks are necessary, but they do not prove the real user path.

Every major feature needs a real-system spine:

1. Start a migrated local database from a clean or explicitly reset state.
2. Start the backend with that database.
3. Start the frontend with the real backend base URL.
4. Drive the feature through a browser.
5. Check browser console/pageerror/network failures.
6. Check desktop and mobile viewport layout.
7. Cover role/permission affordances with representative data.
8. Save screenshot evidence outside the repo.

## Minimum Evidence Matrix

| Feature Claim | Minimum Evidence |
| --- | --- |
| Pure validation | Unit test |
| Backend invariant or permission | Backend contract test against Postgres |
| Frontend request payload | Real request against the backend |
| Account/session persistence | Browser reload or direct-route test |
| SSR/localStorage behavior | Browser console/pageerror check |
| Responsive layout | Screenshot and `scrollWidth === clientWidth` check |
| Role UI affordance | Browser test with allowed and denied actors |
| User-facing error quality | Real UI state plus stable API error code |

## Required Browser Smoke For Account Features

Account and membership features must cover:

- Email login through the local email outbox.
- Trusted PC and temporary session behavior.
- Account dashboard: stats, history, settings, trusted devices.
- Create trip from account and open cockpit.
- Reload/direct-route to `/members` or another cockpit route after creation.
- Claim temp identity into account.
- Owner/organizer/traveler/viewer permission differences.
- Owner transfer to an account-linked member only.
- Mobile account dashboard at 390px with no horizontal overflow.
- No third-party provider affordance unless explicitly approved.

## Failure Signals

Treat these as findings unless the test explicitly expects them:

- Hydration mismatch.
- Framework overlay.
- Page error.
- Unexpected browser console error or warning.
- Unexpected 400/401/403/409/500.
- Raw user-facing implementation text such as `json payload is invalid`.
- Database error on a normal path.
- Horizontal overflow on mobile.

## Review Output

The final review should start with findings, then include:

- Real flow tested.
- Environment and ports.
- Database/migration state.
- Viewports.
- Permission matrix coverage.
- Commands and browser APIs used.
- Screenshot paths.
- Remaining risk.

If an important matrix cell was not tested, state it as remaining risk rather than implying coverage.
