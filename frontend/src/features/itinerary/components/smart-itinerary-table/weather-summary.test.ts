import { describe, expect, it } from "vitest";
import type { TripDailyBriefing } from "@/src/trip/types";
import { buildWeatherSummary } from "./weather-summary";

describe("weather summary", () => {
  it("builds weather summary details when available", () => {
    const briefing = {
      tripId: "trip-1",
      date: "2026-06-10",
      locationKey: "hkg",
      locationLabel: "Hong Kong",
      coordinates: null,
      weather: {
        conditionCode: "sunny",
        temperatureMaxCelsius: 32,
        temperatureMinCelsius: 24,
        apparentTemperatureMaxCelsius: 33,
        apparentTemperatureMinCelsius: 25,
        precipitationSumMm: 2.5,
        precipitationHours: 1.4,
        rainChancePercent: 22,
        uvIndexMax: 9.8,
        visibilityMinMeters: 12000,
        windSpeedKph: 15.2,
        windGustsKph: 19.9,
        conditionLabel: "Sunny",
        cloudCoverMeanPercent: null,
        dewPointMeanCelsius: null,
        meta: {
          source: "test",
          sourceUrl: null,
          fetchedAt: null,
          expiresAt: null,
          confidence: "high",
          unavailableReason: null,
        },
        sunshineDurationSeconds: null,
        windDirectionDegrees: null,
        visibilityMeanMeters: null,
        daylightDurationSeconds: null,
        pressureMslMeanHpa: null,
        humidityPercent: 72,
        sunset: "18:45",
        sunrise: "05:41",
      },
      holiday: null,
      festival: null,
      facts: null,
      outfitAdvice: null,
      manualOverrides: {},
      version: 1,
      updatedAt: "2026-06-10",
    } as TripDailyBriefing;

    expect(buildWeatherSummary(briefing, "Day 1")).toMatchObject({
      weatherLabel: "Sunny 32° 24°",
    });
  });
});
