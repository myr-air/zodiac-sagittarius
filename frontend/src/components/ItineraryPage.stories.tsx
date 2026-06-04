import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { SmartItineraryTable } from "./SmartItineraryTable";

const noop = () => {};

const meta = {
  title: "Pages/Itinerary",
  component: SmartItineraryTable,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SmartItineraryTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    canRedo: false,
    canUndo: false,
    contextRailOpen: false,
    endDate: tripFixture.trip.endDate,
    items: tripFixture.planItems,
    role: "owner",
    startDate: tripFixture.trip.startDate,
    selectedItemId: "item-dimdim",
    tripName: tripFixture.trip.name,
    onAddStop: noop,
    onSelectItem: noop,
    onMoveItem: noop,
    onRedo: noop,
    onToggleContextRail: noop,
    onUndo: noop,
  },
};
