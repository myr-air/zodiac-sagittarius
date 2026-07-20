/**
 * Hometown city suggestions via Open-Meteo geocoding (client-side; no backend).
 */

import type { HometownSuggestion } from "./account-settings-form";

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

export type HometownGeocodeDeps = {
  fetch: typeof globalThis.fetch;
};

type OpenMeteoResult = {
  name?: string;
  country?: string;
};

type OpenMeteoResponse = {
  results?: OpenMeteoResult[];
};

/** Search Open-Meteo geocoding for up to 5 city/country suggestions. */
export async function searchHometownSuggestions(
  query: string,
  deps: HometownGeocodeDeps,
): Promise<HometownSuggestion[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const url = new URL(GEOCODE_URL);
  url.searchParams.set("name", q);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  let response: Response;
  try {
    response = await deps.fetch(url.toString());
  } catch {
    return [];
  }
  if (!response.ok) return [];

  let body: OpenMeteoResponse;
  try {
    body = (await response.json()) as OpenMeteoResponse;
  } catch {
    return [];
  }

  const results = body.results ?? [];
  const suggestions: HometownSuggestion[] = [];
  for (const entry of results) {
    const city = entry.name?.trim() ?? "";
    const country = entry.country?.trim() ?? "";
    if (!city || !country) continue;
    suggestions.push({ city, country });
  }
  return suggestions;
}
