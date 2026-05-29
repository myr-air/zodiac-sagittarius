import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildDenseTripFixture, tripFixture } from "@/src/trip/fixtures";
import { RouteMapView } from "./RouteMapView";

const meta = {
  title: "Templates/Map",
  component: RouteMapView,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof RouteMapView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    endDate: tripFixture.trip.endDate,
    items: tripFixture.planItems,
    startDate: tripFixture.trip.startDate,
    tripName: tripFixture.trip.name,
  },
};

export const Dense: Story = { args: { ...Owner.args, items: buildDenseTripFixture().itineraryItems } };
