# Issue Workflow

Sagittarius uses GitHub Issues for active work and local docs for durable
project knowledge.

## Source Of Truth

- **GitHub Issues:** active bugs, UX issues, product follow-ups, tech debt, and
  tasks that need labels, assignment, discussion, or closure.
- **Local docs:** audit archives, design rules, QA evidence, postmortems,
  runbooks, and decision records.

Do not maintain an active backlog in `issues.md`. It is only an index.

## Create A GitHub Issue When

- The item is not fixed in the current turn.
- The item needs owner/priority/label tracking.
- The item affects product behavior, UX, reliability, security, or developer
  workflow.
- The item was found during QA or review and needs follow-up.

## Keep A Local Doc When

- The content is evidence or history rather than work to assign.
- The document explains a design rule or workflow.
- The document is a postmortem, runbook, or audit report.
- The content would be too large or noisy for a single GitHub issue.

## Issue Body Standard

Every actionable issue should include:

- **Context:** where the problem appears.
- **Evidence:** file, route, screenshot, command output, or reproduction step.
- **Impact:** why it matters to organizers, travelers, viewers, or maintainers.
- **Suggested fix path:** the expected direction, not a full implementation plan.
- **Verification:** what command or browser flow proves the fix.

## Labels

Use the repo's existing default labels plus these meanings:

- `bug`: broken behavior or regression.
- `enhancement`: product or UX improvement.
- `ux`: user experience, interaction, accessibility, or visual design.
- `frontend`: frontend application work.
- `debt`: maintainability or workflow debt.
- `qa`: verification, browser QA, or test coverage.
- `documentation`: docs, workflow, or issue hygiene.
- `question`: needs product/design decision before implementation.
- `help wanted`: needs human input or external state.

Add more labels only when the recurring workflow needs them.

## Closing Rules

Close a GitHub issue only after:

- the fix is committed or the decision is documented,
- verification evidence is attached in the issue or linked PR,
- any local audit/runbook that mentioned the issue is updated or linked.

If the issue is not worth doing, close it as `wontfix` with the reason.

## Local Audit Archive

Archived reports live under `docs/audits/`. These files are not active trackers.
When an archive contains a new actionable finding, create a GitHub issue and add
a link near the finding or in `issues.md`.
