import {
  defaultTripOriginCity,
  tripCityOptions,
  tripCountryOptions,
  type TripCityOption,
} from "./trip-destination-options";
import {
  normalizeSearchQuery,
  textEqualsNormalizedQuery,
  valuesMatchSearchQuery,
} from "@/src/shared/text-search";
import type { TripCity } from "@/src/trip/types";

export {
  defaultTripOriginCity,
  tripCityOptions,
  tripContinentValues,
  tripCountryOptions,
  type TripCityOption,
  type TripContinent,
  type TripCountryOption,
} from "./trip-destination-options";

export interface TripDestinationCard {
  title: string;
  detail: string;
  meta: string;
  nights: string;
  countryName: string;
}

export function destinationMetaParts(meta: string): string[] {
  return meta.split(" · ").map((part) => part.trim()).filter(Boolean);
}

export function tripDestinationCards(selectedCountryNames: string[], selectedCityNames: string[] = [], locale: string = "en"): TripDestinationCard[] {
  const cards: TripDestinationCard[] = [];
  selectedCityNames.forEach((cityName, index) => {
    const cityCountryName = destinationCityCountryName(cityName);
    cards.push({ title: cityName, detail: cityCountryName ?? selectedCountryNames[0] ?? "City stop", meta: destinationCityMeta(cityName), nights: tripNightBadge(index + 2, locale), countryName: cityCountryName ?? cityName });
  });
  selectedCountryNames
    .filter((name) => !selectedCityNames.some((cityName) => cityBelongsToCountry(cityName, name)))
    .forEach((name, index) => {
      cards.push({ title: name, detail: name, meta: countryCurrencyDetail(name), nights: tripNightBadge(index + 3, locale), countryName: name });
    });
  if (cards.length) return cards.slice(0, 4);
  return [{ title: "Destination", detail: "Trip stop", meta: "", nights: tripNightBadge(3, locale), countryName: "Destination" }];
}

function destinationCityMeta(cityName: string): string {
  const normalizedCityName = normalizeSearchQuery(cityName);
  const city = tripCityOptions.find((option) =>
    textEqualsNormalizedQuery(option.city, normalizedCityName),
  );
  if (!city) return "";
  const currency = tripCountryOptions.find((country) => country.name === city.country)?.currency;
  return [city.timezone, currency].filter(Boolean).join(" · ");
}

function countryCurrencyDetail(countryName: string): string {
  const country = tripCountryOptions.find((option) => option.name === countryName);
  return country?.currency ?? "";
}

function tripNightBadge(nights: number, locale: string): string {
  return locale === "th" ? `${nights} คืน` : `${nights} nights`;
}

function destinationCityCountryName(cityName: string): string | null {
  const normalizedCityName = normalizeSearchQuery(cityName);
  return tripCountryOptions.find((country) =>
    country.cities.some((city) => textEqualsNormalizedQuery(city, normalizedCityName)),
  )?.name ?? null;
}

function cityBelongsToCountry(cityName: string, countryName: string): boolean {
  return textEqualsNormalizedQuery(
    destinationCityCountryName(cityName),
    normalizeSearchQuery(countryName),
  );
}

export function citySuggestions(query: string, selectedCities: TripCity[]): TripCityOption[] {
  const normalizedQuery = normalizeSearchQuery(query);
  return tripCityOptions
    .filter((city) => !selectedCities.some((selected) => selected.city === city.city && selected.countryCode === city.countryCode))
    .filter((city) => {
      return valuesMatchSearchQuery(
        [city.city, city.country, city.countryCode, city.airportCode],
        normalizedQuery,
      );
    })
    .slice(0, normalizedQuery ? 8 : 6);
}

export function tripCityFromOption(option: TripCityOption): TripCity {
  return {
    city: option.city,
    country: option.country,
    countryCode: option.countryCode,
    timezone: option.timezone,
    latitude: option.latitude,
    longitude: option.longitude,
  };
}

export function customTripCity(city: string, fallback?: TripCity): TripCity {
  const normalizedCity = normalizeSearchQuery(city);
  const match = tripCityOptions.find((option) =>
    textEqualsNormalizedQuery(option.city, normalizedCity),
  );
  if (match) return tripCityFromOption(match);
  return {
    city,
    country: fallback?.country ?? defaultTripOriginCity.country,
    countryCode: fallback?.countryCode ?? defaultTripOriginCity.countryCode,
    timezone: fallback?.timezone ?? defaultTripOriginCity.timezone,
    latitude: fallback?.latitude ?? defaultTripOriginCity.latitude,
    longitude: fallback?.longitude ?? defaultTripOriginCity.longitude,
  };
}

export function tripCityFromFormOrigin(form: {
  originCity: string;
  originCountry: string;
  originCountryCode: string;
}): TripCity {
  const match = tripCityOptions.find((option) => option.city === form.originCity && option.countryCode === form.originCountryCode);
  if (match) return tripCityFromOption(match);
  return {
    city: form.originCity || defaultTripOriginCity.city,
    country: form.originCountry || defaultTripOriginCity.country,
    countryCode: form.originCountryCode || defaultTripOriginCity.countryCode,
    timezone: defaultTripOriginCity.timezone,
    latitude: defaultTripOriginCity.latitude,
    longitude: defaultTripOriginCity.longitude,
  };
}

export function destinationRouteCode(destinations: string[]): string {
  const primary = destinations[destinations.length > 1 ? 1 : 0] ?? destinations[0] ?? "TRP";
  const normalizedPrimary = normalizeSearchQuery(primary);
  const city = tripCityOptions.find((option) =>
    textEqualsNormalizedQuery(option.city, normalizedPrimary),
  );
  if (city) return city.airportCode;
  const option = tripCountryOptions.find((country) =>
    country.name === primary ||
    country.cities.some((cityName) => textEqualsNormalizedQuery(cityName, normalizedPrimary)),
  );
  if (option) return option.code;
  return primary.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).padEnd(3, "X").toUpperCase();
}
