import { getTripDates } from "./itinerary";
import type { IconName } from "@/src/components/icons";
import type { PatchDailyBriefingApiRequest } from "./api-client";
import type { DailyBriefingOverrides, ItineraryItem, Trip, TripDailyBriefing } from "./types";

export interface ThaiWeekdayTone {
  name: "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
  className: string;
  chipClassName: string;
}

const weekdayTones: ThaiWeekdayTone[] = [
  { name: "sunday", className: "text-rose-800", chipClassName: "bg-rose-100/70 text-rose-800 border-rose-200" },
  { name: "monday", className: "text-amber-900", chipClassName: "bg-amber-100/70 text-amber-900 border-amber-200" },
  { name: "tuesday", className: "text-fuchsia-800", chipClassName: "bg-fuchsia-100/70 text-fuchsia-800 border-fuchsia-200" },
  { name: "wednesday", className: "text-emerald-800", chipClassName: "bg-emerald-100/70 text-emerald-800 border-emerald-200" },
  { name: "thursday", className: "text-orange-800", chipClassName: "bg-orange-100/70 text-orange-800 border-orange-200" },
  { name: "friday", className: "text-sky-800", chipClassName: "bg-sky-100/70 text-sky-800 border-sky-200" },
  { name: "saturday", className: "text-violet-800", chipClassName: "bg-indigo-100/70 text-violet-800 border-violet-200" },
];

export function briefingsForStrip(briefings: TripDailyBriefing[]): TripDailyBriefing[] {
  return briefings.slice().sort((a, b) => a.date.localeCompare(b.date));
}

export function thaiWeekdayTone(date: string): ThaiWeekdayTone {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return weekdayTones[0];
  return weekdayTones[parsed.getDay()] ?? weekdayTones[0];
}

export function weatherGraphicLabel(conditionCode: string | null | undefined): string {
  switch (conditionCode) {
    case "clear":
    case "sunny":
      return "Sunny";
    case "partly-cloudy":
    case "cloudy":
      return "Cloudy";
    case "rain":
    case "showers":
      return "Rain";
    case "storm":
    case "thunderstorm":
      return "Storm";
    case "unavailable":
      return "Forecast pending";
    default:
      return "Weather";
  }
}

export function weatherIconForCondition(code: string | null | undefined): IconName {
  if (code === "clear" || code === "sunny") return "sun";
  if (code === "rain" || code === "showers") return "umbrella";
  if (code === "storm" || code === "thunderstorm") return "warning";
  if (code === "cloudy" || code === "partly-cloudy") return "cloud";
  if (code === "unavailable" || !code) return "cloud";
  return "cloud";
}

export function formatWeatherTemp(value: number | null | undefined): string {
  if (typeof value !== "number") return "--°";
  return `${Math.round(value)}°`;
}

export function formatSolarTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const localTime = value.match(/T(\d{2}:\d{2})/)?.[1];
  if (localTime) return localTime;
  const timeOnly = value.match(/^(\d{2}:\d{2})/)?.[1];
  return timeOnly ?? null;
}

function firstItineraryForDates(itineraryItems: ItineraryItem[]): Map<string, ItineraryItem> {
  const byDate = new Map<string, ItineraryItem>();

  for (const item of itineraryItems) {
    if (!byDate.has(item.day)) {
      byDate.set(item.day, item);
    }
  }

  return byDate;
}

function fallbackWeatherBriefing(tripId: string, date: string, locationLabel: string, locationKey: string, coordinates: TripDailyBriefing["coordinates"]): TripDailyBriefing {
  return {
    tripId,
    date,
    locationKey,
    locationLabel,
    coordinates,
    weather: {
      conditionCode: "unavailable",
      conditionLabel: "Forecast pending",
      temperatureMaxCelsius: null,
      temperatureMinCelsius: null,
      apparentTemperatureMaxCelsius: null,
      apparentTemperatureMinCelsius: null,
      sunrise: null,
      sunset: null,
      daylightDurationSeconds: null,
      sunshineDurationSeconds: null,
      uvIndexMax: null,
      precipitationSumMm: null,
      precipitationHours: null,
      rainSumMm: null,
      humidityPercent: null,
      windSpeedKph: null,
      windGustsKph: null,
      windDirectionDegrees: null,
      cloudCoverMeanPercent: null,
      visibilityMeanMeters: null,
      visibilityMinMeters: null,
      dewPointMeanCelsius: null,
      pressureMslMeanHpa: null,
      rainChancePercent: null,
      meta: {
        source: "Sagittarius",
        sourceUrl: null,
        fetchedAt: null,
        expiresAt: null,
        confidence: "unknown",
        unavailableReason: "Demo fallback",
      },
    },
    holiday: null,
    festival: null,
    facts: null,
    outfitAdvice: null,
    manualOverrides: {
      outfitAdvice: null,
      festivalNote: null,
      factsNote: null,
    },
    updatedAt: `${date}T00:00:00Z`,
    version: 1,
  };
}

export function buildFallbackBriefings(trip: Trip): TripDailyBriefing[] {
  const locationsByDate = firstItineraryForDates(trip.itineraryItems);
  const dates = getTripDates(trip.startDate, trip.endDate);

  return dates.map((date) => {
    const stop = locationsByDate.get(date);
    const fallbackKey = stop ? `itinerary:${stop.id}` : `destination:${trip.destinationLabel.toLowerCase()}`;
    const fallbackLabel = stop?.place?.trim() ? stop.place : trip.destinationLabel;
    return fallbackWeatherBriefing(trip.id, date, fallbackLabel, fallbackKey, stop?.coordinates ?? null);
  });
}

export function buildPatchDailyBriefingRequest(
  overrides: DailyBriefingOverrides,
  options: {
    clientMutationId: string;
    expectedVersion: number;
  },
): PatchDailyBriefingApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    expectedVersion: options.expectedVersion,
    ...overrides,
  };
}

export function applyDailyBriefingOverrides(
  briefings: TripDailyBriefing[],
  trip: Trip,
  date: string,
  overrides: DailyBriefingOverrides,
): TripDailyBriefing[] {
  return (briefings.length ? briefings : buildFallbackBriefings(trip)).map(
    (briefing) =>
      briefing.date === date
        ? {
            ...briefing,
            manualOverrides: { ...briefing.manualOverrides, ...overrides },
            version: briefing.version + 1,
          }
        : briefing,
  );
}
