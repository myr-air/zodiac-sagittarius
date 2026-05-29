import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildEmptyTripFixture, tripFixture } from "@/src/trip/fixtures";
import { TimelineView } from "./TimelineView";

const noop = () => {};

const meta = {
  title: "Templates/Timeline",
  component: TimelineView,
  parameters: { layout: "fullscreen" },
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
};

export const Empty: Story = { args: { ...Owner.args, items: buildEmptyTripFixture().itineraryItems, selectedItemId: "" } };
