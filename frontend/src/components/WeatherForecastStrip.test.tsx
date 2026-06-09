import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TripDailyBriefing } from "@/src/trip/types";
import { WeatherForecastStrip } from "./WeatherForecastStrip";

const briefing = (date: string, high: number, low: number): TripDailyBriefing => ({
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
    humidityPercent: 80,
    windSpeedKph: 12,
    rainChancePercent: 60,
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

const pendingBriefing = (date: string): TripDailyBriefing => ({
  ...briefing(date, 0, 0),
  weather: {
    ...briefing(date, 0, 0).weather!,
    conditionCode: "unavailable",
    conditionLabel: "Forecast pending",
    temperatureMaxCelsius: null,
    temperatureMinCelsius: null,
    meta: { source: "Sagittarius", sourceUrl: null, fetchedAt: null, expiresAt: null, confidence: "unknown", unavailableReason: "Demo fallback" },
  },
});

describe("WeatherForecastStrip", () => {
  it("renders one-line forecast segments with high and low temperature hierarchy", async () => {
    const onSelect = vi.fn();
    render(<WeatherForecastStrip briefings={[briefing("2026-07-12", 33, 28)]} locale="en" selectedDate={null} onSelect={onSelect} />);

    expect(screen.getByRole("button", { name: /Sun, Jul 12 Rain 33° 28°/ })).toBeInTheDocument();
    expect(screen.getByText("33°")).toHaveClass("weather-forecast-temp-high");
    expect(screen.getByText("28°")).toHaveClass("weather-forecast-temp-low");

    await userEvent.click(screen.getByRole("button", { name: /Sun, Jul 12/ }));
    expect(onSelect).toHaveBeenCalledWith("2026-07-12");
  });

  it("uses Thai weekday color on day text instead of a bottom bar", () => {
    render(<WeatherForecastStrip briefings={[briefing("2026-07-13", 32, 27)]} locale="en" selectedDate={null} onSelect={() => {}} />);

    expect(screen.getByText("Mon, Jul 13")).toHaveClass("text-yellow-600");
  });

  it("shows pending forecasts without emoji glyphs or repeated missing temperatures", () => {
    render(<WeatherForecastStrip briefings={[pendingBriefing("2026-07-14")]} locale="en" selectedDate={null} onSelect={() => {}} />);

    expect(screen.getByRole("button", { name: /Tue, Jul 14 Forecast pending/ })).toBeInTheDocument();
    expect(screen.getByText("Forecast pending")).toHaveClass("weather-forecast-pending");
    expect(screen.queryByText("--°")).not.toBeInTheDocument();
    expect(screen.queryByText("🌤")).not.toBeInTheDocument();
    expect(screen.queryByText("☂")).not.toBeInTheDocument();
  });
});
