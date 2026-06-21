import { tripFixture } from "@/src/trip/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import { renderWithThaiI18n, routeMapItems } from "./route-map-test-support";
import { RouteMapView } from "../RouteMapView";

type RouteMapViewProps = Parameters<typeof RouteMapView>[0];

export function renderLiveRouteMap(
  props: Partial<RouteMapViewProps> & { items?: ItineraryItem[] } = {},
) {
  return renderWithThaiI18n(
    <RouteMapView
      endDate={tripFixture.trip.endDate}
      items={routeMapItems}
      liveMapEnabled
      startDate={tripFixture.trip.startDate}
      tripName={tripFixture.trip.name}
      {...props}
    />,
  );
}
