import { I18nProvider } from "@/src/i18n/I18nProvider";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import type { RouteMapViewProps } from "@/src/features/itinerary/components";
import { RouteMapView } from "../../RouteMapView";
import { routeMapItems } from "../fixtures/route-map-fixtures";

export const renderWithThaiI18n = (ui: Parameters<typeof renderWithI18n>[0]) => {
  const result = renderWithI18n(ui, { locale: "th" });
  const originalRerender = result.rerender;

  return {
    ...result,
    rerender: (nextUi: Parameters<typeof renderWithI18n>[0]) =>
      originalRerender(<I18nProvider initialLocale="th">{nextUi}</I18nProvider>),
  };
};

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
