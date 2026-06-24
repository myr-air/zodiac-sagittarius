import { expectStoryElementClasses } from "@/src/shared/storybook/story-assertions";
import {
  buildTripFixtureItineraryItem,
  tripFixture,
} from "@/src/trip/testing/fixtures/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import type { RouteMapViewProps } from "@/src/features/itinerary/components";
import {
  denseTripFixture,
  emptyTripFixture,
  planABAlternativeItemsBase,
  withStoryPrefix,
} from "../support/itinerary-story-fixtures";

type MapPageStoryArgs = RouteMapViewProps;

export const mapOwnerStoryArgs = {
  endDate: tripFixture.trip.endDate,
  items: tripFixture.planItems,
  liveMapEnabled: false,
  startDate: tripFixture.trip.startDate,
  tripName: tripFixture.trip.name,
} satisfies MapPageStoryArgs;

export const denseMapItems = denseTripFixture.itineraryItems;
export const emptyMapItems = emptyTripFixture.itineraryItems;
export const mapPlanABAlternativeItems = withStoryPrefix(planABAlternativeItemsBase, "map");
export const mapStopsWithoutCoordinatesItems: ItineraryItem[] = [
  buildTripFixtureItineraryItem({
    id: "map-unresolved-dinner",
    activity: "Unresolved dinner venue",
    place: "Confirm after local friend replies",
    coordinates: undefined,
  }),
  buildTripFixtureItineraryItem({
    id: "map-resolved-fallback-stop",
    activity: "Resolved harbour checkpoint",
    coordinates: { lat: 22.2939, lng: 114.1698 },
  }),
];

export async function expectMapResponsiveContract(canvasElement: HTMLElement) {
  await expectStoryElementClasses(canvasElement, ".route-map-panel", "route-map-panel", "grid");
  await expectStoryElementClasses(canvasElement, ".route-map-layout", "route-map-layout", "max-[1199px]:border-0", "max-[1199px]:p-0");
  await expectStoryElementClasses(canvasElement, ".route-map-canvas", "route-map-canvas", "max-[1199px]:min-h-[calc(100dvh-168px)]", "max-[767px]:h-[calc(100dvh-48px)]");
  await expectStoryElementClasses(canvasElement, ".route-stop-list", "route-stop-list", "max-[767px]:hidden");
}
