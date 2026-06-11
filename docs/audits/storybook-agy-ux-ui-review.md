# Storybook AGY UX/UI Review

Generated: 2026-06-11T07:33:11.690Z
Command: agy --add-dir /Users/xiivth/workspace/zodiac/sagittarius/.worktrees/reference-ui-redesign -p <storybook-ux-ui-prompt>

## Output

I will start by listing the contents of the target directory to verify the workspace structure and locate the Storybook source files.
I will view the instructions in the `modern-web-guidance` skill file as required for client-side and web-related tasks.
I will list all the Storybook story files (`*.stories.tsx`) within the `frontend/src` directory to see the scope of components currently defined in the catalog.
I will examine the Storybook preview configuration file to check what global viewports, decorators, languages, and parameters are defined.
I will view the contract test file to see what Storybook integration tests are running and how stories are verified programmatically.
I will view `frontend/src/app/SagittariusApp.stories.tsx` to understand the stories for the main cockpit app and see how different access roles and responsive widths/viewports are defined.
I will use `grep_search` to find which Storybook story files define the required role states (`Traveler`, `Viewer`), density states (`Dense`, `Empty`), and check where they are declared.
I will search for `Viewer` state stories to see where they are defined.
I will search for `Empty` and `Dense` story states using `grep_search`.
I will search for `Dense` story states using `grep_search`.
I will examine the `frontend/src/components/ItineraryTemplate.stories.tsx` file to see how the Smart Itinerary Table and its various itinerary path states are set up, including alternative routes (Plan A/B), overlap stress, and table overflow, and what roles it covers.
I will view the page-level story `frontend/src/components/ItineraryPage.stories.tsx` to check what viewports, role states, or path states are tested at the page component level.
I will list the contents of the `frontend/.storybook` directory to see if there are other configuration files (like `main.ts` or MSW handlers) that contain relevant definitions.
I will view `frontend/.storybook/main.ts` to check the Storybook framework options and configuration.
I will use `grep_search` to find all references to the keyword `viewport` in the story files. This will help identify what responsive width coverage currently exists.
I will search for `export const` in `frontend/src/components/OverviewTemplate.stories.tsx` to see what states/roles are defined there.
I will search for `export const` in `frontend/src/components/TimelineTemplate.stories.tsx` to see what states/roles are defined there.
I will search for `export const` in `frontend/src/components/MapTemplate.stories.tsx` to check what states/roles are defined there.
I will search for `export const` in `frontend/src/components/MembersTemplate.stories.tsx` to check what states/roles are defined there.
I will search for references to `role` within the `SmartItineraryTable.tsx` file to see how owner, traveler, and viewer roles affect the rendering and UI of the itinerary table.
I will search for `role` across the components in the `frontend/src/components` directory to understand how the role system affects the shell and other views.
I will search for `canEdit` and `canManageTripSheets` in `SmartItineraryTable.tsx` to see exactly which interactive elements (such as buttons, forms, drag-and-drop, and sheets management) are hidden or disabled when a user has a restricted role (e.g., traveler or viewer).
I will search for `canManageTripSheets` in `SmartItineraryTable.tsx` to understand how the ability to manage trip sheets is controlled and what UI parts are affected.
I will view `frontend/src/styles.contract.test.ts` to see what styling contract tests verify, specifically regarding horizontal scrolling and overflow for the smart itinerary table.
I will search for `export const` in `frontend/src/components/OverviewPage.stories.tsx` to check what stories are defined there.
I will search for `export const` in `frontend/src/components/TimelinePage.stories.tsx` to check what stories are defined there.
I will search for `export const` in `frontend/src/components/MapPage.stories.tsx` to check what stories are defined there.
I will search for `export const` in `frontend/src/components/MembersPage.stories.tsx` to check what stories are defined there.
I will search for how empty state/no-items is handled in `SmartItineraryTable.tsx` to see if there's specific rendering logic for when the trip has zero stops.
I will check how `items` are rendered in `SmartItineraryTable.tsx` by searching for references to the `.map` function or loops on `items`.
I will search for the word `items` in `SmartItineraryTable.tsx` to find where the array of itinerary items is processed.
I will search for `overlap` or `warning` in `SmartItineraryTable.tsx` to see how timing conflicts are detected, highlighted, and if they generate warnings.
I will search for `truncate` or `ellipsis` in `SmartItineraryTable.tsx` to see if text overflow is handled using CSS truncation, which is important for our data-extreme validation.
I will now compile the detailed Sagittarius Storybook UX/UI Catalog Audit Report. I will write this report as a markdown artifact in the designated conversation directory, ordering the findings by severity and detailing specific file references, evidence, and recommended Storybook story additions or play function assertions.
I have completed a thorough audit of the Sagittarius Storybook UX/UI catalog. 

The full audit report has been generated as an artifact:
👉 [storybook_audit_report.md](file:///Users/xiivth/.gemini/antigravity-cli/brain/ee5feeb9-feb6-4041-8514-b3d069937b18/storybook_audit_report.md)

### Key Decisions & Actions Required
1. **Responsive Viewport Configuration**: We need to configure custom viewports (320px, 768px, 1024px, 1440px) in [preview.ts](file:///Users/xiivth/workspace/zodiac/sagittarius/frontend/.storybook/preview.ts) and add corresponding stories to the main cockpit and page story files.
2. **Role States Integration**: The contract test is currently passing due to global checks, but we need to add explicit `Traveler`, `Viewer`, `Dense`, and `Empty` stories with play assertions to the integration stories ([SagittariusApp.stories.tsx](file:///Users/xiivth/workspace/zodiac/sagittarius/frontend/src/app/SagittariusApp.stories.tsx)).
3. **Itinerary Overlap Warnings & Auto-Fix Action**: We need to introduce an `OverlapConflict` story with overlapping itinerary items on the same path and mock the `onAutoResolveDayOverlaps` callback to verify the rendering and interaction of the warning state.

## Stderr

(no stderr)
