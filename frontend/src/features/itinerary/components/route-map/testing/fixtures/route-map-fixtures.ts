import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import { getTripDates } from "@/src/trip/itinerary-core";
import type { ItineraryItem } from "@/src/trip/types";

export const tripDates = getTripDates(tripFixture.trip.startDate, tripFixture.trip.endDate);
export const hongKongDay = tripDates[1] ?? tripFixture.trip.startDate;
export const routeMapItems = tripFixture.planItems;

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

export function routeMapCoordinateItems() {
  return routeMapItems.filter(hasValidCoordinates);
}

export function routeMapCoordinateItemEastOf(longitude: number): ItineraryItem {
  const item = routeMapItems.find(
    (candidate) =>
      hasValidCoordinates(candidate) &&
      candidate.coordinates !== undefined &&
      candidate.coordinates.lng > longitude,
  );
  if (!item) {
    throw new Error(`Missing route map coordinate fixture east of ${longitude}`);
  }
  return item;
}

export function routeMapDayCoordinateItems(day = hongKongDay, limit?: number) {
  const items = routeMapItems.filter((item) => item.day === day && hasValidCoordinates(item));
  return typeof limit === "number" ? items.slice(0, limit) : items;
}

export function routeMapUnresolvedItems(limit: number) {
  return routeMapItems
    .slice(0, limit)
    .map((item): ItineraryItem => ({ ...item, coordinates: undefined }));
}
