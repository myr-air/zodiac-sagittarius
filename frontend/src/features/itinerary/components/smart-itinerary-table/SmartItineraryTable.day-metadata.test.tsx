import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { weatherBriefings } from "@/src/shared/components/weather";
import { renderSmartItineraryTable } from "@/src/features/itinerary/testing";

const renderTable = renderSmartItineraryTable;

describe("SmartItineraryTable day metadata", () => {
  it("shows each day's weather icon in the itinerary day header", () => {
    renderTable({
      dailyBriefings: [
        {
          ...weatherBriefings[1],
          date: "2026-06-19",
          weather: weatherBriefings[1].weather
            ? {
                ...weatherBriefings[1].weather,
                conditionCode: "rain",
                conditionLabel: "Rain",
                temperatureMaxCelsius: 33,
                temperatureMinCelsius: 28,
                apparentTemperatureMaxCelsius: 38,
                apparentTemperatureMinCelsius: 31,
                sunrise: "2026-06-19T05:46",
                sunset: "2026-06-19T18:47",
                uvIndexMax: 8.2,
                precipitationSumMm: 12.4,
                precipitationHours: 4,
                rainChancePercent: 64,
                windSpeedKph: 18,
                windGustsKph: 42,
                visibilityMinMeters: 1900,
              }
            : null,
        },
      ],
    });

    const weatherChip = screen.getByLabelText(/Weather for Day 2/i);
    expect(weatherChip.querySelector(".icon")).toBeInTheDocument();
    expect(weatherChip).toHaveTextContent("33° 28°");
    expect(weatherChip).toHaveTextContent("05:46");
    expect(weatherChip).toHaveTextContent("18:47");
    expect(weatherChip.querySelectorAll(".icon")).toHaveLength(3);
    expect(weatherChip).toHaveAttribute(
      "title",
      expect.stringContaining("Feels 38° 31°"),
    );
    expect(weatherChip).toHaveAttribute(
      "title",
      expect.stringContaining("Rain 64% · 12.4 mm · 4h"),
    );
    expect(weatherChip).toHaveAttribute("title", expect.stringContaining("UV 8.2"));
    expect(weatherChip).toHaveAttribute(
      "title",
      expect.stringContaining("Wind 18 km/h · gust 42 km/h"),
    );
    expect(weatherChip).toHaveAttribute(
      "title",
      expect.stringContaining("Visibility min 1.9 km"),
    );
  });

  it("hides pending weather chips until real temperature or solar data exists", () => {
    renderTable({
      dailyBriefings: [
        {
          ...weatherBriefings[1],
          date: "2026-06-19",
          weather: weatherBriefings[1].weather
            ? {
                ...weatherBriefings[1].weather,
                conditionCode: "unavailable",
                conditionLabel: "Forecast pending",
                temperatureMaxCelsius: null,
                temperatureMinCelsius: null,
                sunrise: null,
                sunset: null,
              }
            : null,
        },
      ],
    });

    expect(screen.queryByLabelText(/Weather for Day 2/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Forecast pending")).not.toBeInTheDocument();
  });

  it("shows real solar times even when temperatures are unavailable", () => {
    renderTable({
      dailyBriefings: [
        {
          ...weatherBriefings[1],
          date: "2026-06-19",
          weather: weatherBriefings[1].weather
            ? {
                ...weatherBriefings[1].weather,
                conditionCode: "unavailable",
                conditionLabel: "Forecast pending",
                temperatureMaxCelsius: null,
                temperatureMinCelsius: null,
                sunrise: "2026-06-19T05:39",
                sunset: "2026-06-19T19:09",
              }
            : null,
        },
      ],
    });

    const weatherChip = screen.getByLabelText(/Weather for Day 2/i);
    expect(weatherChip).toHaveTextContent("05:39");
    expect(weatherChip).toHaveTextContent("19:09");
    expect(weatherChip).not.toHaveTextContent("Forecast pending");
  });

  it("saves custom day titles inline with the daily briefing version", async () => {
    const user = userEvent.setup();
    const onSaveDayTitle = vi.fn();
    renderTable({
      dailyBriefings: [
        {
          ...weatherBriefings[1],
          date: "2026-06-19",
          version: 7,
          manualOverrides: { dayTitle: "Old title" },
        },
      ],
      onSaveDayTitle,
    });

    const titleInput = screen.getByLabelText("Trip day title for Day 2");
    expect(titleInput).toHaveAttribute("maxLength", "48");
    expect(titleInput).toHaveValue("Old title");
    expect(titleInput).toHaveClass("border-transparent", "text-[13px]", "font-extrabold");
    expect(titleInput).toHaveStyle({ width: "12ch" });
    await user.clear(titleInput);
    await user.type(titleInput, "Shenzhen border hop");
    expect(titleInput).toHaveStyle({ width: "20ch" });
    await user.tab();

    await waitFor(() => {
      expect(onSaveDayTitle).toHaveBeenCalledWith(
        "2026-06-19",
        7,
        "Shenzhen border hop",
      );
    });
  });
});
