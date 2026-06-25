import {
  tripCityOptions,
  tripCountryOptions,
  type TripCityOption,
} from "@/src/trip/metadata";
import type { Trip } from "@/src/trip/types";

export type PlaceSuggestionKind =
  | "airport"
  | "landmark"
  | "place"
  | "station"
  | "transit";

export interface PlaceSuggestion {
  kind: PlaceSuggestionKind;
  label: string;
  value: string;
}

const knownCitySuggestions: Record<string, Array<Omit<PlaceSuggestion, "label">>> = {
  Bangkok: [
    { kind: "airport", value: "BKK Suvarnabhumi Airport" },
    { kind: "airport", value: "Don Mueang Airport Bangkok" },
    { kind: "station", value: "Krung Thep Aphiwat Central Terminal" },
    { kind: "transit", value: "Phaya Thai Airport Rail Link" },
    { kind: "place", value: "Siam Bangkok" },
    { kind: "landmark", value: "The Grand Palace Bangkok" },
    { kind: "landmark", value: "Wat Arun Bangkok" },
  ],
  "Hong Kong": [
    { kind: "airport", value: "HKG Hong Kong International Airport" },
    { kind: "transit", value: "Airport Express Hong Kong Station" },
    { kind: "station", value: "Hong Kong West Kowloon Station" },
    { kind: "place", value: "Central Hong Kong" },
    { kind: "place", value: "Tsim Sha Tsui Hong Kong" },
    { kind: "landmark", value: "Victoria Peak Hong Kong" },
    { kind: "landmark", value: "Hong Kong Disneyland" },
  ],
  Shenzhen: [
    { kind: "airport", value: "SZX Shenzhen Bao'an International Airport" },
    { kind: "station", value: "Shenzhen North Railway Station" },
    { kind: "station", value: "Futian Station Shenzhen" },
    { kind: "place", value: "Civic Center Shenzhen" },
    { kind: "landmark", value: "MOCAPE Shenzhen" },
    { kind: "landmark", value: "Window of the World Shenzhen" },
  ],
};

export function placeAutocompleteSuggestions(
  trip: Pick<
    Trip,
    | "countries"
    | "destinationCities"
    | "destinationLabel"
    | "originCity"
    | "originCountryCode"
  >,
  query = "",
): PlaceSuggestion[] {
  const queryTokens = normalizedTokens(query);
  const suggestions = scopedTripCities(trip).flatMap(citySuggestions);
  const filtered = queryTokens.length
    ? suggestions.filter((suggestion) =>
        queryTokens.every((token) =>
          normalizedSearchText(suggestion.value).includes(token),
        ),
      )
    : suggestions;

  return uniqueSuggestions(filtered).slice(0, 24);
}

function scopedTripCities(
  trip: Pick<
    Trip,
    | "countries"
    | "destinationCities"
    | "destinationLabel"
    | "originCity"
    | "originCountryCode"
  >,
): TripCityOption[] {
  const scoped = [
    ...cityOptionsFromTripCities(trip.destinationCities ?? []),
    ...cityOptionsFromOrigin(trip),
    ...cityOptionsFromDestinationLabel(trip.destinationLabel),
  ];
  const explicitCities = uniqueCityOptions(scoped);
  if (explicitCities.length > 0) return explicitCities;

  const countryNames = new Set((trip.countries ?? []).map(normalizedSearchText));
  const countryCodes = new Set(
    (trip.countries ?? []).map((country) => country.trim().toUpperCase()),
  );
  const fallbackCityNames = new Set(
    tripCountryOptions
      .filter(
        (country) =>
          countryNames.has(normalizedSearchText(country.name)) ||
          countryCodes.has(country.code),
      )
      .flatMap((country) => country.cities),
  );
  return uniqueCityOptions(
    tripCityOptions.filter((city) => fallbackCityNames.has(city.city)),
  );
}

function citySuggestions(city: TripCityOption): PlaceSuggestion[] {
  const cityLabel = `${city.city}, ${city.country}`;
  const baseSuggestions: Array<Omit<PlaceSuggestion, "label">> = [
    { kind: "airport", value: `${city.airportCode} ${city.city} Airport` },
    { kind: "station", value: `${city.city} Station` },
    { kind: "transit", value: `${city.city} Transit Center` },
    { kind: "place", value: `${city.city} city center` },
    { kind: "landmark", value: `${city.city} landmark` },
  ];
  return [...(knownCitySuggestions[city.city] ?? []), ...baseSuggestions].map(
    (suggestion) => ({
      ...suggestion,
      label: `${kindLabel(suggestion.kind)} · ${cityLabel}`,
    }),
  );
}

function cityOptionsFromTripCities(
  cities: NonNullable<Trip["destinationCities"]>,
): TripCityOption[] {
  return cities
    .map((city) =>
      tripCityOptions.find(
        (option) =>
          normalizedSearchText(option.city) === normalizedSearchText(city.city) &&
          option.countryCode === city.countryCode,
      ),
    )
    .filter((city): city is TripCityOption => Boolean(city));
}

function cityOptionsFromOrigin(
  trip: Pick<Trip, "originCity" | "originCountryCode">,
): TripCityOption[] {
  if (!trip.originCity) return [];
  return tripCityOptions.filter(
    (city) =>
      normalizedSearchText(city.city) === normalizedSearchText(trip.originCity) &&
      (!trip.originCountryCode || city.countryCode === trip.originCountryCode),
  );
}

function cityOptionsFromDestinationLabel(destinationLabel: string): TripCityOption[] {
  const label = normalizedSearchText(destinationLabel);
  if (!label) return [];
  return tripCityOptions.filter((city) =>
    label.includes(normalizedSearchText(city.city)),
  );
}

function uniqueCityOptions(cities: TripCityOption[]): TripCityOption[] {
  const seen = new Set<string>();
  return cities.filter((city) => {
    const key = `${city.city}:${city.countryCode}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueSuggestions(suggestions: PlaceSuggestion[]): PlaceSuggestion[] {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const key = normalizedSearchText(suggestion.value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function kindLabel(kind: PlaceSuggestionKind): string {
  if (kind === "airport") return "Airport";
  if (kind === "station") return "Train station";
  if (kind === "transit") return "Transit";
  if (kind === "landmark") return "Landmark";
  return "Place";
}

function normalizedTokens(value: string): string[] {
  return normalizedSearchText(value).split(" ").filter(Boolean);
}

function normalizedSearchText(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}
