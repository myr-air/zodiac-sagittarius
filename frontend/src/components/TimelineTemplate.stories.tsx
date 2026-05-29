import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { buildEmptyTripFixture, tripFixture } from "@/src/demo/trip-fixtures";
import { TimelineView } from "./TimelineView";

const noop = () => {};

const meta = {
  title: "Templates/Timeline",
  component: TimelineView,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof TimelineView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    contextRailOpen: false,
    endDate: tripFixture.trip.endDate,
    items: tripFixture.planItems,
    selectedItemId: "item-dimdim",
    startDate: tripFixture.trip.startDate,
    tripName: tripFixture.trip.name,
    onSelectItem: noop,
    onToggleContextRail: noop,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /Dim Dim Sum/i })).toHaveAttribute("aria-pressed", "true");
  },
};

export const Empty: Story = { args: { ...Owner.args, items: buildEmptyTripFixture().itineraryItems, selectedItemId: "" } };
