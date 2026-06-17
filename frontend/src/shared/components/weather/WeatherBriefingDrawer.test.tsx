import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TripDailyBriefing } from "@/src/trip/types";
import { WeatherBriefingDrawer } from "./WeatherBriefingDrawer";

const briefing: TripDailyBriefing = {
  tripId: "trip-1",
  date: "2026-07-12",
  locationKey: "destination:hong-kong",
  locationLabel: "Hong Kong",
  coordinates: null,
  weather: {
    conditionCode: "rain",
    conditionLabel: "Rain",
    temperatureMaxCelsius: 33,
    temperatureMinCelsius: 28,
    apparentTemperatureMaxCelsius: 38,
    apparentTemperatureMinCelsius: 31,
    sunrise: "2026-07-12T05:46",
    sunset: "2026-07-12T18:47",
    uvIndexMax: 8.2,
    precipitationSumMm: 12.4,
    precipitationHours: 4,
    humidityPercent: 82,
    windSpeedKph: 16,
    windGustsKph: 42,
    cloudCoverMeanPercent: 80,
    visibilityMinMeters: 1900,
    rainChancePercent: 64,
    meta: { source: "Open-Meteo", sourceUrl: null, fetchedAt: "2026-06-04T00:00:00Z", expiresAt: "2026-06-04T06:00:00Z", confidence: "high", unavailableReason: null },
  },
  holiday: { title: "Public holiday", body: "No public holiday found.", meta: { source: "Nager.Date", sourceUrl: null, fetchedAt: null, expiresAt: null, confidence: "high", unavailableReason: null } },
  festival: null,
  facts: null,
  outfitAdvice: { title: "Outfit advice", body: "Light shirt and compact umbrella.", meta: { source: "Sagittarius", sourceUrl: null, fetchedAt: null, expiresAt: null, confidence: "medium", unavailableReason: null } },
  manualOverrides: {},
  updatedAt: "2026-06-04T00:00:00Z",
  version: 1,
};

describe("WeatherBriefingDrawer", () => {
  it("renders a non-modal inspector drawer and closes from the close button", async () => {
    const onClose = vi.fn();
    render(<WeatherBriefingDrawer briefing={briefing} locale="en" canEdit={false} isOpen onClose={onClose} />);

    const inspector = screen.getByRole("region", { name: /weather briefing/i });
    expect(inspector).toBeInTheDocument();
    expect(inspector).not.toHaveAttribute("aria-modal");
    expect(screen.queryByRole("dialog", { name: /weather briefing/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Rain · 33° 28°/)).toBeInTheDocument();
    expect(screen.getByText(/Humidity 82%/)).toBeInTheDocument();
    expect(screen.getByText(/Sunrise 05:46 · Sunset 18:47/)).toBeInTheDocument();
    expect(screen.getByText(/Feels like 38° 31° · UV 8.2/)).toBeInTheDocument();
    expect(screen.getByText(/Rain amount 12.4 mm · Rain hours 4 h · Wind gust 42 km\/h/)).toBeInTheDocument();
    expect(screen.getByText(/Min visibility 1.9 km · Cloud cover 80%/)).toBeInTheDocument();
    expect(screen.getByText("Light shirt and compact umbrella.")).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole("button", { name: /close/i }).at(-1)!);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows organizer edit controls only when editable", () => {
    const { rerender } = render(<WeatherBriefingDrawer briefing={briefing} locale="en" canEdit={false} isOpen onClose={() => {}} />);
    expect(screen.queryByLabelText(/outfit advice override/i)).not.toBeInTheDocument();

    rerender(<WeatherBriefingDrawer briefing={briefing} locale="en" canEdit isOpen onClose={() => {}} />);
    expect(screen.getByLabelText(/outfit advice override/i)).toBeInTheDocument();
  });

  it("localizes drawer labels and weather details for Thai", () => {
    render(<WeatherBriefingDrawer briefing={briefing} locale="th" canEdit isOpen onClose={() => {}} />);

    expect(screen.getByRole("region", { name: /รายละเอียดพยากรณ์อากาศ/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "สภาพอากาศ" })).toBeInTheDocument();
    expect(screen.getByText(/ความชื้น 82%/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "คำแนะนำการแต่งตัว" })).toBeInTheDocument();
    expect(screen.getByLabelText(/ปรับคำแนะนำการแต่งตัว/i)).toBeInTheDocument();
  });

  it("keeps missing temperature data out of the weather summary", () => {
    render(<WeatherBriefingDrawer briefing={{ ...briefing, weather: { ...briefing.weather!, conditionLabel: "Forecast pending", temperatureMaxCelsius: null, temperatureMinCelsius: null } }} locale="en" canEdit isOpen onClose={() => {}} />);

    expect(screen.getByRole("heading", { name: "Forecast pending" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /--° --°/ })).not.toBeInTheDocument();
  });

  it("submits manual overrides with date and version", async () => {
    const onSaveOverrides = vi.fn();
    render(<WeatherBriefingDrawer briefing={briefing} locale="en" canEdit isOpen onClose={() => {}} onSaveOverrides={onSaveOverrides} />);

    await userEvent.type(screen.getByLabelText(/outfit advice override/i), "Bring a hat");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(onSaveOverrides).toHaveBeenCalledWith("2026-07-12", 1, expect.objectContaining({ outfitAdvice: "Bring a hat" }));
  });
});
