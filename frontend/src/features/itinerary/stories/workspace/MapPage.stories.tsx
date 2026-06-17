import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import { RouteMapView } from "@/src/features/itinerary/components";
import { planABAlternativeItemsBase, withStoryPrefix } from "../itinerary-story-fixtures";

const meta = {
  title: "Pages/Map",
  component: RouteMapView,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RouteMapView>;

export default meta;

type Story = StoryObj<typeof meta>;

async function expectMapResponsiveContract(canvasElement: HTMLElement) {
  await expect(canvasElement.querySelector(".route-map-panel")).toHaveClass("route-map-panel", "grid");
  await expect(canvasElement.querySelector(".route-map-layout")).toHaveClass("route-map-layout", "max-[767px]:border-0", "max-[767px]:p-0");
  await expect(canvasElement.querySelector(".route-map-canvas")).toHaveClass("route-map-canvas", "max-[767px]:h-[min(68dvh,620px)]", "max-[767px]:min-h-[440px]");
  await expect(canvasElement.querySelector(".route-stop-list")).toHaveClass("route-stop-list", "max-[767px]:hidden");
}

const mapPlanABAlternativeItems = withStoryPrefix(planABAlternativeItemsBase, "map");
const mapStopsWithoutCoordinatesItems: ItineraryItem[] = [
  {
    ...tripFixture.planItems[0],
    id: "map-unresolved-dinner",
    activity: "Unresolved dinner venue",
    place: "Confirm after local friend replies",
    coordinates: undefined,
  },
  {
    ...tripFixture.planItems[1],
    id: "map-resolved-fallback-stop",
    activity: "Resolved harbour checkpoint",
    coordinates: { lat: 22.2939, lng: 114.1698 },
  },
];

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

export const PlanABAlternatives: Story = {
  args: {
    ...Owner.args,
    items: mapPlanABAlternativeItems,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Route map/i })).toHaveClass("route-map-panel");
    await expect(canvas.getByText("Plan A gallery route")).toBeVisible();
    await expect(canvas.getByText("Plan B harbour route")).toBeVisible();
  },
};

export const StopsWithoutCoordinates: Story = {
  args: {
    ...Owner.args,
    items: mapStopsWithoutCoordinatesItems,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Route map/i })).toHaveClass("route-map-panel");
    await expect(canvas.getByLabelText(/Activities without coordinates/i)).toBeVisible();
    await expect(canvas.getByText(/1 activities need coordinates/i)).toBeVisible();
    await expect(canvas.getByText("Unresolved dinner venue")).toBeVisible();
  },
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvasElement }) => {
    await expectMapResponsiveContract(canvasElement);
  },
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: async ({ canvasElement }) => {
    await expectMapResponsiveContract(canvasElement);
  },
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: async ({ canvasElement }) => {
    await expectMapResponsiveContract(canvasElement);
  },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvasElement }) => {
    await expectMapResponsiveContract(canvasElement);
  },
};
