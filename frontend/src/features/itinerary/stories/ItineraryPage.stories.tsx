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
} from "./support/itinerary-story-fixtures";
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
import {
  ownerArgsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";

const meta = {
  title: "Pages/Itinerary",
  component: SmartItineraryTable,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SmartItineraryTable>;

export default meta;

type Story = StoryObj<typeof meta>;
const ownerStory = ownerArgsStory<Story>;
const viewportStoryForOwner = viewportStory<Story>;

export const Owner: Story = {
  args: buildOwnerStoryArgs({
    onMoveItemToPath: onStoryMoveItemToPath,
    onChangeDayPath: onStoryChangeDayPath,
    onToggleShowAllPaths: onStoryToggleShowAllPaths,
    onUpdateItemInline: onStoryUpdateItemInline,
  }),
  play: ownerPlay,
};

export const InlineQuickEdit: Story = ownerStory(
  Owner.args,
  { onUpdateItemInline: onStoryInlineQuickEdit },
  inlineQuickEditPlay,
);

export const OwnerThai: Story = ownerStory(Owner.args, {}, ownerThaiPlay, {
  locale: "th",
});

export const TimeWindowDuration: Story = ownerStory(Owner.args, {
  items: pageWindowOnlyDurationItems,
  selectedItemId: "page-window-only-duration",
});

export const Viewer: Story = ownerStory(Owner.args, { role: "viewer" }, viewerPlay);

export const Traveler: Story = ownerStory(Owner.args, { role: "traveler" }, travelerPlay);

export const Dense: Story = ownerStory(Owner.args, {
  items: denseTripFixture.itineraryItems,
  selectedItemId: "",
});

export const Empty: Story = ownerStory(Owner.args, {
  items: emptyTripFixture.itineraryItems,
  selectedItemId: "",
});

export const OverlapConflictWarning: Story = ownerStory(Owner.args, {
  selectedItemId: "overlap-dim-sum",
  items: pageOverlapConflictItems,
}, overlapConflictWarningPlay);

export const PlanAExample: Story = ownerStory(Owner.args, {
  items: pagePlanAExampleItems,
  graphItems: pagePlanAExampleItems,
  selectedItemId: "page-plan-a-main-breakfast",
  showAllPaths: true,
  pathOptions: planAPathOptions,
}, planAExamplePlay);

export const PlanABAlternatives: Story = ownerStory(Owner.args, {
  items: pagePlanABAlternativeItems,
  graphItems: pagePlanABAlternativeItems,
  selectedItemId: "page-plan-ab-main-breakfast",
  showAllPaths: true,
  pathOptions: planABPathOptions,
}, planABAlternativesPlay);

export const PathAndDurationInteractions: Story = ownerStory(Owner.args, {
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

export const BranchGraph: Story = ownerStory(Owner.args, {
  items: pageBranchGraphItems,
  graphItems: pageBranchGraphItems,
  selectedItemId: "page-graph-main",
  showAllPaths: true,
  pathOptions: branchGraphPathOptions,
}, branchGraphPlay);

export const RequestedPlanExample: Story = ownerStory(Owner.args, {
  items: pageRequestedPlanExampleItems,
  graphItems: pageRequestedPlanExampleItems,
  selectedItemId: "page-requested-main-0800",
  showAllPaths: true,
  pathOptions: planAPathOptions,
}, requestedPlanExamplePlay);

export const StressPaths: Story = ownerStory(Owner.args, {
  items: pageStressPathItems,
  graphItems: pageStressPathItems,
  selectedItemId: "page-stress-0800-main",
  showAllPaths: true,
  pathOptions: stressPathOptions,
}, stressPathsPlay);

export const TableOverflow: Story = viewportStoryForOwner(Owner.args, "mobile320", tableOverflowPlay, {
  items: buildPageOverflowItems(),
  graphItems: pageStressPathItems,
  selectedItemId: "page-overflow-page-stress-0800-main",
  showAllPaths: true,
  pathOptions: stressPathOptions,
});

export const Tablet: Story = viewportStoryForOwner(Owner.args, "tablet768", responsivePlay);

export const Desktop1024: Story = viewportStoryForOwner(Owner.args, "desktop1024", responsivePlay);

export const Desktop1440: Story = viewportStoryForOwner(Owner.args, "desktop1440", responsivePlay);

export const Mobile: Story = viewportStoryForOwner(Owner.args, "mobile320", mobilePlay);

export const MobileInspectorQuickEdit: Story = viewportStoryForOwner(
  Owner.args,
  "mobile320",
  mobileInspectorQuickEditPlay,
  { onUpdateItemInline: onStoryInlineQuickEdit },
);

export const MobileViewer: Story = viewportStoryForOwner(Owner.args, "mobile320", mobilePlay, {
  role: "viewer",
});
