import type { PatchDailyBriefingApiRequest } from "../api-client";
import { getTripDates } from "../itinerary";
import type { DailyBriefingOverrides, ItineraryItem, Trip, TripDailyBriefing } from "../types";
export {
  briefingsForStrip,
  formatSolarTime,
  formatWeatherTemp,
  thaiWeekdayTone,
  weatherGraphicLabel,
  weatherIconForCondition,
} from "./weather-briefing-display";
export type { ThaiWeekdayTone } from "./weather-briefing-display";

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
