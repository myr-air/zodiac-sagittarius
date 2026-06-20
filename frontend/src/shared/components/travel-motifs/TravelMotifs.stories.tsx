import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TimelineMotif, TravelMotif } from "./TravelMotifs";
import { routePlay } from "./TravelMotifs.stories.plays";

const meta = {
  title: "Design System/Travel Motifs",
  component: TravelMotif,
  parameters: { layout: "centered" },
  tags: ["ai-generated"],
} satisfies Meta<typeof TravelMotif>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Route: Story = {
  args: { tone: "route" },
  play: routePlay,
};
export const Sunshine: Story = { args: { tone: "sunshine" } };
export const Postcard: Story = { args: { tone: "postcard" } };

export const TimelineMoment: Story = {
  render: () => <TimelineMotif />,
};
