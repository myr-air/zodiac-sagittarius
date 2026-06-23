import { describe, expect, it } from "vitest";
import type { TripDailyBriefing } from "@/src/trip/types";
import {
  buildWeatherChipDisplay,
  buildWeatherSummary,
} from "../weather-summary";

describe("weather summary", () => {
  it("builds weather summary details when available", () => {
    const briefing = weatherBriefing({
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
    });

    expect(buildWeatherSummary(briefing, "Day 1")).toMatchObject({
      weatherLabel: "Sunny 32° 24°",
    });
    expect(buildWeatherChipDisplay(briefing)).toMatchObject({
      condition: "Sunny",
      hasCondition: true,
      hasForecastTemps: true,
      hasSolarTimes: true,
      highLabel: "32°",
      lowLabel: "24°",
      sunrise: "05:41",
      sunset: "18:45",
      tooltip: expect.stringContaining("Rain 22% · 2.5 mm · 1.4h"),
    });
  });

  it("builds solar-only chip display while hiding unavailable weather", () => {
    const briefing = weatherBriefing({
      conditionCode: "unavailable",
      temperatureMaxCelsius: null,
      temperatureMinCelsius: null,
      apparentTemperatureMaxCelsius: null,
      apparentTemperatureMinCelsius: null,
      precipitationSumMm: null,
      precipitationHours: null,
      rainChancePercent: null,
      uvIndexMax: null,
      visibilityMinMeters: null,
      windSpeedKph: null,
      windGustsKph: null,
      conditionLabel: "Forecast pending",
      cloudCoverMeanPercent: null,
      dewPointMeanCelsius: null,
      meta: {
        source: "test",
        sourceUrl: null,
        fetchedAt: null,
        expiresAt: null,
        confidence: "low",
        unavailableReason: null,
      },
      sunshineDurationSeconds: null,
      windDirectionDegrees: null,
      visibilityMeanMeters: null,
      daylightDurationSeconds: null,
      pressureMslMeanHpa: null,
      humidityPercent: null,
      sunset: "2026-06-10T18:45",
      sunrise: "2026-06-10T05:41",
    });

    expect(buildWeatherChipDisplay(briefing)).toMatchObject({
      hasCondition: false,
      hasForecastTemps: false,
      hasSolarTimes: true,
      sunrise: "05:41",
      sunset: "18:45",
      tooltip: "sunrise 05:41 sunset 18:45\nSun 05:41/18:45",
    });
  });
});

function weatherBriefing(
  weather: Partial<NonNullable<TripDailyBriefing["weather"]>>,
): TripDailyBriefing {
  return {
    tripId: "trip-1",
    date: "2026-06-10",
    locationKey: "hkg",
    locationLabel: "Hong Kong",
    coordinates: null,
    weather: {
      conditionCode: "sunny",
      temperatureMaxCelsius: 32,
      temperatureMinCelsius: 24,
      apparentTemperatureMaxCelsius: null,
      apparentTemperatureMinCelsius: null,
      precipitationSumMm: null,
      precipitationHours: null,
      rainChancePercent: null,
      uvIndexMax: null,
      visibilityMinMeters: null,
      windSpeedKph: null,
      windGustsKph: null,
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
      humidityPercent: null,
      sunset: "18:45",
      sunrise: "05:41",
      ...weather,
    },
    holiday: null,
    festival: null,
    facts: null,
    outfitAdvice: null,
    manualOverrides: {},
    version: 1,
    updatedAt: "2026-06-10",
  };
}
