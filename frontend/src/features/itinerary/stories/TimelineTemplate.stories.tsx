import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TimelineView } from "@/src/features/itinerary/components";
import {
  denseTimelineItems,
  emptyTimelineItems,
  timelineOwnerStoryArgs,
} from "./TimelinePage.stories.support";
import { ownerPlay, ownerThaiPlay } from "./TimelineTemplate.stories.plays";
import { ownerArgsStory } from "@/src/shared/storybook/story-builders";

const meta = {
  title: "Templates/Timeline",
  component: TimelineView,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof TimelineView>;

export default meta;

type Story = StoryObj<typeof meta>;
const ownerStory = ownerArgsStory<Story>;

export const Owner: Story = {
  args: timelineOwnerStoryArgs,
  play: ownerPlay,
};

export const OwnerThai: Story = ownerStory(Owner.args, {}, ownerThaiPlay, {
  locale: "th",
});

export const Traveler: Story = ownerStory(Owner.args, {}, Owner.play);

export const Viewer: Story = ownerStory(Owner.args, {}, Owner.play);

export const Dense: Story = ownerStory(Owner.args, {
  items: denseTimelineItems,
  selectedItemId: "",
});

export const Empty: Story = ownerStory(Owner.args, {
  items: emptyTimelineItems,
  selectedItemId: "",
});
