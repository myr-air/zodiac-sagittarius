import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import { TimelineView } from "./TimelineView";

const noop = () => {};

const meta = {
  title: "Pages/Timeline",
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

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
};

export const Dense: Story = {
  args: {
    ...Owner.args,
    items: buildDenseTripFixture().itineraryItems,
    selectedItemId: "",
  },
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    items: buildEmptyTripFixture().itineraryItems,
    selectedItemId: "",
  },
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
};
