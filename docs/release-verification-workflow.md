# Release Verification Workflow

Use this workflow for any branch that will be merged to `main` and may be
deployed to production. The goal is to find blockers before `main`, then use
post-merge checks only to confirm the final merge commit.

## Rule

Do not use `main` as the place to discover release blockers.

`main` is the integration and deploy branch. Heavy readiness checks should run
on the release branch after it is rebased onto current `main`. After merge,
rerun only the checks needed to prove the exact merge commit is deployable.

## Lanes

| Lane | Owner | Purpose | Stop condition |
| --- | --- | --- | --- |
| Feature branch | Implementer | Build and prove the change in isolation. | Any relevant targeted, browser, or readiness gate fails. |
| Pre-merge release gate | Integration owner | Prove the rebased branch can enter `main`. | `production-readiness-fast` or an approved equivalent fails. |
| Post-merge confirmation | Integration owner | Prove the exact merge commit is still clean. | Release gate, version, tag, or smoke check fails. |
| Production deploy | Release owner | Build, migrate, start, and smoke production. | Migration, container health, public smoke, or CI release safety fails. |

## Pre-merge Gate

Run this before merging a user-facing or release-path branch into `main`:

1. Start from a clean branch, not `main`.
2. Rebase onto current `main`.
3. Run targeted tests for the files and behavior changed.
4. Run real browser evidence for changed user flows.
5. Run the production readiness gate, or document why a smaller equivalent is
   enough for the branch.
6. Fix every blocker on the branch and rerun the failed gate.
7. Commit only coherent, verified changes.

Recommended commands:

```bash
rtk git fetch --all --prune
rtk git rebase main
rtk make production-readiness-fast PSQL='docker exec -i sagittarius-test-postgres psql'
rtk make production-deploy-gate
```

For narrow UI changes, add the matching browser or Storybook command before the
readiness gate. Examples:

```bash
cd frontend && rtk bun run test:storybook src/features/workspace/pages/expenses/storybook/ExpensesPage.stories.tsx
rtk make expense-browser-smoke PSQL='docker exec -i sagittarius-test-postgres psql'
```

If a gate fails because two DB-resetting browser jobs ran in parallel, rerun the
failed target alone before treating it as an app failure. Do not weaken the
gate.

## Merge To Main

Only merge after the pre-merge gate is green or the remaining risk is explicitly
accepted.

1. Confirm branch is clean.
2. Bump the app version when the release content changes.
3. Merge with `--no-ff`.
4. Tag the exact final merge commit.
5. Delete the merged local branch.

```bash
rtk git switch main
rtk git merge --no-ff <branch>
rtk git tag -a v<version> -m "v<version>"
rtk git branch -d <branch>
```

If a post-merge blocker requires another commit before anything has been pushed,
fix it on a new branch from local `main`, merge that branch, and move the local
unpublished tag to the new final merge commit. Do not push a tag that does not
point at the deployed commit.

## Post-merge Confirmation

Post-merge checks should confirm, not discover.

Run these on local `main` after the merge and before deploy:

```bash
rtk git status --short --branch
rtk git rev-parse 'v<version>^{}' HEAD main
rtk make production-deploy-gate
```

For user-facing or release-path changes, rerun the highest-value browser smoke
that covers the changed route. If the pre-merge gate was not run in full, run it
now and do not deploy until it passes.

## Push And CI

Push only after local post-merge confirmation passes.

```bash
rtk git push origin main
rtk git push origin v<version>
rtk gh run list --branch main --limit 5 --json databaseId,headSha,status,conclusion,name,url,createdAt
```

The GitHub Production Readiness workflow must be watched until either:

- it passes, or
- production is already deployed from local evidence and the remaining CI job is
  explicitly reported as pending with its run URL.

If CI fails before deploy, block deploy. If CI fails after deploy, treat it as a
release incident candidate: inspect the failed job, decide whether rollback is
needed, and create/fix an issue before closing the release.

## Production Deploy

Use the Docker/Cloudflare production path after local gates pass:

```bash
rtk make container-production-build PRODUCTION_ENV_FILE=.env.production
rtk make container-production-migrate PRODUCTION_ENV_FILE=.env.production
rtk make container-production-up PRODUCTION_ENV_FILE=.env.production
rtk make container-production-check PRODUCTION_ENV_FILE=.env.production
```

Then run public smoke checks:

```bash
rtk curl -fsS https://sagittarius.13thx.com/api/v1/health
rtk curl -fsS -o /dev/null -w '%{http_code} %{url_effective}\n' https://sagittarius.13thx.com/api/v1/readiness
rtk curl -fsS -o /dev/null -w '%{http_code} %{url_effective}\n' https://sagittarius.13thx.com/trips
rtk curl -fsS -o /dev/null -w '%{http_code} %{url_effective}\n' https://sagittarius.13thx.com/trips/HK-SZ-2025/map
rtk curl -fsS -o /dev/null -w '%{http_code} %{url_effective}\n' 'https://sagittarius.13thx.com/access?mode=sign-in'
```

Expected:

- containers are healthy
- `/api/v1/health` returns `ok`
- `/api/v1/readiness` returns `200`
- `/trips`, a map route, and auth entry return `200` or an intentional app
  redirect

## Evidence Packet

Every release closeout should report:

- branch and final commit
- tag and version
- pre-merge gate result
- post-merge confirmation result
- CI run URL and status
- production build, migration, start, and container check result
- public smoke result
- unverified areas or pending CI, if any

## Anti-patterns

- Discovering broad readiness failures for the first time after merging to
  `main`.
- Running DB-resetting browser/API smoke targets in parallel against the same
  test database.
- Moving or pushing a tag without confirming it points at the final deployed
  commit.
- Treating jsdom/unit tests as proof of browser session, mobile layout,
  hydration, or production route behavior.
- Deploying with failed or unknown release-signoff evidence.
