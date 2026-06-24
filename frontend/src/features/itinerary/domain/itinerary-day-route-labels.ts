import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem } from "@/src/trip/types";

export function dayRouteLabel(
  day: string,
  locale: Locale = "en",
  items: Pick<ItineraryItem, "place">[] = [],
): string {
  const travelPlace = items
    .map((item) => normalizedRoutePlace(item.place))
    .find((place) => place.includes("->"));
  if (travelPlace) return travelPlace;

  const places = uniquePlaces(items);
  if (places.length >= 2) return `${places[0]} -> ${places[places.length - 1]}`;
  if (places.length === 1) return places[0];

  void day;
  return locale === "th" ? "วันในทริป" : "Trip day";
}

function uniquePlaces(items: Pick<ItineraryItem, "place">[]): string[] {
  const places: string[] = [];
  for (const item of items) {
    const place = normalizedRoutePlace(item.place);
    if (place && places[places.length - 1] !== place) {
      places.push(place);
    }
  }
  return places;
}

function normalizedRoutePlace(value: string): string {
  return value.trim().replace(/\s*(?:→|->)\s*/g, " -> ");
}
