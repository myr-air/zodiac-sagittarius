import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { SmartItineraryTable } from "@/src/features/itinerary/components";
import { pathIdMain } from "@/src/features/itinerary/testing";
import {
  branchGraphPathOptions,
  planAPathOptions,
  planABPathOptions,
  stressPathOptions,
  buildOwnerStoryArgs,
  denseTripFixture,
  emptyTripFixture,
  pathNameMain,
} from "./itinerary-story-fixtures";
import {
  buildPageOverflowItems,
  onStoryChangeDayPath,
  onStoryInlineQuickEdit,
  onStoryMoveItemToPath,
  onStoryToggleShowAllPaths,
  onStoryUpdateItemInline,
  pageBranchGraphItems,
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

export const Owner: Story = {
  args: buildOwnerStoryArgs({
    onMoveItemToPath: onStoryMoveItemToPath,
    onChangeDayPath: onStoryChangeDayPath,
    onToggleShowAllPaths: onStoryToggleShowAllPaths,
    onUpdateItemInline: onStoryUpdateItemInline,
  }),
  play: ownerPlay,
};

export const InlineQuickEdit: Story = {
  args: {
    ...Owner.args,
    onUpdateItemInline: onStoryInlineQuickEdit,
  },
  play: inlineQuickEditPlay,
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: ownerThaiPlay,
};

export const TimeWindowDuration: Story = {
  args: {
    ...Owner.args,
    items: pageWindowOnlyDurationItems,
    selectedItemId: "page-window-only-duration",
  },
};

export const Viewer: Story = {
  args: {
    ...Owner.args,
    role: "viewer",
  },
  play: viewerPlay,
};

export const Traveler: Story = {
  args: {
    ...Owner.args,
    role: "traveler",
  },
  play: travelerPlay,
};

export const Dense: Story = {
  args: {
    ...Owner.args,
    items: denseTripFixture.itineraryItems,
    selectedItemId: "",
  },
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    items: emptyTripFixture.itineraryItems,
    selectedItemId: "",
  },
};

export const OverlapConflictWarning: Story = {
  args: {
    ...Owner.args,
    selectedItemId: "overlap-dim-sum",
    items: [
      {
        ...tripFixture.planItems[0],
        id: "overlap-peak-tram",
        day: tripFixture.trip.startDate,
        startTime: "09:00",
        durationMinutes: 120,
        sortOrder: 10,
        pathId: pathIdMain,
        pathName: pathNameMain,
        pathRole: "main",
      },
      {
        ...tripFixture.planItems[1],
        id: "overlap-dim-sum",
        day: tripFixture.trip.startDate,
        startTime: "09:30",
        durationMinutes: 90,
        sortOrder: 20,
        pathId: pathIdMain,
        pathName: pathNameMain,
        pathRole: "main",
      },
    ],
  },
  play: overlapConflictWarningPlay,
};

export const PlanAExample: Story = {
  args: {
    ...Owner.args,
    items: pagePlanAExampleItems,
    graphItems: pagePlanAExampleItems,
    selectedItemId: "page-plan-a-main-breakfast",
    showAllPaths: true,
    pathOptions: planAPathOptions,
  },
  play: planAExamplePlay,
};

export const PlanABAlternatives: Story = {
  args: {
    ...Owner.args,
    items: pagePlanABAlternativeItems,
    graphItems: pagePlanABAlternativeItems,
    selectedItemId: "page-plan-ab-main-breakfast",
    showAllPaths: true,
    pathOptions: planABPathOptions,
  },
  play: planABAlternativesPlay,
};

export const PathAndDurationInteractions: Story = {
  args: {
    ...Owner.args,
    items: pagePlanABAlternativeItems,
    graphItems: pagePlanABAlternativeItems,
    selectedItemId: "page-plan-ab-main-breakfast",
    showAllPaths: false,
    pathOptions: planABPathOptions,
    onChangeDayPath: onStoryChangeDayPath,
    onMoveItemToPath: onStoryMoveItemToPath,
    onToggleShowAllPaths: onStoryToggleShowAllPaths,
    onUpdateItemInline: onStoryUpdateItemInline,
  },
  play: pathAndDurationInteractionsPlay,
};

export const BranchGraph: Story = {
  args: {
    ...Owner.args,
    items: pageBranchGraphItems,
    graphItems: pageBranchGraphItems,
    selectedItemId: "page-graph-main",
    showAllPaths: true,
    pathOptions: branchGraphPathOptions,
  },
  play: branchGraphPlay,
};

export const RequestedPlanExample: Story = {
  args: {
    ...Owner.args,
    items: pageRequestedPlanExampleItems,
    graphItems: pageRequestedPlanExampleItems,
    selectedItemId: "page-requested-main-0800",
    showAllPaths: true,
    pathOptions: planAPathOptions,
  },
  play: requestedPlanExamplePlay,
};

export const StressPaths: Story = {
  args: {
    ...Owner.args,
    items: pageStressPathItems,
    graphItems: pageStressPathItems,
    selectedItemId: "page-stress-0800-main",
    showAllPaths: true,
    pathOptions: stressPathOptions,
  },
  play: stressPathsPlay,
};

export const TableOverflow: Story = {
  args: {
    ...Owner.args,
    items: buildPageOverflowItems(),
    graphItems: pageStressPathItems,
    selectedItemId: "page-overflow-page-stress-0800-main",
    showAllPaths: true,
    pathOptions: stressPathOptions,
  },
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: tableOverflowPlay,
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: responsivePlay,
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: responsivePlay,
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: responsivePlay,
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: mobilePlay,
};

export const MobileInspectorQuickEdit: Story = {
  args: {
    ...Owner.args,
    onUpdateItemInline: onStoryInlineQuickEdit,
  },
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: mobileInspectorQuickEditPlay,
};

export const MobileViewer: Story = {
  args: {
    ...Owner.args,
    role: "viewer",
  },
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: mobilePlay,
};
