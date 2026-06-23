import { describe, expect, it } from "vitest";
import type { TripDailyBriefing } from "@/src/trip/types";
import {
  buildWeatherDetailLines,
  formatFullDate,
  formatWeatherSummary,
} from "./weather-briefing-drawer-model";
import { emptyText, weatherDrawerCopy } from "./weather-briefing-drawer-copy";

const weather: NonNullable<TripDailyBriefing["weather"]> = {
  apparentTemperatureMaxCelsius: 38,
  apparentTemperatureMinCelsius: 31,
  cloudCoverMeanPercent: 80,
  conditionCode: "rain",
  conditionLabel: "Rain",
  humidityPercent: 82,
  meta: {
    confidence: "high",
    expiresAt: null,
    fetchedAt: null,
    source: "Open-Meteo",
    sourceUrl: null,
    unavailableReason: null,
  },
  precipitationHours: 4,
  precipitationSumMm: 12.4,
  rainChancePercent: 64,
  sunrise: "2026-07-12T05:46",
  sunset: "2026-07-12T18:47",
  temperatureMaxCelsius: 33,
  temperatureMinCelsius: 28,
  uvIndexMax: 8.2,
  visibilityMinMeters: 1900,
  windGustsKph: 42,
  windSpeedKph: 16,
};

describe("weather briefing drawer model", () => {
  it("formats weather summaries without placeholder temperatures", () => {
    expect(formatWeatherSummary("Rain", 33, 28, "en")).toBe("Rain · 33° 28°");
    expect(formatWeatherSummary("Forecast pending", null, null, "en")).toBe("Forecast pending");
    expect(formatWeatherSummary(null, null, null, "th")).toBe("ยังไม่มีข้อมูล");
  });

  it("builds localized weather detail lines from available metrics", () => {
    expect(buildWeatherDetailLines(weather, "en")).toEqual([
      "Feels like 38° 31° · UV 8.2",
      "Rain amount 12.4 mm · Rain hours 4 h · Wind gust 42 km/h",
      "Min visibility 1.9 km · Cloud cover 80%",
    ]);
    expect(buildWeatherDetailLines(weather, "th")[0]).toBe("รู้สึกเหมือน 38° 31° · UV 8.2");
  });

  it("keeps drawer copy and empty state locale-specific", () => {
    expect(weatherDrawerCopy("en").regionLabel).toBe("Weather briefing");
    expect(weatherDrawerCopy("th").regionLabel).toBe("รายละเอียดพยากรณ์อากาศ");
    expect(emptyText("en")).toBe("No data yet");
    expect(emptyText("th")).toBe("ยังไม่มีข้อมูล");
  });

  it("formats full briefing dates through the shared locale mapper", () => {
    expect(formatFullDate("2026-07-12", "en")).toContain("Sunday");
    expect(formatFullDate("2026-07-12", "th")).toContain("วันอาทิตย์");
    expect(formatFullDate("not-a-date", "en")).toBe("not-a-date");
  });
});
