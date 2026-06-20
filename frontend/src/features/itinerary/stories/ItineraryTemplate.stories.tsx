import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SmartItineraryTable } from "@/src/features/itinerary/components";
import {
  buildOwnerStoryArgs,
  branchGraphPathOptions,
  planAPathOptions,
  planABPathOptions,
  stressPathOptions,
} from "./itinerary-story-fixtures";
import {
  branchGraphItems,
  buildTemplateOverflowItems,
  denseTemplateItems,
  hierarchyBlockItems,
  hierarchyWarningItems,
  planABAlternativeItems,
  planAExampleItems,
  requestedPlanExampleItems,
  stressPathItems,
} from "./ItineraryTemplate.stories.support";
import {
  branchGraphPlay,
  hierarchyBlocksPlay,
  hierarchyWarningsPlay,
  ownerPlay,
  ownerThaiPlay,
  planABAlternativesPlay,
  planAExamplePlay,
  requestedPlanExamplePlay,
  stressPathsPlay,
  tableOverflowPlay,
  travelerPlay,
} from "./ItineraryTemplate.stories.plays";
import {
  ownerArgsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";

const meta = {
  title: "Templates/Itinerary",
  component: SmartItineraryTable,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof SmartItineraryTable>;

export default meta;

type Story = StoryObj<typeof meta>;
const ownerStory = ownerArgsStory<Story>;
const viewportStoryForOwner = viewportStory<Story>;

export const Owner: Story = {
  args: buildOwnerStoryArgs(),
  play: ownerPlay,
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: ownerThaiPlay,
};

export const Viewer: Story = ownerStory(Owner.args, { role: "viewer" });
export const Traveler: Story = ownerStory(Owner.args, { role: "traveler" }, travelerPlay);
export const Dense: Story = ownerStory(Owner.args, { items: denseTemplateItems });
export const HierarchyBlocks: Story = ownerStory(Owner.args, {
  items: hierarchyBlockItems,
  graphItems: hierarchyBlockItems,
  selectedItemId: "story-flight-block",
  dayPathOverrides: {},
}, hierarchyBlocksPlay);

export const HierarchyWarnings: Story = ownerStory(Owner.args, {
  items: hierarchyWarningItems,
  selectedItemId: "story-child-under-plain-parent",
  dayPathOverrides: {},
}, hierarchyWarningsPlay);
export const TableOverflow: Story = viewportStoryForOwner(
  Owner.args,
  "mobile320",
  tableOverflowPlay,
  {
    items: buildTemplateOverflowItems(),
    graphItems: stressPathItems,
    selectedItemId: "overflow-stress-0800-main",
    showAllPaths: true,
  },
);
export const BranchGraph: Story = ownerStory(Owner.args, {
  items: branchGraphItems,
  graphItems: branchGraphItems,
  selectedItemId: "story-graph-main",
  showAllPaths: true,
  pathOptions: branchGraphPathOptions,
}, branchGraphPlay);
export const PlanAExample: Story = ownerStory(Owner.args, {
  items: planAExampleItems,
  graphItems: planAExampleItems,
  selectedItemId: "story-plan-a-main-breakfast",
  showAllPaths: true,
  pathOptions: planAPathOptions,
}, planAExamplePlay);
export const PlanABAlternatives: Story = ownerStory(Owner.args, {
  items: planABAlternativeItems,
  graphItems: planABAlternativeItems,
  selectedItemId: "story-plan-ab-main-breakfast",
  showAllPaths: true,
  pathOptions: planABPathOptions,
}, planABAlternativesPlay);
export const RequestedPlanExample: Story = ownerStory(Owner.args, {
  items: requestedPlanExampleItems,
  graphItems: requestedPlanExampleItems,
  selectedItemId: "story-requested-main-0800",
  showAllPaths: true,
  pathOptions: planAPathOptions,
}, requestedPlanExamplePlay);
export const StressPaths: Story = ownerStory(Owner.args, {
  items: stressPathItems,
  graphItems: stressPathItems,
  selectedItemId: "story-stress-0800-main",
  showAllPaths: true,
  pathOptions: stressPathOptions,
}, stressPathsPlay);
