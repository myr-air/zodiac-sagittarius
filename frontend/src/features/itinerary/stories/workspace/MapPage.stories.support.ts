import { expect } from "storybook/test";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import type { RouteMapView } from "@/src/features/itinerary/components";
import { planABAlternativeItemsBase, withStoryPrefix } from "../itinerary-story-fixtures";

type MapPageStoryArgs = Parameters<typeof RouteMapView>[0];

export const mapOwnerStoryArgs = {
  endDate: tripFixture.trip.endDate,
  items: tripFixture.planItems,
  liveMapEnabled: false,
  startDate: tripFixture.trip.startDate,
  tripName: tripFixture.trip.name,
} satisfies MapPageStoryArgs;

export const denseMapItems = buildDenseTripFixture().itineraryItems;
export const emptyMapItems = buildEmptyTripFixture().itineraryItems;
export const mapPlanABAlternativeItems = withStoryPrefix(planABAlternativeItemsBase, "map");
export const mapStopsWithoutCoordinatesItems: ItineraryItem[] = [
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

export async function expectMapResponsiveContract(canvasElement: HTMLElement) {
  await expect(canvasElement.querySelector(".route-map-panel")).toHaveClass("route-map-panel", "grid");
  await expect(canvasElement.querySelector(".route-map-layout")).toHaveClass("route-map-layout", "max-[1199px]:border-0", "max-[1199px]:p-0");
  await expect(canvasElement.querySelector(".route-map-canvas")).toHaveClass("route-map-canvas", "max-[1199px]:min-h-[calc(100dvh-168px)]", "max-[767px]:h-[calc(100dvh-48px)]");
  await expect(canvasElement.querySelector(".route-stop-list")).toHaveClass("route-stop-list", "max-[767px]:hidden");
}
