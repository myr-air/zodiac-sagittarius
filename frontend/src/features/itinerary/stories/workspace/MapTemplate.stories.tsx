import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import { RouteMapView } from "@/src/features/itinerary/components";

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
    liveMapEnabled: false,
    startDate: tripFixture.trip.startDate,
    tripName: tripFixture.trip.name,
  },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /แผนที่เส้นทาง/i })).toBeVisible();
    await expect(canvas.getByRole("region", { name: /แผนที่เส้นทาง/i })).toHaveClass("route-map-panel", "grid");
    await expect(canvas.getByLabelText(/ตัวอย่างแผนที่เส้นทางฮ่องกงและเซินเจิ้น/i)).toHaveClass("route-map-canvas", "relative");
    await expect(canvas.getByRole("button", { name: /วันที่ 2/i })).toHaveClass("map-day-filter-button", "inline-flex");
  },
};

export const Traveler: Story = { args: Owner.args };

export const Viewer: Story = { args: Owner.args };

export const Dense: Story = { args: { ...Owner.args, items: buildDenseTripFixture().itineraryItems } };

export const Empty: Story = { args: { ...Owner.args, items: buildEmptyTripFixture().itineraryItems } };
