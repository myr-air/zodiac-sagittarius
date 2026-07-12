# Global Lessons Learned

Aggregated from `.space/missions/<id>/solved.md` and `.space/missions/<id>/learned.md` during ship migration.
Internal research source for `spacecraft research`.

## Solved

| Mission | Date | Problem | Solution | Evidence |
|---------|------|---------|----------|----------|
| — | — | — | — | — |

_No solved issues from M07MN77ML (triage-only mission)._

## Lessons

| Mission | Date | Lesson | Why It Matters |
|---------|------|--------|----------------|
| M07MN77ML | 2026-07-12 | Triage-only missions require full gate discipline even with zero code changes — explicitly defer version bump and changelog rather than silently skipping them | Non-code meta-work missions (audits, planning, triage) still merge to main and need tags; deferral with rationale prevents gate-check failures |
| M07MN77ML | 2026-07-12 | Cross-validate summary counts against source data just before finalizing — automated summaries can go stale when individual sections are manually updated | Any mission producing tabular summaries from issue/list data should include a reconciliation step that regenerates counts from source |
| M07MN77ML | 2026-07-12 | Remove or annotate superseded evidence entries — every evidence entry should be traceable to at least one task in plan.json | Orphan evidence creates confusion during review and audit; evidence cleanup should be part of the final audit task |
