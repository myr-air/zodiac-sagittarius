import { describe, expect, it } from "vitest";
import {
  formatLabeledWeatherTemperaturePair,
  formatWeatherMetric,
  formatWeatherPercentMetric,
  formatWeatherTemperaturePair,
  joinWeatherMetricParts,
  metersToWeatherKilometers,
} from "./weather-metric-formatters";

describe("weather metric formatters", () => {
  it("formats available temperature pairs without placeholder values", () => {
    expect(formatWeatherTemperaturePair(33, 28)).toBe("33° 28°");
    expect(formatWeatherTemperaturePair(null, 28)).toBe("28°");
    expect(formatWeatherTemperaturePair(null, undefined)).toBeNull();
    expect(formatLabeledWeatherTemperaturePair("Feels like", 38, 31)).toBe(
      "Feels like 38° 31°",
    );
  });

  it("formats numeric metrics with configurable units", () => {
    expect(formatWeatherMetric("Rain", 12.4, "mm")).toBe("Rain 12.4 mm");
    expect(formatWeatherMetric(null, 1.4, "h", { unitSeparator: "" })).toBe("1.4h");
    expect(formatWeatherMetric("Wind gust", 42.4, "km/h", { transform: Math.round })).toBe(
      "Wind gust 42 km/h",
    );
    expect(formatWeatherMetric("UV", null)).toBeNull();
  });

  it("formats percent metrics and joins visible parts", () => {
    expect(formatWeatherPercentMetric("Humidity", 72)).toBe("Humidity 72%");
    expect(joinWeatherMetricParts(["Rain 12 mm", null, "Wind 16 km/h"])).toBe(
      "Rain 12 mm · Wind 16 km/h",
    );
    expect(metersToWeatherKilometers(1900)).toBe(1.9);
  });
});
