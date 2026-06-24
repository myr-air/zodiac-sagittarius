import { describe, expect, it } from "vitest";
import type { TripDailyBriefing } from "@/src/trip/types";
import {
  buildWeatherDisplayFacts,
  formatWeatherConditionTemperatureLabel,
} from "./weather-display-facts";

describe("weather display facts", () => {
  it("normalizes condition, temperature, and solar display state", () => {
    const facts = buildWeatherDisplayFacts(weatherBlock({
      conditionCode: "rain",
      temperatureMaxCelsius: 33,
      temperatureMinCelsius: 28,
      sunrise: "2026-06-19T05:46",
      sunset: "2026-06-19T18:47",
    }));

    expect(facts).toMatchObject({
      condition: "Rain",
      hasCondition: true,
      hasForecastTemps: true,
      hasSolarTimes: true,
      highLabel: "33°",
      lowLabel: "28°",
      sunrise: "05:46",
      sunset: "18:47",
    });
    expect(formatWeatherConditionTemperatureLabel(facts)).toBe("Rain 33° 28°");
  });

  it("suppresses unavailable conditions while preserving real solar times", () => {
    const facts = buildWeatherDisplayFacts(weatherBlock({
      conditionCode: "unavailable",
      temperatureMaxCelsius: null,
      temperatureMinCelsius: null,
      sunrise: "2026-06-19T05:39",
      sunset: "2026-06-19T19:09",
    }));

    expect(facts).toMatchObject({
      condition: "Forecast pending",
      hasCondition: false,
      hasForecastTemps: false,
      hasSolarTimes: true,
      sunrise: "05:39",
      sunset: "19:09",
    });
    expect(formatWeatherConditionTemperatureLabel(facts)).toBe("");
  });
});

function weatherBlock(
  weather: Partial<NonNullable<TripDailyBriefing["weather"]>>,
): NonNullable<TripDailyBriefing["weather"]> {
  return {
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
  };
}
