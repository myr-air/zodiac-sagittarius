# Storybook AGY UX/UI Review

Generated: 2026-06-11T03:00:52.988Z
Command: agy --add-dir /Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign -p <storybook-ux-ui-prompt>

## Output

I will start by checking the current permissions to see what files and directories I can access.
I will run a command to list the contents of the current directory to understand where we are in the file system.
I will run a command to list the files in `/Users/xiivth/workspace/zodiac/sagittarius` to see the structure of the repository.
I will list the `.worktrees` directory under Sagittarius to see the redesign branch worktree.
I will list all the Storybook story files in the redesign worktree to see what components and views are currently documented.
I will run a command to check if the storybook.contract.test.ts file exists in the worktree.
I will view the contents of the Storybook contract test file to understand what it verifies.
I will view the frontend `package.json` file in the redesign worktree to see the scripts and dependencies.
I will view the run-storybook-agy-ux-qa.ts script to understand the current Storybook automated testing or verification script.
I will view the Storybook configuration file `preview.ts` to see viewports, parameters, decorators, and localization configuration.
I will view the `msw-handlers.ts` file under `.storybook` to understand the mock server endpoints and the dummy data structures used for the Storybook environment.
I will view the main application Storybook story file (`SagittariusApp.stories.tsx`) to understand how different pages, roles, and device states are tested.
I will search the stories codebase for the required exports (`Traveler`, `Viewer`, `Empty`, `Dense`, `TableOverflow`) to locate where these scenarios are documented and tested.
I will search the stories codebase for the `Empty` state story export.
I will search for where `TableOverflow` is defined in stories.
I will view `ItineraryPage.stories.tsx` to understand the stories and test setups defined for the Itinerary page.
I will view the contents of `ItineraryTemplate.stories.tsx` to understand the stories structured for the itinerary template.
I will run the Storybook tests using Vitest to see if all current story checks pass and see what contract/unit tests are currently executed.
I will check the status of the running Vitest Storybook tests task.
I will view the main application component file `SagittariusApp.tsx` to understand how the application handles different role states (owner, traveler, viewer) and whether these roles are configurable/testable at the app level.
I will check the status of running background tasks to see if our Vitest Storybook runner has completed.
I will view the contents of `AppShell.stories.tsx` to understand the stories that document the main application shell/layout.
I will view the contents of `OverviewPage.stories.tsx` to check how the Overview page and its role/density/locale states are defined.
I will check the status of the Vitest Storybook tests task.
I will view `TimelinePage.stories.tsx` to inspect its stories.
I will view `TimelineTemplate.stories.tsx` to see what states it defines.
I will view `MapPage.stories.tsx` to examine the stories defined for the Map page.
I will view `MapTemplate.stories.tsx` to check what stories are defined for the map template.
I will view `MembersPage.stories.tsx` to examine the stories defined for the Members page.
I will view `MembersTemplate.stories.tsx` to examine its stories.
I will view `ExpensesPage.stories.tsx` to see what states and scenarios are defined for expenses.
I will view `HomeLanding.stories.tsx` to inspect the landing page stories.
I will view `motifs.stories.tsx` to see how travel motifs and visual states are configured in Storybook.
I will view `ui.stories.tsx` to check what core UI components are covered in the catalog.
I will run a command to list all components in the `frontend/src/components` folder to see what components are missing Storybook stories.
I will view `TripPhotosPage.stories.tsx` to check what category and stories are defined.
I will view the first 100 lines of `BookingsDocsPage.tsx` to understand its interface.
I will view the first 100 lines of `TripSettingsPage.tsx` to understand its interface.
I will view `OverviewTemplate.stories.tsx` to check what stories and assertions are defined.
I will view `globals.css` in the frontend directory to inspect the theme tokens (colors, surfaces, fonts) for the visual system.
# Executive Summary

This audit assesses the Sagittarius Storybook catalog within the `reference-ui-redesign` workspace. The goal is to verify that the group-trip planning cockpit’s visual system (warm white surfaces, orange primary actions, blue route context, orange warnings), responsive layouts, role-based workflows, and complex path/overlap routing behaviors are comprehensively tested.

While the existing Storybook tests pass, the audit reveals several critical gaps:
1. **Feature Coverage Gaps**: Key cockpit pages and modals (such as the [BookingsDocsPage](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/BookingsDocsPage.tsx), [TripSettingsPage](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripSettingsPage.tsx), and [TripJoinGate](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripJoinGate.tsx)) are entirely absent from the Storybook catalog.
2. **State Gaps**: The required matrices for user roles (Owner, Traveler, Viewer) and data density (Empty, Dense) are inconsistent and missing across multiple page-level and template-level stories.
3. **Responsive Testing Gaps**: Individual page components lack dedicated responsive viewport stories, leaving layout behavior at narrow widths unchecked outside the root app story.
4. **Integration & Flow Gaps**: Complex alternative itinerary paths (e.g. Plan A/Plan B overlays, stress overlaps) are documented only at the template level and are missing integration tests at the page and application levels.
5. **Contract Test Gaps**: The contract tests in [storybook.contract.test.ts](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/storybook.contract.test.ts) use a simple global text search check rather than ensuring each page individually implements the required role/density matrix.

---

# Audit Findings

## 1. High Severity Findings

### 1.1. Core Cockpit Pages Completely Missing from Storybook
* **Evidence**:
  Comparing the files in the components directory [frontend/src/components](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components) against the active story list, we find the following pages and critical workflow screens have no Storybook files:
  1. [BookingsDocsPage.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/BookingsDocsPage.tsx): The documents and booking bookings manager page (`PlanningView` = `"bookings"`).
  2. [TripSettingsPage.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripSettingsPage.tsx): The settings manager panel (`PlanningView` = `"settings"`).
  3. [TripJoinGate.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripJoinGate.tsx): The gate page managing credentials, password-checks, and member claiming for access validation.
  4. [StopDialog.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/StopDialog.tsx): The primary modal dialog handling the input and editing of stops.
  5. [ContextRail.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ContextRail.tsx): The collapsible panel showing weather, people, and checklist information.

* **Impact**:
  Crucial interactions like adding/editing stops via a dialog, managing travel documents, and claim-flow credentials go entirely untested in Storybook. Any regressions in their warm white surfaces, form layout, or alignment will go unnoticed.

* **Recommended Storybook Setup**:
  * Create `frontend/src/components/BookingsDocsPage.stories.tsx` rendering [BookingsDocsPage](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/BookingsDocsPage.tsx) with mocked document lists, covering roles: `Owner`, `Traveler`, `Viewer`, and `Empty` states.
  * Create `frontend/src/components/TripSettingsPage.stories.tsx` rendering [TripSettingsPage](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripSettingsPage.tsx), showing edit fields for the `Owner` and a read-only locked layout for the `Traveler`.
  * Create `frontend/src/components/TripJoinGate.stories.tsx` rendering [TripJoinGate](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripJoinGate.tsx) with a password prompt state and the claimable participant selection screen.

---

### 1.2. Missing Traveler and Viewer Roles in Core Page Stories
* **Evidence**:
  * [ItineraryPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ItineraryPage.stories.tsx) and [ItineraryTemplate.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ItineraryTemplate.stories.tsx) define `Owner` and `Viewer` stories but completely omit the `Traveler` role.
  * [TimelinePage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TimelinePage.stories.tsx) and [TimelineTemplate.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TimelineTemplate.stories.tsx) omit both the `Traveler` and `Viewer` roles.
  * [MapPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/MapPage.stories.tsx) and [MapTemplate.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/MapTemplate.stories.tsx) omit both the `Traveler` and `Viewer` roles.
  * [ExpensesPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ExpensesPage.stories.tsx) omits the read-only `Viewer` role.

* **Impact**:
  A `Traveler` has suggestion privileges but cannot modify the itinerary directly. Since there are no stories representing a traveler on the Itinerary page, we cannot verify that action buttons adapt to say *"Propose Stop"* instead of *"Add Stop"*, or that inline save handlers are restricted. Similarly, the read-only bounds of the `Viewer` role on Timeline, Map, and Expenses pages are unchecked.

* **Recommended Stories**:
  * In [ItineraryPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ItineraryPage.stories.tsx), add:
    ```typescript
    export const Traveler: Story = {
      args: {
        ...Owner.args,
        role: "traveler",
      },
      play: async ({ canvas }) => {
        // Assert that the 'Add Stop' button is absent or reads 'Propose Stop'
        await expect(canvas.queryByRole("button", { name: /Add Stop/i })).toBeNull();
      }
    };
    ```
  * Implement equivalent `Viewer` and `Traveler` story exports across the remaining page and template directories to complete the roles matrix.

---

### 1.3. Missing Empty and Dense State Stories in Core Views
* **Evidence**:
  * [ItineraryPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ItineraryPage.stories.tsx) and [ItineraryTemplate.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ItineraryTemplate.stories.tsx) do not define any `Empty` state stories (with 0 itinerary stops).
  * [ExpensesPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ExpensesPage.stories.tsx) lacks both `Empty` (no logs) and `Dense` (many transactions) stories.
  * [TripPhotosPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripPhotosPage.stories.tsx) lacks both `Empty` and `Dense` stories.
  * [MembersPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/MembersPage.stories.tsx) has no `Empty` (single member) or `Dense` stories.

* **Impact**:
  Empty-state placeholders (which guide first-time cockpit users on how to add/import details) and Dense-state limits (which stress-test text wrapping, grid alignment, and scrollbars) are unverified on these views.

* **Recommended Stories**:
  * Add an `Empty` story to [ItineraryPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ItineraryPage.stories.tsx):
    ```typescript
    export const Empty: Story = {
      args: {
        ...Owner.args,
        items: [],
      },
      play: async ({ canvas }) => {
        // Verify empty placeholder text is visible
        await expect(canvas.getByText(/No stops planned yet/i)).toBeVisible();
      }
    };
    ```

---

## 2. Medium Severity Findings

### 2.1. Insufficient Responsive Viewport Coverage for Cockpit Pages
* **Evidence**:
  Individual pages ([MapPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/MapPage.stories.tsx), [TimelinePage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TimelinePage.stories.tsx), [MembersPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/MembersPage.stories.tsx), [ExpensesPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ExpensesPage.stories.tsx), [TripPhotosPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripPhotosPage.stories.tsx)) contain zero stories configured with mobile/tablet viewports. 
  
  Only [SagittariusApp.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/app/SagittariusApp.stories.tsx) and [HomeLanding.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/HomeLanding.stories.tsx) declare viewport configurations.

* **Impact**:
  Responsive behaviors (specifically desktop-first layouts converting to stacked mobile cards, and side-panel drawers shifting off-screen) are not tested in isolation. Mobile regressions (like clipped text, broken grid templates, or missing scroll tracks) on the timeline, members, map, and expenses panels are likely to slip through.

* **Recommended Storybook Setup**:
  Configure responsive stories across all individual page stories using the viewport configurations defined in [preview.ts](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/.storybook/preview.ts):
  ```typescript
  export const Mobile320: Story = {
    args: Owner.args,
    parameters: {
      viewport: { defaultViewport: "mobile320" },
    },
  };
  export const Tablet768: Story = {
    args: Owner.args,
    parameters: {
      viewport: { defaultViewport: "tablet768" },
    },
  };
  ```

---

### 2.2. Missing Alternative Itinerary Paths at the Page and App Levels
* **Evidence**:
  * Alternative path layouts (`BranchGraph`, `PlanAExample`, `RequestedPlanExample`, and `StressPaths`) are tested at the template level in [ItineraryTemplate.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ItineraryTemplate.stories.tsx).
  * However, [ItineraryPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ItineraryPage.stories.tsx) and the integration-level [SagittariusApp.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/app/SagittariusApp.stories.tsx) do not contain alternative path stories.

* **Impact**:
  The actual state integration (when a user clicks alternative graph nodes, swaps path variant tabs, or sets day path overrides) is never verified at the controller level or app level in Storybook. Communications between the parent state container and child elements during routing overrides remain unchecked.

* **Recommended Storybook Setup**:
  * Copy the path mock configurations (e.g. `BranchGraph`, `StressPaths`) from the template story file to [ItineraryPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ItineraryPage.stories.tsx).
  * In [SagittariusApp.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/app/SagittariusApp.stories.tsx), add a play-test checking path switching:
    ```typescript
    export const PlanSwitching: Story = {
      args: { initialView: "itinerary" },
      play: async ({ canvasElement, userEvent }) => {
        // Assert user can select 'Plan A' button, and path variables swap correctly
      }
    };
    ```

---

## 3. Low Severity Findings

### 3.1. Weak Role and Density Checks in storybook.contract.test.ts
* **Evidence**:
  The Vitest contract test in [storybook.contract.test.ts](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/storybook.contract.test.ts) (lines 43-48) joins all story files together and runs string checks:
  ```typescript
  it("documents role and density states", () => {
    const stories = storyText();
    ["Owner", "OwnerThai", "Traveler", "Viewer", "Empty", "Dense", ...].forEach((stateName) => {
      expect(stories).toContain(`export const ${stateName}`);
    });
  });
  ```

* **Impact**:
  This contract will pass as long as *any* story file anywhere in the repository exports a variable named `Traveler` (e.g., `MembersTemplate.stories.tsx` exporting `Traveler` satisfies the check globally). It fails to enforce that the primary planning cockpit templates and views independently support their required role/density matrix.

* **Recommended Verification**:
  Refactor the contract test to analyze story files individually or to target specific files explicitly, verifying that each primary view page implements the expected exports. For example:
  ```typescript
  const corePages = [
    "src/components/OverviewPage.stories.tsx",
    "src/components/ItineraryPage.stories.tsx",
    "src/components/TimelinePage.stories.tsx",
    "src/components/MapPage.stories.tsx",
    "src/components/MembersPage.stories.tsx"
  ];
  corePages.forEach((file) => {
    const content = readFileSync(file, "utf8");
    ["Owner", "Traveler", "Viewer"].forEach((role) => {
      expect(content).toContain(`export const ${role}`);
    });
  });
  ```

---

# Verification and Closure Plan

To resolve the coverage gaps and ensure alignment with Sagittarius visual requirements, the following steps are recommended:

1. **Implement Core Page Stories**: Add story files for the missing [BookingsDocsPage](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/BookingsDocsPage.tsx), [TripSettingsPage](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripSettingsPage.tsx), and [TripJoinGate](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripJoinGate.tsx) components.
2. **Expand Role/Density Matrix**: Populate all core page stories with `Traveler`, `Viewer`, `Dense`, and `Empty` story variants.
3. **Configure Viewport Controls**: Add responsive mobile (320px) and tablet (768px) views to page stories.
4. **Refactor Contract Tests**: Update [storybook.contract.test.ts](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/storybook.contract.test.ts) to enforce specific page-level exports.
5. **Run storybook checks**: Execute `bun run test:storybook` to verify story file additions and interactions compile successfully.

## Stderr

(no stderr)
