import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import { RouteMapView } from "./RouteMapView";

const meta = {
  title: "Pages/Map",
  component: RouteMapView,
  parameters: { layout: "fullscreen" },
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
    await expect(canvas.getByRole("region", { name: /แผนที่เส้นทาง/i })).toHaveClass("route-map-panel");
    await expect(canvas.getByText("แผนที่")).toBeVisible();
    await expect(canvas.getByLabelText(/เลือกวันบนแผนที่/i)).toBeVisible();
  },
};

export const Traveler: Story = {
  args: Owner.args,
};

export const Viewer: Story = {
  args: Owner.args,
};

export const Dense: Story = {
  args: {
    ...Owner.args,
    items: buildDenseTripFixture().itineraryItems,
  },
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    items: buildEmptyTripFixture().itineraryItems,
  },
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
};
