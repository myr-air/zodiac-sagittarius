import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { TimelineMotif, TravelMotif } from "./motifs";

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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".travel-motif--route")).toHaveAttribute("aria-hidden", "true");
  },
};
export const Sunshine: Story = { args: { tone: "sunshine" } };
export const Postcard: Story = { args: { tone: "postcard" } };

export const TimelineMoment: Story = {
  render: () => <TimelineMotif />,
};
