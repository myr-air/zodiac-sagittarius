import type { TripDailyBriefing } from "@/src/trip/types";

export const weatherBriefings: TripDailyBriefing[] = [
  briefing("2026-07-11", "cloudy", "Cloudy", 31, 27),
  briefing("2026-07-12", "rain", "Rain", 33, 28),
  briefing("2026-07-13", "sunny", "Sunny", 34, 29),
  briefing("2026-07-14", "storm", "Storm", 30, 26),
  briefing("2026-07-15", "partly-cloudy", "Partly cloudy", 32, 28),
  briefing("2026-07-16", "unavailable", "Forecast pending", null, null),
];

function briefing(date: string, conditionCode: string, conditionLabel: string, high: number | null, low: number | null): TripDailyBriefing {
  return {
    tripId: "trip-1",
    date,
    locationKey: "destination:hong-kong",
    locationLabel: "Hong Kong",
    coordinates: null,
    weather: {
      conditionCode,
      conditionLabel,
      temperatureMaxCelsius: high,
      temperatureMinCelsius: low,
      humidityPercent: 78,
      windSpeedKph: 14,
      rainChancePercent: conditionCode === "rain" ? 64 : 20,
      meta: {
        source: "Open-Meteo",
        sourceUrl: null,
        fetchedAt: "2026-06-04T00:00:00Z",
        expiresAt: "2026-06-04T06:00:00Z",
        confidence: high === null ? "unknown" : "high",
        unavailableReason: high === null ? "Outside forecast window" : null,
      },
    },
    holiday: null,
    festival: null,
    facts: null,
    outfitAdvice: null,
    manualOverrides: {},
    updatedAt: "2026-06-04T00:00:00Z",
    version: 1,
  };
}
