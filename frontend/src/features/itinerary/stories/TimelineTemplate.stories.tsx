import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TimelineView } from "@/src/features/itinerary/components";
import {
  denseTimelineItems,
  emptyTimelineItems,
  timelineOwnerStoryArgs,
} from "./TimelinePage.stories.support";
import { ownerPlay, ownerThaiPlay } from "./TimelineTemplate.stories.plays";

const meta = {
  title: "Templates/Timeline",
  component: TimelineView,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof TimelineView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: timelineOwnerStoryArgs,
  play: ownerPlay,
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: ownerThaiPlay,
};

export const Traveler: Story = {
  args: Owner.args,
  play: Owner.play,
};

export const Viewer: Story = {
  args: Owner.args,
  play: Owner.play,
};

export const Dense: Story = {
  args: {
    ...Owner.args,
    items: denseTimelineItems,
    selectedItemId: "",
  },
};

export const Empty: Story = { args: { ...Owner.args, items: emptyTimelineItems, selectedItemId: "" } };
