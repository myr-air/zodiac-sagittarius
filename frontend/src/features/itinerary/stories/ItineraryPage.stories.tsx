import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SmartItineraryTable } from "@/src/features/itinerary/components";
import {
  pageBranchGraphArgs,
  pageDenseArgs,
  pageEmptyArgs,
  pageOverlapConflictArgs,
  pageOwnerArgs,
  pagePathAndDurationArgs,
  pagePlanABArgs,
  pagePlanAArgs,
  pageRequestedPlanArgs,
  pageStressPathsArgs,
  pageTableOverflowArgs,
  pageTimeWindowDurationArgs,
  onStoryInlineQuickEdit,
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
  args: pageOwnerArgs,
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
  ...pageTimeWindowDurationArgs,
});

export const Viewer: Story = ownerStory(Owner.args, { role: "viewer" }, viewerPlay);

export const Traveler: Story = ownerStory(Owner.args, { role: "traveler" }, travelerPlay);

export const Dense: Story = ownerStory(Owner.args, {
  ...pageDenseArgs,
});

export const Empty: Story = ownerStory(Owner.args, {
  ...pageEmptyArgs,
});

export const OverlapConflictWarning: Story = ownerStory(Owner.args, {
  ...pageOverlapConflictArgs,
}, overlapConflictWarningPlay);

export const PlanAExample: Story = ownerStory(Owner.args, {
  ...pagePlanAArgs,
}, planAExamplePlay);

export const PlanABAlternatives: Story = ownerStory(Owner.args, {
  ...pagePlanABArgs,
}, planABAlternativesPlay);

export const PathAndDurationInteractions: Story = ownerStory(Owner.args, {
  ...pagePathAndDurationArgs,
}, pathAndDurationInteractionsPlay);

export const BranchGraph: Story = ownerStory(Owner.args, {
  ...pageBranchGraphArgs,
}, branchGraphPlay);

export const RequestedPlanExample: Story = ownerStory(Owner.args, {
  ...pageRequestedPlanArgs,
}, requestedPlanExamplePlay);

export const StressPaths: Story = ownerStory(Owner.args, {
  ...pageStressPathsArgs,
}, stressPathsPlay);

export const TableOverflow: Story = viewportStoryForOwner(Owner.args, "mobile320", tableOverflowPlay, {
  ...pageTableOverflowArgs,
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
