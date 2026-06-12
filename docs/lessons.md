# Lessons

This file records development lessons that should change how future agents work on Sagittarius. Keep entries specific, evidence-backed, and actionable.

## 2026-06-12 Reference UI Redesign And Storybook UX Goal

### Work On A Branch Or Worktree Before Any Edit

Mistake: The repository root was on `main` while a generated AGY audit artifact existed there. Editing from that root would have violated the no-main-edits rule and risked mixing generated output into product work.

Prevention:

- Check `rtk git status --short --branch` before editing.
- If the root is on `main`, switch to an existing work branch or create a separate worktree before touching files.
- Treat generated audit files as excluded unless the task explicitly asks to update the audit record.

### AGY Findings Are A Review Loop, Not A Completion Signal

Mistake: Early AGY passes found missing UX states even after many Storybook stories already existed. The remaining gaps were not obvious from file count alone: mobile inspector behavior, role-gated controls, Thai account copy, viewport assertions, template state coverage, and overlap auto-resolve flow.

Prevention:

- Run `rtk env AGY_PRINT_TIMEOUT=4m bun run test:storybook:agy` after each meaningful Storybook coverage wave.
- Read the generated `docs/audits/storybook-agy-ux-ui-review.md` before deciding the next patch.
- Restore the generated report with `rtk git checkout -- docs/audits/storybook-agy-ux-ui-review.md` unless the audit file itself is the deliverable.
- Do not claim the UX catalog is complete until AGY exits 0 with `(no stdout)` and `(no stderr)` after the final patch.

### Storybook Tests Can Pass While Browser Play Errors Persist

Mistake: `rtk bun run test:storybook` passed, but a live Storybook browser session still surfaced a stale `HomeLanding Thai` play error. The story expected a hidden mobile preview menu to be visible. Browser QA caught a responsive contract mismatch that CLI output alone did not make obvious during the dev-server run.

Prevention:

- After frontend UX changes, run at least one real Browser smoke against Storybook, not only Vitest Storybook tests.
- For responsive stories, assert structure and responsive classes when an element is intentionally hidden at a breakpoint; reserve `toBeVisible()` for elements that must render visibly at that viewport.
- Use a fresh browser tab or clear console context before final console checks, because Storybook dev-server logs can retain stale play errors from before HMR.

### Smoke Check The Contract, Not The Exact Copy Guess

Mistake: A Browser smoke helper initially flagged false failures because it guessed copy too narrowly: Thai account action text was `เข้า account`, and Photos viewer included `Upload request` as an album type, not an enabled upload action.

Prevention:

- Inspect the rendered root text and button list before deciding a smoke mismatch is a product bug.
- Prefer contract assertions tied to role behavior and layout, such as selector presence, disabled edit/delete controls, absence of add-album controls for viewers, and zero horizontal overflow.
- Keep Browser smoke checks high signal: render identity, role affordance, responsive overflow, and console/page errors.

### Mobile UX Requires Both Story Assertions And Runtime Measurement

Mistake: Some mobile issues were only visible when measuring the real rendered document width. Storybook assertions covered class contracts, but Browser smoke was needed to prove no page-level horizontal overflow at `390x844`.

Prevention:

- For mobile stories, check both DOM contract and runtime `scrollWidth - innerWidth`.
- Include viewer and owner role variants when controls can be readonly, disabled, or hidden.
- For itinerary and cockpit pages, include mobile inspector and context rail behavior in the coverage list, not only the main table or page header.

### Generated Review Artifacts Must Not Sneak Into Commits

Mistake: AGY writes `docs/audits/storybook-agy-ux-ui-review.md` every run. It is easy to accidentally include that generated report with source and story changes.

Prevention:

- After every AGY run, check `rtk git status --short -- docs/audits/storybook-agy-ux-ui-review.md`.
- Restore the audit report before staging source work unless updating the report is explicitly requested.
- Stage exact paths, never broad directories, for mixed generated/source work.

### Completion Claims Need Evidence Gates

Mistake: A UI goal can feel complete after the visible patch is done, but completion is only defensible after tests, AGY, Browser QA, clean git state, and claim lint all agree.

Prevention:

- Before final completion claims, collect fresh evidence:
  - `rtk bun run typecheck`
  - `rtk bun run lint`
  - `rtk bun run test -- storybook.contract.test.ts`
  - `rtk bun run test:storybook`
  - `rtk bun run test`
  - `rtk env AGY_PRINT_TIMEOUT=4m bun run test:storybook:agy`
  - focused Browser smoke for changed UX surfaces
  - `rtk python3 scripts/check_all.py` from `~/.codex/aries`
  - `rtk python3 scripts/claim_lint.py --final-report ... --evidence-log ...`
- If one verification path fails because the assertion is wrong, patch the assertion and rerun the relevant focused and full suites.

### Keep The Goal Boundary Clear

Mistake: The goal mixed visual redesign, Storybook coverage, AGY review, rebase handling, and branch/worktree hygiene. Without a clear boundary, it is easy to confuse "coverage complete" with "every future redesign idea implemented."

Prevention:

- Name what the current commit proves. In this goal, the final commit proved Storybook UX catalog coverage and audit closure, not a new runtime redesign wave.
- Report residual risks separately, such as "not pushed" or "no PR created".
- Mark a goal complete only after the latest user request, branch state, verification evidence, and generated artifacts have all been reconciled.
