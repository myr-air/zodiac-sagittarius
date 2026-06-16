import { describe, expect, it } from "vitest";
import type { ItineraryItem, PlanVariant, TripDailyBriefing } from "@/src/trip/types";
import type { ItineraryPathOption } from "@/src/trip/itinerary";
import {
  buildGraphColumnWidth,
  buildWeatherSummary,
  dedupePathOptions,
  formatSelectedPlanLabel,
  formatTripPlanOptionLabel,
  groupChildItemsByParent,
  groupGraphItemsByDay,
  mergeTripDayGroups,
} from "./smart-itinerary-table-utils";
const countLabel = ({ count }: { count: number }) => `${count} selected`;
const namesLabel = ({ names }: { names: string }) => `Selected: ${names}`;

describe("smart-itinerary-table-utils", () => {
  it("fills missing day groups with ordered empty entries", () => {
    const tripDates = ["2026-06-10", "2026-06-11", "2026-06-12"];
    const groups = mergeTripDayGroups(
      [{ day: "2026-06-11", items: [], warningCount: 0 }],
      "2026-06-10",
      "2026-06-12",
      tripDates,
    );
    expect(groups).toEqual([
      { day: "2026-06-10", items: [], warningCount: 0 },
      { day: "2026-06-11", items: [], warningCount: 0 },
      { day: "2026-06-12", items: [], warningCount: 0 },
    ]);
  });

  it("groups child items and preserves parent ordering", () => {
    const items = [
      { id: "c", parentItemId: "p", sortOrder: 2, startTime: "10:00", activity: "c", activityType: "default", day: "2026-06-10", status: "planned", planVariantId: "main", createdBy: "u", updatedAt: "2026", version: 1, planKind: "main", sortKey: "a", endTime: "10:30", endOffsetDays: 0 } as unknown as ItineraryItem,
      { id: "b", parentItemId: "p", sortOrder: 1, startTime: "09:00", activity: "b", activityType: "default", day: "2026-06-10", status: "planned", planVariantId: "main", createdBy: "u", updatedAt: "2026", version: 1, planKind: "main", sortKey: "a", endTime: "09:30", endOffsetDays: 0 } as unknown as ItineraryItem,
      { id: "p", sortOrder: 0, startTime: "08:00", activity: "p", activityType: "default", day: "2026-06-10", status: "planned", planVariantId: "main", createdBy: "u", updatedAt: "2026", version: 1, planKind: "main", sortKey: "a", endTime: "08:30", endOffsetDays: 0 } as unknown as ItineraryItem,
    ];
    expect(groupChildItemsByParent(items).get("p")?.map((i) => i.id)).toEqual(["b", "c"]);
  });

  it("maps graph items by day and computes dynamic lane width", () => {
    const items = [
      { id: "a", pathRole: "main", pathId: "main", day: "2026-06-10", sortOrder: 0, startTime: "08:00", activity: "a", activityType: "default", status: "planned", planVariantId: "main", createdBy: "u", updatedAt: "2026", version: 1, planKind: "main", endTime: null, endOffsetDays: 0 } as unknown as ItineraryItem,
      { id: "b", pathRole: "alternative", pathId: "p1", day: "2026-06-10", sortOrder: 0, startTime: "08:00", activity: "b", activityType: "default", status: "planned", planVariantId: "main", createdBy: "u", updatedAt: "2026", version: 1, planKind: "main", endTime: null, endOffsetDays: 0 } as unknown as ItineraryItem,
      { id: "c", pathRole: "alternative", pathId: "p2", day: "2026-06-10", sortOrder: 0, startTime: "10:00", activity: "c", activityType: "default", status: "planned", planVariantId: "main", createdBy: "u", updatedAt: "2026", version: 1, planKind: "main", endTime: null, endOffsetDays: 0 } as unknown as ItineraryItem,
    ];
    expect([...groupGraphItemsByDay(items).entries()].map(([day, dayItems]) => [day, dayItems.length])).toEqual([["2026-06-10", 3]]);
    expect(buildGraphColumnWidth(items, 30, 9, 18)).toBe(66);
  });

  it("deduplicates path options and formats labels consistently", () => {
    const pathOptions: ItineraryPathOption[] = [
      { id: "main", name: "Main", scope: "trip" },
      { id: "p2", name: "Plan 2", scope: "trip" },
    ];
    const items: ItineraryItem[] = [
      { id: "i1", pathId: "p2", pathName: "Plan 2", pathRole: "alternative", day: "2026-06-10", sortOrder: 0, startTime: "09:00", activity: "a", activityType: "default", status: "planned", planVariantId: "main", createdBy: "u", updatedAt: "2026", version: 1, planKind: "main", endTime: null, endOffsetDays: 0 } as unknown as ItineraryItem,
      { id: "i2", pathId: "p3", pathName: "Custom", pathRole: "alternative", day: "2026-06-11", sortOrder: 0, startTime: "09:00", activity: "b", activityType: "default", status: "planned", planVariantId: "main", createdBy: "u", updatedAt: "2026", version: 1, planKind: "main", endTime: null, endOffsetDays: 0 } as unknown as ItineraryItem,
    ];
    const options = dedupePathOptions(pathOptions, items);
    expect(options).toEqual([
      { id: "main", name: "Main" },
      { id: "p2", name: "Plan 2" },
      { id: "p3", name: "Custom" },
    ]);
    expect(
      formatSelectedPlanLabel(
        options,
        ["main", "p3"],
        countLabel,
        namesLabel,
      ),
    ).toBe("Selected: Main, Custom");
  });

  it("builds trip plan option labels from status", () => {
    const plans: PlanVariant[] = [
      {
        kind: "split",
        id: "split-1",
        name: "Split",
        tripId: "trip-1",
        description: "",
        status: "proposal",
      } as PlanVariant,
    ];
    const labels = {
      main: "Main",
      proposal: "Proposal",
      draft: "Draft",
      backup: "Backup",
      split: "Split",
      active: "Active",
      archived: "Archived",
      completed: "Completed",
    };
    expect(formatTripPlanOptionLabel(plans[0], labels)).toBe("Split - Proposal");
  });

  it("builds weather summary details when available", () => {
    const briefing = {
      tripId: "trip-1",
      date: "2026-06-10",
      locationKey: "hkg",
      locationLabel: "Hong Kong",
      coordinates: null,
      weather: {
        conditionCode: "sunny",
        temperatureMaxCelsius: 32,
        temperatureMinCelsius: 24,
        apparentTemperatureMaxCelsius: 33,
        apparentTemperatureMinCelsius: 25,
        precipitationSumMm: 2.5,
        precipitationHours: 1.4,
        rainChancePercent: 22,
        uvIndexMax: 9.8,
        visibilityMinMeters: 12000,
        windSpeedKph: 15.2,
        windGustsKph: 19.9,
        conditionLabel: "Sunny",
        cloudCoverMeanPercent: null,
        dewPointMeanCelsius: null,
        meta: {
          source: "test",
          sourceUrl: null,
          fetchedAt: null,
          expiresAt: null,
          confidence: "high",
          unavailableReason: null,
        },
        sunshineDurationSeconds: null,
        windDirectionDegrees: null,
        visibilityMeanMeters: null,
        daylightDurationSeconds: null,
        pressureMslMeanHpa: null,
        humidityPercent: 72,
        sunset: "18:45",
        sunrise: "05:41",
      },
      holiday: null,
      festival: null,
      facts: null,
      outfitAdvice: null,
      manualOverrides: {},
      version: 1,
      updatedAt: "2026-06-10",
    } as TripDailyBriefing;

    expect(buildWeatherSummary(briefing, "Day 1")).toMatchObject({
      weatherLabel: "Sunny 32° 24°",
    });
  });
});
