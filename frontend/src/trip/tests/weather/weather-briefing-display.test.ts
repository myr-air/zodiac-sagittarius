import { describe, expect, it } from "vitest";
import {
  briefingsForStrip,
  formatSolarTime,
  formatWeatherTemp,
  thaiWeekdayTone,
  weatherGraphicLabel,
  weatherIconForCondition,
} from "../../weather-briefing-display";
import type { TripDailyBriefing } from "../../types";

const briefing = (date: string): TripDailyBriefing => ({
  tripId: "trip-1",
  date,
  locationKey: "destination:hong-kong",
  locationLabel: "Hong Kong",
  coordinates: null,
  weather: null,
  holiday: null,
  festival: null,
  facts: null,
  outfitAdvice: null,
  manualOverrides: {},
  updatedAt: "2026-06-04T00:00:00Z",
  version: 1,
});

describe("weather briefing display helpers", () => {
  it("sorts strip briefings by date", () => {
    expect(
      briefingsForStrip([briefing("2026-07-11"), briefing("2026-07-09")]).map(
        (item) => item.date,
      ),
    ).toEqual(["2026-07-09", "2026-07-11"]);
  });

  it("maps Thai weekday tones from ISO date", () => {
    expect(thaiWeekdayTone("2026-07-12")).toMatchObject({
      name: "sunday",
      className: expect.stringContaining("text-rose"),
    });
    expect(thaiWeekdayTone("2026-07-13")).toMatchObject({
      name: "monday",
      className: expect.stringContaining("text-amber"),
    });
  });

  it("maps weather codes to readable labels and icons", () => {
    expect(weatherGraphicLabel("rain")).toBe("Rain");
    expect(weatherGraphicLabel("unknown-code")).toBe("Weather");
    expect(weatherIconForCondition("sunny")).toBe("sun");
    expect(weatherIconForCondition("thunderstorm")).toBe("warning");
    expect(weatherIconForCondition(null)).toBe("cloud");
  });

  it("formats temperatures and solar times for compact weather UI", () => {
    expect(formatWeatherTemp(28.6)).toBe("29°");
    expect(formatWeatherTemp(null)).toBe("--°");
    expect(formatSolarTime("2026-07-11T05:46")).toBe("05:46");
    expect(formatSolarTime("18:47:00")).toBe("18:47");
    expect(formatSolarTime(null)).toBeNull();
  });
});
