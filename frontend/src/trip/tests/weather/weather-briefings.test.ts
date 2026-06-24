import { describe, expect, it } from "vitest";
import type { Trip, TripDailyBriefing } from "../../types";
import {
  applyDailyBriefingOverrides,
  buildPatchDailyBriefingRequest,
} from "../../weather";

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
    sunrise: "2026-07-11T05:46",
    sunset: "2026-07-11T18:47",
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
  it("applies daily briefing overrides and increments the briefing version", () => {
    expect(
      applyDailyBriefingOverrides(
        [briefing("2026-07-11", 33, 28)],
        tripFixture(),
        "2026-07-11",
        { dayTitle: "Peak day", outfitAdvice: "Bring a light rain shell." },
      )[0],
    ).toMatchObject({
      date: "2026-07-11",
      manualOverrides: {
        dayTitle: "Peak day",
        outfitAdvice: "Bring a light rain shell.",
      },
      version: 2,
    });
  });

  it("builds API patch requests for daily briefing overrides", () => {
    expect(
      buildPatchDailyBriefingRequest(
        {
          dayTitle: "Peak day",
          outfitAdvice: "Bring a light rain shell.",
          festivalNote: null,
        },
        {
          clientMutationId: "mutation-daily-briefing",
          expectedVersion: 4,
        },
      ),
    ).toEqual({
      clientMutationId: "mutation-daily-briefing",
      expectedVersion: 4,
      dayTitle: "Peak day",
      outfitAdvice: "Bring a light rain shell.",
      festivalNote: null,
    });
  });

  it("creates fallback briefings before applying local overrides", () => {
    expect(
      applyDailyBriefingOverrides([], tripFixture(), "2026-07-12", {
        festivalNote: "Check ferry crowd before leaving.",
      }).find((item) => item.date === "2026-07-12"),
    ).toMatchObject({
      locationLabel: "Hong Kong",
      manualOverrides: expect.objectContaining({
        festivalNote: "Check ferry crowd before leaving.",
      }),
      version: 2,
    });
  });
});

function tripFixture(): Trip {
  return {
    id: "trip-1",
    joinId: "JOIN",
    joinPasswordHash: "hash",
    name: "Hong Kong",
    destinationLabel: "Hong Kong",
    startDate: "2026-07-11",
    endDate: "2026-07-12",
    activePlanVariantId: "plan-main",
    planVariants: [
      { id: "plan-main", tripId: "trip-1", name: "Main", kind: "main", description: "" },
    ],
    members: [],
    itineraryItems: [],
    expenses: [],
  };
}
