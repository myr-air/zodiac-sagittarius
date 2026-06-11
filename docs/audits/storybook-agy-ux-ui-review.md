# Storybook AGY UX/UI Review

Generated: 2026-06-11T08:34:52.644Z
Command: agy --add-dir /Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign -p <storybook-ux-ui-prompt>

## Output

I will first inspect the mandatory modern web guidance skill to ensure our audit adheres to modern standards and practices.
I will list the directory contents of the Sagittarius workspace frontend folder to see the structure of the project and verify the locations of files like the preview config, story sources, and the contract test.
I will view the Storybook preview configuration to understand how viewports, parameters, and other settings are set up.
I will read the Storybook contract test file to understand what constraints, validations, or contracts are enforced on our Storybook stories.
I will read the Storybook UX/UI QA documentation to get context on the design system requirements, visual checklist, and QA criteria.
I will read the script `run-storybook-agy-ux-qa.ts` to see if there is any automation or code related to the Sagittarius Storybook UX/UI QA that we need to be aware of.
I will search for all Storybook files by querying the `title:` string in the `src` folder to list the files and see their titles.
I will view `package.json` to see the available scripts and dependencies, especially around Storybook and testing.
I will view the Vitest configuration file to understand how unit and Storybook tests are structured and run in this project.
I will run the unit tests (which include the Storybook contract test) to check the current status of test assertions.
I will view the `ItineraryPage.stories.tsx` file to inspect how the itinerary page stories are structured and what states they cover.
I will check the status and output of the unit tests run to verify if all tests passed and see what they printed.
I will search the Storybook source files for where `TableOverflow` is defined to inspect its implementation.
I will search for the definition of `TabletItinerary` across the Storybook files.
I will view the `ItineraryTemplate.stories.tsx` file to see how the itinerary template is structured and what states are defined.
I will view the unit test log file to see the results.
I will check the status of the running unit tests task.
I will view the `OverviewPage.stories.tsx` file to see how it is configured and check for any gaps in views or roles.
I will view the `TimelinePage.stories.tsx` file to check its stories and exports.
I will view the `MapPage.stories.tsx` file to check its stories and exports.
I will view the `MembersPage.stories.tsx` file to inspect its stories and configuration.
I will check the status of the unit tests task to see if it has finished.
I will view the `SagittariusApp.stories.tsx` file to see how the top-level application stories are set up, including roles and viewports.
I will list the contents of the built Storybook static directory to verify the presence of index files, story definitions, and assets.
I will inspect `index.json` in the Storybook static build directory to examine all registered story metadata.
I will view the `BookingsDocsPage.stories.tsx` file to check the coverage of roles and states.
I will view the `TripSettingsPage.stories.tsx` file to inspect its story definitions and configurations.
I will view the `TripPhotosPage.stories.tsx` file to inspect its configuration and identify gaps in coverage.
I will view the `ExpensesPage.stories.tsx` file to inspect its coverage.
I will view the `TripJoinGate.stories.tsx` file to inspect its exports and parameters.
I will view the `StopDialog.stories.tsx` file to inspect its stories.
I will list the files in the `src/components` directory to identify other components and potential gaps.
I will search the codebase for references to `AboutAppPage` to see if it is a major view in the application that is missing story coverage.
I will search for the properties accepted by `RouteMapView` to see if they are role-dependent and whether the map stories have a role testing gap.
I will read the top portion of `RouteMapView.tsx` to understand its props and check if it uses member role information.
I will view the `WeatherBriefingDrawer.stories.tsx` file to check if it has appropriate states, localization, and viewport coverage.
I will view the `WeatherForecastStrip.stories.tsx` file to inspect its configurations and states.
I will view the `AppShell.stories.tsx` file to inspect how the Workspace Shell template is set up.
### Sagittarius Storybook UX/UI Catalog Audit Findings

This audit reviews the current Sagittarius Storybook story files and configuration. It identifies gaps in coverage for responsive viewports ($320\text{px}$, $768\text{px}$, $1024\text{px}$, and $1440\text{px}$), bilingual translations, user roles, and itinerary path states.

---

### High Severity Gaps

#### 1. Missing App-Level Responsive Coverage for Secondary Cockpit Features
* **Severity**: High
* **Evidence**: In [SagittariusApp.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/app/SagittariusApp.stories.tsx), responsive stories for Tablet ($768\text{px}$) and Mobile ($320\text{px}$) viewports are only defined for the Itinerary, Timeline, Map, and Members views. There are **no integration-level responsive stories** for the following primary cockpit sub-views:
  - Expenses (`bookings`, `photos`, `expenses`, `settings`)
* **Impact**: Without app-level viewport gating, visual bugs—such as context menu overlaps, nav bar crowding, and mobile scroll hijacking inside the workspace shell—will go unnoticed when running these views on mobile and tablet.
* **Recommendation**: Add explicit mobile/tablet integration stories in [SagittariusApp.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/app/SagittariusApp.stories.tsx):
  ```typescript
  export const MobileExpenses: Story = {
    args: { initialView: "expenses" },
    parameters: { viewport: { defaultViewport: "mobile320" } },
    play: async ({ canvasElement }) => {
      await expect(canvasElement.querySelector(".expenses-page")).toBeInTheDocument();
    },
  };
  export const TabletExpenses: Story = {
    args: { initialView: "expenses" },
    parameters: { viewport: { defaultViewport: "tablet768" } },
  };
  ```

#### 2. Missing Thai Localization Gaps on Gated Pages
* **Severity**: High
* **Evidence**: Sagittarius requires bilingual English/Thai verification. However, [BookingsDocsPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/BookingsDocsPage.stories.tsx) does not declare a Thai localization story.
* **Impact**: Critical passenger records status badges, upload fields, and empty states cannot be visually verified for word-wrapping, truncation, or layout breakages in Thai.
* **Recommendation**: Add an `OwnerThai` story in [BookingsDocsPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/BookingsDocsPage.stories.tsx):
  ```typescript
  export const OwnerThai: Story = {
    args: Owner.args,
    parameters: { locale: "th" },
    play: async ({ canvas }) => {
      await expect(canvas.getByRole("region", { name: /การจองและเอกสาร/i })).toBeVisible();
      await expect(canvas.getByRole("button", { name: /เพิ่มการจอง/i })).toBeVisible();
    },
  };
  ```

#### 3. Missing Page-Level Alternative Path & Overflow Coverage
* **Severity**: High
* **Evidence**: While [ItineraryTemplate.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ItineraryTemplate.stories.tsx) provides comprehensive coverage of Plan A/B alternatives, table overflow, and stress-tested paths, the actual page-level configuration [ItineraryPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ItineraryPage.stories.tsx) only includes `OverlapConflictWarning` and basic viewports.
* **Impact**: Integration regressions (such as the interaction of the sticky day column headers, mobile table overflow margins, and context panels with page-level layout adjustments) are not tested at the page layer.
* **Recommendation**: Port the alternative itinerary path stories into [ItineraryPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ItineraryPage.stories.tsx):
  ```typescript
  export const TableOverflow: Story = {
    args: {
      ...Owner.args,
      items: stressPathItems.map((item, index) => ({
        ...item,
        activity: `${item.activity} with long table text overflow validation ${index + 1}`,
      })),
      showAllPaths: true,
    },
    parameters: { viewport: { defaultViewport: "mobile320" } },
    play: async ({ canvasElement }) => {
      await expect(canvasElement.querySelector(".table-scroll")).toHaveClass("overflow-x-auto");
    },
  };
  ```

---

### Medium Severity Gaps

#### 4. Missing Traveler and Viewer Roles in Timeline View
* **Severity**: Medium
* **Evidence**: In [TimelinePage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TimelinePage.stories.tsx), the only exported stories are `Owner`, `OwnerThai`, `Dense`, `Empty`, `Tablet`, and `Mobile`. The `Traveler` and `Viewer` role stories are missing.
* **Impact**: Visual components like timeline node drag-and-drop handles, add/edit buttons, and context action menus must be disabled or hidden for viewers. This state currently lacks regression test assertions.
* **Recommendation**: Add a `Viewer` story in [TimelinePage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TimelinePage.stories.tsx):
  ```typescript
  export const Viewer: Story = {
    args: {
      ...Owner.args,
      role: "viewer",
    },
    play: async ({ canvasElement }) => {
      await expect(canvasElement.querySelectorAll(".timeline-drag-handle").length).toBe(0);
    },
  };
  ```

#### 5. Missing Traveler Role Gaps on Settings Pages
* **Severity**: Medium
* **Evidence**:
  - [TripSettingsPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripSettingsPage.stories.tsx) does not define a traveler role story (only `Owner`, `Viewer`, `Thai`, and `Mobile`).
  - [TripPhotosPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripPhotosPage.stories.tsx) is similarly missing a `Traveler` story.
* **Impact**: Travelers have restricted permissions compared to Owners but more than Viewers (e.g., they can link photos and view settings but cannot delete the trip). These differences are untested.
* **Recommendation**: Add a `Traveler` story in [TripSettingsPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripSettingsPage.stories.tsx):
  ```typescript
  export const Traveler: Story = {
    args: {
      ...Owner.args,
      canEdit: false,
      currentMember: tripFixture.currentMembers.traveler,
    },
    play: async ({ canvas }) => {
      await expect(canvas.getByText(/Only owners and organizers can edit/i)).toBeVisible();
      await expect(canvas.getByRole("button", { name: /Save changes/i })).toBeDisabled();
    },
  };
  ```

#### 6. Missing Tablet Viewport Stories for Secondary Gated Screens
* **Severity**: Medium
* **Evidence**: The following files only declare a `Mobile` viewport ($320\text{px}$) and completely omit `Tablet` ($768\text{px}$) configurations:
  - [BookingsDocsPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/BookingsDocsPage.stories.tsx)
  - [TripSettingsPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripSettingsPage.stories.tsx)
  - [TripJoinGate.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripJoinGate.stories.tsx)
  - [AppShell.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/AppShell.stories.tsx)
* **Impact**: At the $768\text{px}$ breakpoint, the side workspace panel collapses and transitions to stacked layouts. Gaps in tablet verification risk layout overflow or unaligned container frames going undetected.
* **Recommendation**: Declare an explicit `Tablet` story for these targets, for instance in [BookingsDocsPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/BookingsDocsPage.stories.tsx):
  ```typescript
  export const Tablet: Story = {
    args: Owner.args,
    parameters: { viewport: { defaultViewport: "tablet768" } },
  };
  ```

---

### Low Severity Gaps

#### 7. Missing Dense State in BookingsDocsPage
* **Severity**: Low
* **Evidence**: [BookingsDocsPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/BookingsDocsPage.stories.tsx) has an `Empty` state story but does not test page layout performance or visual crowding when loading a large array of passenger documents.
* **Recommendation**: Add a `Dense` story using a generated array of 15+ mock booking items.

#### 8. Missing App-Level Dense and Empty State Stories
* **Severity**: Low
* **Evidence**: In [SagittariusApp.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/app/SagittariusApp.stories.tsx), there are no top-level integration stories that test the entire cockpit under `Dense` or `Empty` data conditions.
* **Recommendation**: Register `Dense` and `Empty` story variants at the root level using the dense and empty trip fixtures.

## Stderr

(no stderr)
