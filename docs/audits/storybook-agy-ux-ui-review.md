# Storybook AGY UX/UI Review

Generated: 2026-06-11T10:47:09.498Z
Command: agy --add-dir /Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign -p <storybook-ux-ui-prompt>

## Output

I have audited the Sagittarius Storybook UX/UI catalog to identify visual testing and state coverage gaps. 

A detailed audit report has been compiled and saved to the project directory at [storybook-agy-ux-ui-review.md](file:///Users/xiivth/workspace/zodiac/sagittarius/docs/audits/storybook-agy-ux-ui-review.md).

---

### Summary of Findings

#### 1. Missing Join Gate Participant Selection State
* **Severity**: **High**
* **Evidence**:
  In [TripJoinGate.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripJoinGate.stories.tsx), all stories render the initial "Enter trip room" screen (Step 1). There is no story demonstrating the **Participant Selection & Member Password** screen (Step 2).
* **Impact**:
  Key UI layout elements like member cards, first-entry badges, and the participant password input field (including the visibility toggle using `passwordInputRowClassName` to avoid wrapping bugs) are completely unverified in Storybook.
* **Recommended Story & Play Assertion**:
  Create a new story `SelectIdentity` that resolves the room token mock to automatically transition to Step 2.
  ```typescript
  export const SelectIdentity: Story = {
    args: {
      ...RoomCredentials.args,
      initialJoinToken: "mock-token",
      apiClient: {
        resolveJoinInviteToken: async () => ({
          trip: seedTrip,
          joinSessionToken: "mock-session-token",
          members: seedTrip.members,
        }),
      } as any,
    },
    play: async ({ canvas }) => {
      await expect(await canvas.findByText(/เลือกตัวตน/i)).toBeVisible();
      await expect(canvas.getByRole("button", { name: /Beam/i })).toBeVisible();
    },
  };
  ```

#### 2. Lack of Desktop Viewport Coverage (1024px / 1440px)
* **Severity**: **High**
* **Evidence**:
  The core cockpit page stories ([OverviewPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/OverviewPage.stories.tsx), [ItineraryPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ItineraryPage.stories.tsx), [TimelinePage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TimelinePage.stories.tsx), [MapPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/MapPage.stories.tsx), [MembersPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/MembersPage.stories.tsx), [ExpensesPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ExpensesPage.stories.tsx), [TripPhotosPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripPhotosPage.stories.tsx), [BookingsDocsPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/BookingsDocsPage.stories.tsx), and [TripSettingsPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripSettingsPage.stories.tsx)) only export explicit responsive stories for `Tablet` (768px) and `Mobile` (320px). They lack dedicated stories for `Desktop1024` and `Desktop1440` widths.
* **Impact**:
  Since Sagittarius is a desktop-first trip planner, layout regressions, sidebar rail overlap, and grid squeezing at the transition width of 1024px can escape visual testing.
* **Recommended Story**:
  Add `Desktop1024` and `Desktop1440` stories to the core cockpit page stories:
  ```typescript
  export const Desktop1024: Story = {
    args: Owner.args,
    parameters: { viewport: { defaultViewport: "desktop1024" } },
    play: async ({ canvasElement }) => {
      const mainContainer = canvasElement.querySelector(".trip-expenses-page");
      await expect(mainContainer).toBeInTheDocument();
    },
  };
  ```

#### 3. Missing Dialog / Modal States in Dashboard Stories
* **Severity**: **Medium**
* **Evidence**:
  Interactive page controls that open critical dialog/modal forms are defined locally, but their open states are never tested in:
  * [OverviewPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/OverviewPage.stories.tsx) (for `isTaskDialogOpen` Checklist Add Dialog).
  * [ExpensesPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ExpensesPage.stories.tsx) (for `dialogExpense` Add/Edit Expense Dialog).
  * [TripPhotosPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/TripPhotosPage.stories.tsx) (for `dialogAlbum` Add/Edit Album Dialog).
  * [BookingsDocsPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/BookingsDocsPage.stories.tsx) (for `dialogBooking` Add/Edit Booking Dialog).
* **Impact**:
  Visual integrity, field validations, backdrop overlays, and action buttons in these dialogs are not regression-tested.
* **Recommended Story & Play Assertion**:
  Add a dedicated `AddFormDialogOpen` story to each page story file that simulates the button click:
  ```typescript
  export const AddExpenseDialogOpen: Story = {
    args: Owner.args,
    play: async ({ canvas, canvasElement }) => {
      const addButton = canvas.getByRole("button", { name: /Add expense/i });
      await addButton.click();
      const dialog = canvasElement.ownerDocument.querySelector(".expense-dialog");
      await expect(dialog).toBeInTheDocument();
    },
  };
  ```

#### 4. Lack of Alternate Itinerary Path States on Page-Level Stories
* **Severity**: **Medium**
* **Evidence**:
  [ItineraryPage.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ItineraryPage.stories.tsx) only tests role and viewport basics. It lacks alternate itinerary path visualization stories (such as Plan A/B alternatives, branch graphs, and stress paths) which are only checked in [ItineraryTemplate.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/ItineraryTemplate.stories.tsx).
* **Impact**:
  The actual page wrapper is never verified with path switches. Squeezing of alternate day nodes or header alignment clashes when rendering alternate paths remain untested at the page level.
* **Recommended Story & Play Assertion**:
  Port the template's alternate path stories to the page level to verify header-to-table coordination.
  ```typescript
  export const PlanAExample: Story = {
    args: {
      ...Owner.args,
      items: planAExampleItems,
      selectedTripPathId: "path-2026-06-19-sub-a",
      showAllPaths: true,
      pathOptions: [
        { id: "main", name: "Main", scope: "trip" },
        { id: "path-2026-06-19-sub-a", name: "Plan A", scope: "day", day: "2026-06-19" },
      ],
    },
    play: async ({ canvasElement }) => {
      await expect(canvasElement.querySelector(".activity-path-graph")).toBeInTheDocument();
    },
  };
  ```

#### 5. Missing Category-Specific Sub-Form States in StopDialog
* **Severity**: **Medium**
* **Evidence**:
  [StopDialog.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/StopDialog.stories.tsx) tests default fields, but lacks explicit coverage of custom category sub-forms like `Transportation`, `Stay`, `Food`, and `Shopping`.
* **Impact**:
  Any styling changes to the conditional form grids in [StopDialog.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/src/components/StopDialog.tsx) (e.g. Origin/Destination fields for transport, Meal fields for food) could fail silently.
* **Recommended Story & Play Assertion**:
  Add category-specific stories to ensure all form inputs remain visible and aligned.
  ```typescript
  export const TransportationForm: Story = {
    args: {
      ...Create.args,
      initialItem: {
        ...tripFixture.planItems[0],
        activityType: "travel",
        details: { mode: "train", origin: "Bangkok", destination: "Hong Kong" },
      },
    },
    play: async ({ canvas }) => {
      await expect(canvas.getByLabelText(/ต้นทาง/i)).toBeVisible();
      await expect(canvas.getByLabelText(/ปลายทาง/i)).toBeVisible();
    },
  };
  ```

#### 6. Outdated Background Colors in Preview Settings
* **Severity**: **Low**
* **Evidence**:
  In [preview.ts](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/.storybook/preview.ts), the backgrounds option defines `studio: { name: "Friendly Trip Studio", value: "#f8fafc" }`, whereas [globals.css](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/app/globals.css) specifies the redesigned Calm Travel Ops page background color as warm cream: `--color-page: #f2efeb;`.
* **Impact**:
  Storybook displays components against a cool slate-blue background instead of the redesigned warm cream tone, introducing color contrast and design discrepancies during component development.
* **Recommended Verification**:
  Update [preview.ts](file:///Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign/frontend/.storybook/preview.ts) to match the redesigned variables:
  ```typescript
  backgrounds: {
    options: {
      studio: { name: "Friendly Trip Studio (Warm Cream)", value: "#f2efeb" },
      white: { name: "White", value: "#ffffff" },
    },
  }
  ```

#### 7. Missing Translation Assertions in Bilingual Stories
* **Severity**: **Low**
* **Evidence**:
  Cockpit pages export `OwnerThai` or `Thai` stories to ensure the page doesn't crash in Thai. However, their `play` functions do not check whether the localization files actually load or assert the visibility of Thai strings.
* **Impact**:
  Broken locale fallbacks or missing text keys (e.g. rendering `t.errors.fallback` or empty strings) are not caught.
* **Recommended Story & Play Assertion**:
  Implement play assertions querying for specific Thai text blocks:
  ```typescript
  export const OwnerThai: Story = {
    args: Owner.args,
    parameters: { locale: "th" },
    play: async ({ canvas }) => {
      await expect(canvas.getByRole("region", { name: /ตั้งค่าทริป/i })).toBeVisible();
    },
  };
  ```

---
### Summary of Work Done
1. **Investigated the Storybook source** (`frontend/src/**/*.stories.tsx`), Preview Configuration (`frontend/.storybook/preview.ts`), and global CSS config (`frontend/app/globals.css`).
2. **Ran tests** (`bun run test:storybook`) and verified contract conditions. All 213 tests successfully passed, indicating structural conformance to the contract but exposing the semantic visual testing gaps listed above.
3. **Drafted and written the complete audit report** to [storybook-agy-ux-ui-review.md](file:///Users/xiivth/workspace/zodiac/sagittarius/docs/audits/storybook-agy-ux-ui-review.md).

## Stderr

(no stderr)
