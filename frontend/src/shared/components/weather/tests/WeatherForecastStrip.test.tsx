import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TripDailyBriefing } from "@/src/trip/types";
import { WeatherForecastStrip } from "../WeatherForecastStrip";

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
    sunrise: `${date}T05:46`,
    sunset: `${date}T18:47`,
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
    sunrise: null,
    sunset: null,
    meta: { source: "Sagittarius", sourceUrl: null, fetchedAt: null, expiresAt: null, confidence: "unknown", unavailableReason: "Demo fallback" },
  },
});

describe("WeatherForecastStrip", () => {
  it("renders one-line forecast segments with high and low temperature hierarchy", async () => {
    const onSelect = vi.fn();
    const { container } = render(<WeatherForecastStrip briefings={[briefing("2026-07-12", 33, 28)]} locale="en" selectedDate={null} onSelect={onSelect} />);

    expect(container.querySelector(".weather-forecast-strip")).toHaveClass("bg-(--color-surface)", "border-(--color-border)");
    expect(container.querySelector(".weather-forecast-strip")?.className).not.toContain("backdrop-blur");
    expect(container.querySelector(".weather-forecast-row")).toHaveClass("max-[767px]:snap-x", "max-[767px]:snap-mandatory");
    expect(screen.getByRole("button", { name: /Sun, Jul 12 Rain 33° 28° Sunrise 05:46 sunset 18:47/ })).toHaveClass("max-[767px]:w-[118px]", "max-[767px]:shrink-0");
    expect(container.querySelector(".weather-forecast-icon")).toHaveClass("grid", "size-9", "[&_.icon]:size-5");

    expect(screen.getByRole("button", { name: /Sun, Jul 12 Rain 33° 28° Sunrise 05:46 sunset 18:47/ })).toBeInTheDocument();
    expect(screen.getByText("33°")).toHaveClass("weather-forecast-temp-high");
    expect(screen.getByText("28°")).toHaveClass("weather-forecast-temp-low");
    expect(screen.getByText("05:46 / 18:47")).toHaveClass("weather-forecast-solar");

    await userEvent.click(screen.getByRole("button", { name: /Sun, Jul 12/ }));
    expect(onSelect).toHaveBeenCalledWith("2026-07-12");
  });

  it("uses Thai weekday color on day text instead of a bottom bar", () => {
    render(<WeatherForecastStrip briefings={[briefing("2026-07-13", 32, 27)]} locale="en" selectedDate={null} onSelect={() => {}} />);

    expect(screen.getByText("Mon, Jul 13")).toHaveClass("text-amber-900");
  });

  it("formats Thai day labels through the shared locale mapper", () => {
    render(<WeatherForecastStrip briefings={[briefing("2026-07-13", 32, 27)]} locale="th" selectedDate={null} onSelect={() => {}} />);

    expect(screen.getByText(/13 ก.ค./)).toHaveClass("text-amber-900");
  });

  it("shows pending forecasts without emoji glyphs or repeated missing temperatures", () => {
    render(<WeatherForecastStrip briefings={[pendingBriefing("2026-07-14")]} locale="en" selectedDate={null} onSelect={() => {}} />);

    expect(screen.getByRole("button", { name: /Tue, Jul 14 Forecast pending/ })).toBeInTheDocument();
    expect(screen.getByText("Forecast pending")).toHaveClass("weather-forecast-pending");
    expect(document.querySelector(".weather-forecast-icon")).not.toBeInTheDocument();
    expect(screen.queryByText("--°")).not.toBeInTheDocument();
    expect(screen.queryByText("🌤")).not.toBeInTheDocument();
    expect(screen.queryByText("☂")).not.toBeInTheDocument();
  });
});
