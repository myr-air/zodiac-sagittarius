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

export const LiveMapLoading: Story = {
  args: {
    ...Owner.args,
    liveMapAvailability: "loading",
    liveMapEnabled: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/Map preview.*Hong Kong and Shenzhen/i)).toHaveAttribute("data-live-map-state", "loading");
    await expect(canvas.getByText(/Loading map from OpenFreeMap/i)).toHaveClass("route-map-status");
    await expect(canvas.getByText("Hong Kong")).toBeVisible();
  },
};

export const LiveMapFailure: Story = {
  args: {
    ...Owner.args,
    liveMapAvailability: "error",
    liveMapEnabled: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/Map preview.*Hong Kong and Shenzhen/i)).toHaveAttribute("data-live-map-state", "error");
    await expect(canvas.getByRole("status")).toHaveTextContent(/Could not load the live map/i);
    await expect(canvas.queryByRole("button", { name: /Retry live map/i })).toBeNull();
    await expect(canvas.getByText(/OpenFreeMap/i)).toHaveClass("map-source-note");
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
