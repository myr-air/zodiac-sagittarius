import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SmartItineraryTable } from "@/src/features/itinerary/components";
import {
  buildOwnerStoryArgs,
  branchGraphPathOptions,
  planAPathOptions,
  planABPathOptions,
  stressPathOptions,
} from "./support/itinerary-story-fixtures";
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
import { buildVisiblePathStoryArgs } from "./support/itinerary-path-story-args";

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

export const OwnerThai: Story = ownerStory(Owner.args, {}, ownerThaiPlay, {
  locale: "th",
});

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
    ...buildVisiblePathStoryArgs(buildTemplateOverflowItems(), "overflow-stress-0800-main", stressPathOptions, {
      graphItems: stressPathItems,
    }),
  },
);
export const BranchGraph: Story = ownerStory(Owner.args, {
  ...buildVisiblePathStoryArgs(branchGraphItems, "story-graph-main", branchGraphPathOptions),
}, branchGraphPlay);
export const PlanAExample: Story = ownerStory(Owner.args, {
  ...buildVisiblePathStoryArgs(planAExampleItems, "story-plan-a-main-breakfast", planAPathOptions),
}, planAExamplePlay);
export const PlanABAlternatives: Story = ownerStory(Owner.args, {
  ...buildVisiblePathStoryArgs(planABAlternativeItems, "story-plan-ab-main-breakfast", planABPathOptions),
}, planABAlternativesPlay);
export const RequestedPlanExample: Story = ownerStory(Owner.args, {
  ...buildVisiblePathStoryArgs(requestedPlanExampleItems, "story-requested-main-0800", planAPathOptions),
}, requestedPlanExamplePlay);
export const StressPaths: Story = ownerStory(Owner.args, {
  ...buildVisiblePathStoryArgs(stressPathItems, "story-stress-0800-main", stressPathOptions),
}, stressPathsPlay);
