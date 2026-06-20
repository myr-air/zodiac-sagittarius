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

const meta = {
  title: "Templates/Itinerary",
  component: SmartItineraryTable,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof SmartItineraryTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: buildOwnerStoryArgs(),
  play: ownerPlay,
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: ownerThaiPlay,
};

export const Viewer: Story = { args: { ...Owner.args, role: "viewer" } };
export const Traveler: Story = {
  args: { ...Owner.args, role: "traveler" },
  play: travelerPlay,
};
export const Dense: Story = { args: { ...Owner.args, items: denseTemplateItems } };
export const HierarchyBlocks: Story = {
  args: {
    ...Owner.args,
    items: hierarchyBlockItems,
    graphItems: hierarchyBlockItems,
    selectedItemId: "story-flight-block",
    dayPathOverrides: {},
  },
  play: hierarchyBlocksPlay,
};

export const HierarchyWarnings: Story = {
  args: {
    ...Owner.args,
    items: hierarchyWarningItems,
    selectedItemId: "story-child-under-plain-parent",
    dayPathOverrides: {},
  },
  play: hierarchyWarningsPlay,
};
export const TableOverflow: Story = {
  args: {
    ...Owner.args,
    items: buildTemplateOverflowItems(),
    graphItems: stressPathItems,
    selectedItemId: "overflow-stress-0800-main",
    showAllPaths: true,
  },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
  play: tableOverflowPlay,
};
export const BranchGraph: Story = {
  args: {
    ...Owner.args,
    items: branchGraphItems,
    graphItems: branchGraphItems,
    selectedItemId: "story-graph-main",
    showAllPaths: true,
    pathOptions: branchGraphPathOptions,
  },
  play: branchGraphPlay,
};
export const PlanAExample: Story = {
  args: {
    ...Owner.args,
    items: planAExampleItems,
    graphItems: planAExampleItems,
    selectedItemId: "story-plan-a-main-breakfast",
    showAllPaths: true,
    pathOptions: planAPathOptions,
  },
  play: planAExamplePlay,
};
export const PlanABAlternatives: Story = {
  args: {
    ...Owner.args,
    items: planABAlternativeItems,
    graphItems: planABAlternativeItems,
    selectedItemId: "story-plan-ab-main-breakfast",
    showAllPaths: true,
    pathOptions: planABPathOptions,
  },
  play: planABAlternativesPlay,
};
export const RequestedPlanExample: Story = {
  args: {
    ...Owner.args,
    items: requestedPlanExampleItems,
    graphItems: requestedPlanExampleItems,
    selectedItemId: "story-requested-main-0800",
    showAllPaths: true,
    pathOptions: planAPathOptions,
  },
  play: requestedPlanExamplePlay,
};
export const StressPaths: Story = {
  args: {
    ...Owner.args,
    items: stressPathItems,
    graphItems: stressPathItems,
    selectedItemId: "story-stress-0800-main",
    showAllPaths: true,
    pathOptions: stressPathOptions,
  },
  play: stressPathsPlay,
};
