# Sagittarius Issue Index

Active product, UX, bug, and tech-debt work should live in GitHub Issues for
assignment, labels, comments, and closing history.

- GitHub Issues: https://github.com/myr-air/zodiac-sagittarius/issues
- Local workflow: [docs/issue-workflow.md](docs/issue-workflow.md)
- Archived UX/UI review: [docs/audits/2026-05-30-ux-ui-review.md](docs/audits/2026-05-30-ux-ui-review.md)
- Archived UI fix report: [docs/audits/2026-05-30-ui-issues.md](docs/audits/2026-05-30-ui-issues.md)

## Current Status

- Active local issues: none.
- Open GitHub issues at migration time: none.
- Production readiness review on 2026-06-07 opened and closed after fixes in
  `codex/fix-production-readiness`:
  - [#5 Production readiness gate fails on Storybook a11y and interaction checks](https://github.com/myr-air/zodiac-sagittarius/issues/5)
  - [#6 Backend daily briefings contract is non-deterministic because weather fetch populates live data](https://github.com/myr-air/zodiac-sagittarius/issues/6)
  - [#7 Implement Bookings & Docs backend persistence and API-mode mutations](https://github.com/myr-air/zodiac-sagittarius/issues/7)
  - [#8 Align runtime CORS with production allowlist instead of always allowing localhost origins](https://github.com/myr-air/zodiac-sagittarius/issues/8)
- This file is an index, not the active issue tracker.

## When To Add Something Here

Use this file only for short pointers to durable local records or GitHub issue
queries. Do not add new active issues directly here. If an issue needs action,
create a GitHub issue using one of the templates in `.github/ISSUE_TEMPLATE/`.

## Local-Only Records

Keep local docs for records that are useful after the work is done:

- audit snapshots
- design decisions
- QA evidence
- postmortems
- runbooks

If a local record creates follow-up work, open GitHub issues for each actionable
item and link them back to the source record.
