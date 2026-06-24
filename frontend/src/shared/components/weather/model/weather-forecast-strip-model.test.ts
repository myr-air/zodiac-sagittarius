import { describe, expect, it } from "vitest";
import {
  formatWeatherStripDayLabel,
  weatherStripCopy,
} from "./weather-forecast-strip-model";

describe("weather forecast strip model", () => {
  it("formats day labels through the shared locale mapper", () => {
    expect(formatWeatherStripDayLabel("2026-07-13", "en")).toBe("Mon, Jul 13");
    expect(formatWeatherStripDayLabel("2026-07-13", "th")).toContain("13 ก.ค.");
    expect(formatWeatherStripDayLabel("not-a-date", "en")).toBe("not-a-date");
  });

  it("keeps strip copy locale-specific", () => {
    expect(weatherStripCopy("en")).toMatchObject({
      regionLabel: "Daily weather forecast",
      empty: "No weather data yet",
    });
    expect(weatherStripCopy("th")).toMatchObject({
      regionLabel: "พยากรณ์อากาศรายวัน",
      empty: "ยังไม่มีข้อมูลพยากรณ์อากาศ",
    });
  });
});
