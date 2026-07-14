# Global Lessons Learned

Aggregated from `.space/missions/<id>/solved.md` and `.space/missions/<id>/learned.md` during ship migration.
Internal research source for `spacecraft research`.

## Solved

| Mission | Date | Problem | Solution | Evidence |
|---------|------|---------|----------|----------|
| M07O300A7 | 2026-07-13 | ActivityTimeButton cramped layout (#28) | Redesigned with duration, flexible badge, next-day indicator | build + typecheck pass |
| M07O300A7 | 2026-07-13 | Trip Plan not preserved across reload (#43) | Wired detailPlannerProps through buildWorkspacePlanningViewProps, removed noOpHandler stubs | 2/2 integration tests pass |
| M07O300A7 | 2026-07-13 | StopDialog form lacks label associations (#44) | Added label className + parentItemActivity wiring through context banner | typecheck + build pass |
| M07PI9GOU | 2026-07-14 | FlexibleHunterPage tests crash: useI18n outside I18nProvider | Added I18nProvider wrapper via renderFlexibleHunterPage helper | 7/8 tests pass, 1 skipped (radio limitation) |
| M07PI9GOU | 2026-07-14 | window.matchMedia not mocked in jsdom test env | Extracted usePrefersReducedMotion hook with safe fallback | All SagittariusApp integration tests pass |
| M07PI9GOU | 2026-07-14 | docs/MAP.md missing (contract test failure) | Created docs/MAP.md with project structure overview | Contract test passes |

## Lessons

| Mission | Date | Lesson | Why It Matters |
|---------|------|--------|----------------|
| M07MN77ML | 2026-07-12 | Triage-only missions require full gate discipline even with zero code changes — explicitly defer version bump and changelog rather than silently skipping them | Non-code meta-work missions (audits, planning, triage) still merge to main and need tags; deferral with rationale prevents gate-check failures |
| M07MN77ML | 2026-07-12 | Cross-validate summary counts against source data just before finalizing — automated summaries can go stale when individual sections are manually updated | Any mission producing tabular summaries from issue/list data should include a reconciliation step that regenerates counts from source |
| M07MN77ML | 2026-07-12 | Remove or annotate superseded evidence entries — every evidence entry should be traceable to at least one task in plan.json | Orphan evidence creates confusion during review and audit; evidence cleanup should be part of the final audit task |
| M07O300A7 | 2026-07-13 | No-op handler stubs as defaults make broken wiring invisible at runtime — omit the default so missing wiring fails noisily | Pattern for any prop that always has a real implementation; default silence hides bugs |
| M07PI9GOU | 2026-07-14 | Misleading test comments ("blocked by P1 alias issue") prevent root-cause investigation — always verify the actual failure mode before accepting comments as truth | Test documentation rot is a real blocker; comments should be audited when tests start failing |
| M07PI9GOU | 2026-07-14 | When UI changes, tests that select by label/aria break silently — run full test suite after any trip access or auth UI change | Pre-existing test rot accumulates when CI gates don't catch regressions early |
| M07PI9GOU | 2026-07-14 | Extract shared browser-API hooks (matchMedia, resize, etc.) early — duplication across 2+ files is a sign it should be a shared utility | Reduces per-component test setup burden and centralizes fallback logic |
