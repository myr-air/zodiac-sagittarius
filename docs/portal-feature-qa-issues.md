# Portal Feature QA Issues

Date: 2026-06-01

## Scope

Portal user management at `/portal`:

- Dashboard user stats and session state.
- My Trips.
- Explorer.
- Trip To-dos.
- Travel Vault.
- Settings.
- Sign out.
- Login/register redirect into `/portal`.

## Findings

### Fixed: local real e2e missed the account portal migration

Severity: P1

The real local e2e reset path recreated the `public` schema from `seed_e2e.rs`, but that seed script applied migrations `0001` through `0004` only. The new `account_vault_items` table from `0005_account_portal.sql` was missing, so a normal `/account/vault` request returned a backend `database error`.

Fix:

- `backend/crates/sagittarius-api/src/bin/seed_e2e.rs` now applies `0005_account_portal.sql`.
- `Makefile` now runs `db-init-test` before `frontend-e2e-local`.
- `frontend/src/project-contract.test.ts` asserts the local e2e path stays wired to the portal migration.
- `frontend/src/account/real-portal.e2e.test.ts` creates a real account trip, creates three real tasks, and reads portal to-dos plus vault from the real backend.

### Fixed: one failed portal resource hid unrelated good data

Severity: P1

The portal loaded settings, trips, stats, explorer, to-dos, and vault with one `Promise.all`. If one endpoint failed, fulfilled data from the other endpoints was discarded. This made a vault database error hide valid to-dos.

Fix:

- `AccountAccessPanel` now uses `Promise.allSettled` for portal data.
- Fulfilled resources render independently.
- The first failed resource still shows an error message.
- `AccountAccessPanel.test.tsx` covers the case where vault fails but to-dos remain visible.

### Tracked: in-app browser storage limitation

Severity: P3

The Codex in-app browser context did not expose the localStorage state needed to validate the logged-in portal route during this QA pass. Playwright was used as the fallback for browser/session verification. This is a tool limitation, not an app bug, but future browser QA should record the fallback reason.

## Hardcode And Placeholder Scan

Command:

```sh
rtk rg -n "TODO|FIXME|HACK|XXX|unimplemented!|todo!|panic!|not implemented|coming soon|placeholder|hardcoded" frontend/src frontend/app backend/crates/sagittarius-api/src backend/crates/sagittarius-api/tests Makefile --glob '!**/target/**'
```

Result:

- No production `unimplemented!`, `todo!`, `not implemented`, `coming soon`, or hardcoded fake feature path found.
- `panic!` matches are in Rust test assertions for expected invalid requests.
- `placeholder` matches are HTML input placeholder attributes.

Guard:

- `frontend/src/project-contract.test.ts` now fails if production source contains `unimplemented!`, `todo!`, `not implemented`, or `coming soon`.

## Evidence Matrix

| Claim | Fast evidence | Real evidence | Result |
| --- | --- | --- | --- |
| Login/register redirects into `/portal` | Component and route contract tests | Browser QA from the portal flow | Pass |
| Portal split routes exist and use account portal mode | `project-contract.test.ts` | Browser direct-route checks | Pass |
| Portal nav maps Dashboard, My Trips, Explorer, Trip To-dos, Travel Vault, Settings, Sign out | `AccountAccessPanel.test.tsx` | Browser portal screenshot/manual route check | Pass |
| To-dos render from real trip tasks | Component test plus real portal e2e | `rtk make frontend-e2e-local` | Pass |
| Vault empty state does not crash | Real portal e2e calls `/account/vault` | `rtk make frontend-e2e-local` | Pass |
| A failed resource does not hide unrelated data | `keeps portal to-dos visible when another portal API fails` | Covered by regression from real e2e failure | Pass |
| Migration drift is caught | `project-contract.test.ts` | `frontend-e2e-local: db-init-test` | Pass |
| Hardcoded/unimplemented feature text is blocked | `project-contract.test.ts` | Source scan | Pass |

## Verification Commands

```sh
rtk bun run test src/components/AccountAccessPanel.test.tsx src/project-contract.test.ts src/account/real-portal.e2e.test.ts
rtk make frontend-e2e-local SAGITTARIUS_BIND_ADDR=127.0.0.1:5199
rtk cargo check --manifest-path backend/Cargo.toml
rtk make verify
```

## Remaining Risk

- Browser visual QA should be rerun after any CSS change to the portal shell.
- Permission-specific portal actions are low risk in this slice because the portal pages are account-owned summaries. Trip-level role permissions remain covered in the trip/member test suite, not this portal report.
