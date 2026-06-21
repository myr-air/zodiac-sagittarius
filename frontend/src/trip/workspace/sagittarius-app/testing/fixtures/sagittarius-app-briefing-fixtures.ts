import type { TripDailyBriefing } from "@/src/trip/types";

export function dailyBriefingFixture(
  tripId: string,
  date: string,
): TripDailyBriefing {
  return {
    tripId,
    date,
    locationKey: "destination:hong-kong",
    locationLabel: "Hong Kong",
    coordinates: null,
    weather: {
      conditionCode: "rain",
      conditionLabel: "Rain",
      temperatureMaxCelsius: 33,
      temperatureMinCelsius: 28,
      sunrise: `${date}T05:46`,
      sunset: `${date}T18:47`,
      humidityPercent: 82,
      windSpeedKph: 16,
      rainChancePercent: 64,
      meta: {
        source: "Open-Meteo",
        sourceUrl: null,
        fetchedAt: "2026-06-04T00:00:00Z",
        expiresAt: "2026-06-04T06:00:00Z",
        confidence: "high",
        unavailableReason: null,
      },
    },
    holiday: null,
    festival: null,
    facts: null,
    outfitAdvice: {
      title: "Outfit advice",
      body: "Light shirt and compact umbrella.",
      meta: {
        source: "Sagittarius",
        sourceUrl: null,
        fetchedAt: null,
        expiresAt: null,
        confidence: "medium",
        unavailableReason: null,
      },
    },
    manualOverrides: {},
    updatedAt: "2026-06-04T00:00:00Z",
    version: 1,
  };
}
