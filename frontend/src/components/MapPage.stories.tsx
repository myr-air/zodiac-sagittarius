import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import { RouteMapView } from "./RouteMapView";

const meta = {
  title: "Pages/Map",
  component: RouteMapView,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RouteMapView>;

export default meta;

type Story = StoryObj<typeof meta>;

const mapPlanABAlternativeItems: ItineraryItem[] = [
  ["map-plan-ab-main-breakfast", "08:00", 60, 100, "Harbour breakfast", "Main", undefined, "main"],
  ["map-plan-ab-a-gallery", "10:00", 75, 200, "Plan A gallery route", "Plan A", "path-2026-06-19-sub-a", "alternative"],
  ["map-plan-ab-b-harbour", "14:00", 90, 300, "Plan B harbour route", "Plan B", "path-2026-06-19-sub-b", "alternative"],
  ["map-plan-ab-main-dinner", "18:00", 75, 400, "Main dinner meet-up", "Main", undefined, "main"],
].map(([id, startTime, durationMinutes, sortOrder, activity, pathName, pathId, pathRole], index) => ({
  ...tripFixture.planItems[index % tripFixture.planItems.length],
  id: id as string,
  day: "2026-06-19",
  startTime: startTime as string,
  durationMinutes: durationMinutes as number,
  sortOrder: sortOrder as number,
  activity: activity as string,
  activityType: "experience",
  place: `${pathName} checkpoint`,
  pathGroupId: "map-plan-ab-clean-branch",
  pathId: pathId as string | undefined,
  pathName: pathId ? pathName as string : undefined,
  pathRole: pathRole as ItineraryItem["pathRole"],
}));
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
