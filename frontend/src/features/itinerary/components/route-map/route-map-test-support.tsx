import { I18nProvider } from "@/src/i18n/I18nProvider";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { getTripDates } from "@/src/trip/itinerary";

export const tripDates = getTripDates(tripFixture.trip.startDate, tripFixture.trip.endDate);
export const hongKongDay = tripDates[1] ?? tripFixture.trip.startDate;

export const renderWithThaiI18n = (ui: Parameters<typeof renderWithI18n>[0]) => {
  const result = renderWithI18n(ui, { locale: "th" });
  const originalRerender = result.rerender;

  return {
    ...result,
    rerender: (nextUi: Parameters<typeof renderWithI18n>[0]) =>
      originalRerender(<I18nProvider initialLocale="th">{nextUi}</I18nProvider>),
  };
};

export function hasValidCoordinates(item: { coordinates?: { lat: number; lng: number } }) {
  return Boolean(
    item.coordinates
      && Number.isFinite(item.coordinates.lat)
      && Number.isFinite(item.coordinates.lng)
      && item.coordinates.lat >= -90
      && item.coordinates.lat <= 90
      && item.coordinates.lng >= -180
      && item.coordinates.lng <= 180,
  );
}
