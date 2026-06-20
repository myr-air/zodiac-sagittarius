import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TimelineMotif, TravelMotif, travelMotifToneValues } from "./TravelMotifs";
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

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      {travelMotifToneValues.map((tone) => (
        <TravelMotif key={tone} tone={tone} />
      ))}
    </div>
  ),
};

export const TimelineMoment: Story = {
  render: () => <TimelineMotif />,
};
