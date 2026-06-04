import { describe, expect, it } from "vitest";
import type { TripDailyBriefing } from "./types";
import { briefingsForStrip, thaiWeekdayTone, weatherGraphicLabel } from "./weather-briefings";

const briefing = (date: string, high: number | null, low: number | null): TripDailyBriefing => ({
  tripId: "trip-1",
  date,
  locationKey: "destination:hong-kong",
  locationLabel: "Hong Kong",
  coordinates: null,
  weather: {
    conditionCode: "rain",
    conditionLabel: "Rain",
    temperatureMaxCelsius: high,
    temperatureMinCelsius: low,
    humidityPercent: 82,
    windSpeedKph: 14,
    rainChancePercent: 64,
    meta: { source: "Open-Meteo", sourceUrl: null, fetchedAt: null, expiresAt: null, confidence: "high", unavailableReason: null },
  },
  holiday: null,
  festival: null,
  facts: null,
  outfitAdvice: null,
  manualOverrides: {},
  updatedAt: "2026-06-04T00:00:00Z",
  version: 1,
});

describe("weather briefings", () => {
  it("sorts strip briefings by date", () => {
    expect(briefingsForStrip([briefing("2026-07-11", 33, 28), briefing("2026-07-09", 31, 27)]).map((item) => item.date)).toEqual([
      "2026-07-09",
      "2026-07-11",
    ]);
  });

  it("maps Thai weekday tones from ISO date", () => {
    expect(thaiWeekdayTone("2026-07-12")).toMatchObject({ name: "sunday", className: expect.stringContaining("text-rose") });
    expect(thaiWeekdayTone("2026-07-13")).toMatchObject({ name: "monday", className: expect.stringContaining("text-yellow") });
  });

  it("maps weather code to a readable graphic label", () => {
    expect(weatherGraphicLabel("rain")).toBe("Rain");
    expect(weatherGraphicLabel("unknown-code")).toBe("Weather");
  });
});
