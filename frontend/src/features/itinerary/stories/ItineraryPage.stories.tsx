import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SmartItineraryTable } from "@/src/features/itinerary/components";
import {
  branchGraphPathOptions,
  planAPathOptions,
  planABPathOptions,
  stressPathOptions,
  buildOwnerStoryArgs,
  denseTripFixture,
  emptyTripFixture,
} from "./itinerary-story-fixtures";
import {
  buildPageOverflowItems,
  onStoryChangeDayPath,
  onStoryInlineQuickEdit,
  onStoryMoveItemToPath,
  onStoryToggleShowAllPaths,
  onStoryUpdateItemInline,
  pageBranchGraphItems,
  pageOverlapConflictItems,
  pagePlanABAlternativeItems,
  pagePlanAExampleItems,
  pageRequestedPlanExampleItems,
  pageStressPathItems,
  pageWindowOnlyDurationItems,
} from "./ItineraryPage.stories.support";
import {
  branchGraphPlay,
  inlineQuickEditPlay,
  mobileInspectorQuickEditPlay,
  mobilePlay,
  overlapConflictWarningPlay,
  ownerPlay,
  ownerThaiPlay,
  pathAndDurationInteractionsPlay,
  planABAlternativesPlay,
  planAExamplePlay,
  requestedPlanExamplePlay,
  responsivePlay,
  stressPathsPlay,
  tableOverflowPlay,
  travelerPlay,
  viewerPlay,
} from "./ItineraryPage.stories.plays";

const meta = {
  title: "Pages/Itinerary",
  component: SmartItineraryTable,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SmartItineraryTable>;

export default meta;

type Story = StoryObj<typeof meta>;
type StoryArgs = NonNullable<Story["args"]>;
type StoryParameters = NonNullable<Story["parameters"]>;

export const Owner: Story = {
  args: buildOwnerStoryArgs({
    onMoveItemToPath: onStoryMoveItemToPath,
    onChangeDayPath: onStoryChangeDayPath,
    onToggleShowAllPaths: onStoryToggleShowAllPaths,
    onUpdateItemInline: onStoryUpdateItemInline,
  }),
  play: ownerPlay,
};

function ownerArgsStory(
  args: Partial<StoryArgs>,
  play?: Story["play"],
  parameters?: StoryParameters,
): Story {
  return {
    args: { ...Owner.args, ...args },
    ...(parameters ? { parameters } : {}),
    ...(play ? { play } : {}),
  };
}

function viewportStory(
  defaultViewport: string,
  play: Story["play"],
  args: Partial<StoryArgs> = {},
): Story {
  return ownerArgsStory(args, play, {
    viewport: { defaultViewport },
  });
}

export const InlineQuickEdit: Story = ownerArgsStory(
  { onUpdateItemInline: onStoryInlineQuickEdit },
  inlineQuickEditPlay,
);

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: ownerThaiPlay,
};

export const TimeWindowDuration: Story = ownerArgsStory({
  items: pageWindowOnlyDurationItems,
  selectedItemId: "page-window-only-duration",
});

export const Viewer: Story = ownerArgsStory({ role: "viewer" }, viewerPlay);

export const Traveler: Story = ownerArgsStory({ role: "traveler" }, travelerPlay);

export const Dense: Story = ownerArgsStory({
  items: denseTripFixture.itineraryItems,
  selectedItemId: "",
});

export const Empty: Story = ownerArgsStory({
  items: emptyTripFixture.itineraryItems,
  selectedItemId: "",
});

export const OverlapConflictWarning: Story = ownerArgsStory({
  selectedItemId: "overlap-dim-sum",
  items: pageOverlapConflictItems,
}, overlapConflictWarningPlay);

export const PlanAExample: Story = ownerArgsStory({
  items: pagePlanAExampleItems,
  graphItems: pagePlanAExampleItems,
  selectedItemId: "page-plan-a-main-breakfast",
  showAllPaths: true,
  pathOptions: planAPathOptions,
}, planAExamplePlay);

export const PlanABAlternatives: Story = ownerArgsStory({
  items: pagePlanABAlternativeItems,
  graphItems: pagePlanABAlternativeItems,
  selectedItemId: "page-plan-ab-main-breakfast",
  showAllPaths: true,
  pathOptions: planABPathOptions,
}, planABAlternativesPlay);

export const PathAndDurationInteractions: Story = ownerArgsStory({
  items: pagePlanABAlternativeItems,
  graphItems: pagePlanABAlternativeItems,
  selectedItemId: "page-plan-ab-main-breakfast",
  showAllPaths: false,
  pathOptions: planABPathOptions,
  onChangeDayPath: onStoryChangeDayPath,
  onMoveItemToPath: onStoryMoveItemToPath,
  onToggleShowAllPaths: onStoryToggleShowAllPaths,
  onUpdateItemInline: onStoryUpdateItemInline,
}, pathAndDurationInteractionsPlay);

export const BranchGraph: Story = ownerArgsStory({
  items: pageBranchGraphItems,
  graphItems: pageBranchGraphItems,
  selectedItemId: "page-graph-main",
  showAllPaths: true,
  pathOptions: branchGraphPathOptions,
}, branchGraphPlay);

export const RequestedPlanExample: Story = ownerArgsStory({
  items: pageRequestedPlanExampleItems,
  graphItems: pageRequestedPlanExampleItems,
  selectedItemId: "page-requested-main-0800",
  showAllPaths: true,
  pathOptions: planAPathOptions,
}, requestedPlanExamplePlay);

export const StressPaths: Story = ownerArgsStory({
  items: pageStressPathItems,
  graphItems: pageStressPathItems,
  selectedItemId: "page-stress-0800-main",
  showAllPaths: true,
  pathOptions: stressPathOptions,
}, stressPathsPlay);

export const TableOverflow: Story = viewportStory("mobile320", tableOverflowPlay, {
  items: buildPageOverflowItems(),
  graphItems: pageStressPathItems,
  selectedItemId: "page-overflow-page-stress-0800-main",
  showAllPaths: true,
  pathOptions: stressPathOptions,
});

export const Tablet: Story = viewportStory("tablet768", responsivePlay);

export const Desktop1024: Story = viewportStory("desktop1024", responsivePlay);

export const Desktop1440: Story = viewportStory("desktop1440", responsivePlay);

export const Mobile: Story = viewportStory("mobile320", mobilePlay);

export const MobileInspectorQuickEdit: Story = viewportStory(
  "mobile320",
  mobileInspectorQuickEditPlay,
  { onUpdateItemInline: onStoryInlineQuickEdit },
);

export const MobileViewer: Story = viewportStory("mobile320", mobilePlay, {
  role: "viewer",
});
