# Members Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished `/members` command center with invite, filtering, role/access management, confirmations, and responsive layout.

**Architecture:** Keep `TripMembersPage` as the stateful page controller for search/filter/copy feedback and keep `PeoplePanel` as the reusable member-list component. Add small props to `PeoplePanel` for empty state, invite rendering, and confirmation-gated actions without changing trip auth APIs.

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS in `app/globals.css`, Vitest with Testing Library.

---

### Task 1: Members Page Feature Tests

**Files:**
- Modify: `src/components/PeoplePanel.test.tsx`
- Modify: `src/components/SagittariusApp.test.tsx`

- [ ] **Step 1: Write failing tests**

Add tests that prove:
- `TripMembersPage` filters by search/status/role and can reset filters after an empty state.
- invite copy button calls `navigator.clipboard.writeText` and shows copied feedback.
- disabling a member requires `window.confirm`.
- non-managers cannot see management controls.

- [ ] **Step 2: Run tests to verify RED**

Run: `rtk bun run test src/components/SagittariusApp.test.tsx src/components/PeoplePanel.test.tsx`

Expected: FAIL because filters, invite copy feedback, confirmation wiring, and non-manager command-center behavior do not exist yet.

### Task 2: Page State And Feature Implementation

**Files:**
- Modify: `src/components/TripMembersPage.tsx`
- Modify: `src/components/PeoplePanel.tsx`

- [ ] **Step 1: Implement page state**

In `TripMembersPage`, add React state for:
- `query`;
- `roleFilter`;
- `statusFilter`;
- `copyState`.

Derive filtered members from visible members.

- [ ] **Step 2: Implement actions**

Add:
- `inviteLink` based on the current browser origin and trip join id;
- `copyInviteLink`;
- `confirmResetClaim`;
- `confirmChangeAccessStatus`;
- `resetFilters`.

- [ ] **Step 3: Pass enhanced props to `PeoplePanel`**

Pass filtered members, `emptyMessage`, `onResetFilters`, and confirmation-wrapped action handlers.

- [ ] **Step 4: Update `PeoplePanel` rendering**

Render member rows with role/status badges, management controls, empty state, and invite action slot while preserving existing test labels.

### Task 3: Command Center Styling

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add command-center layout CSS**

Style header, invite panel, filter toolbar, metrics, member rows, controls, badges, empty state, and copied feedback.

- [ ] **Step 2: Add responsive CSS**

At `max-width: 1199px` and `max-width: 767px`, stack rows and controls so 320px mobile does not horizontally scroll.

### Task 4: Verification

**Files:**
- No source changes expected.

- [ ] **Step 1: Run targeted tests**

Run: `rtk bun run test src/components/SagittariusApp.test.tsx src/components/PeoplePanel.test.tsx`

Expected: all targeted tests pass.

- [ ] **Step 2: Run full checks**

Run:
- `rtk bun run test`
- `rtk bun run lint`
- `rtk bun run typecheck`

Expected: all commands exit 0.

- [ ] **Step 3: Rendered QA**

Use Browser plugin if localhost navigation works. If it is blocked, use Playwright screenshot fallback against the running dev server. Capture desktop and mobile `/members` screenshots and check no obvious overlap, clipping, or horizontal layout break.
