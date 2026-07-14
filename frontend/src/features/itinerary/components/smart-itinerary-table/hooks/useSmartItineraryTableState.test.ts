import { describe, expect, it } from "vitest";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import type { ItineraryItem } from "@/src/trip/types";
import { computeItinerarySummaryCounts } from "./useSmartItineraryTableState";

describe("computeItinerarySummaryCounts", () => {
  it("returns zero counts for an empty item list", () => {
    expect(computeItinerarySummaryCounts([])).toEqual({
      subActivitiesCount: 0,
      flexibleItemsCount: 0,
      totalMinutes: 0,
    });
  });

  it("counts sub-activities separately", () => {
    const items: ItineraryItem[] = [
      buildItineraryItem({ id: "a", parentItemId: null }),
      buildItineraryItem({ id: "b", parentItemId: "a" }),
      buildItineraryItem({ id: "c", parentItemId: "a" }),
    ];

    expect(computeItinerarySummaryCounts(items)).toEqual({
      subActivitiesCount: 2,
      flexibleItemsCount: 0,
      totalMinutes: 135,
    });
  });

  it("counts flexible items regardless of parent status", () => {
    const items: ItineraryItem[] = [
      buildItineraryItem({ id: "a", timeMode: "scheduled", parentItemId: null }),
      buildItineraryItem({ id: "b", timeMode: "flexible", parentItemId: null }),
      buildItineraryItem({ id: "c", timeMode: "flexible", parentItemId: "a" }),
    ];

    expect(computeItinerarySummaryCounts(items)).toEqual({
      subActivitiesCount: 1,
      flexibleItemsCount: 2,
      totalMinutes: 135,
    });
  });

  it("updates counts when items are added or removed", () => {
    const base: ItineraryItem[] = [
      buildItineraryItem({ id: "a", parentItemId: null }),
      buildItineraryItem({ id: "b", timeMode: "flexible", parentItemId: null }),
    ];
    const added: ItineraryItem[] = [
      ...base,
      buildItineraryItem({ id: "c", parentItemId: "a" }),
      buildItineraryItem({ id: "d", timeMode: "flexible", parentItemId: null }),
    ];

    expect(computeItinerarySummaryCounts(base)).toEqual({
      subActivitiesCount: 0,
      flexibleItemsCount: 1,
      totalMinutes: 90,
    });
    expect(computeItinerarySummaryCounts(added)).toEqual({
      subActivitiesCount: 1,
      flexibleItemsCount: 2,
      totalMinutes: 180,
    });
  });

  it("excludes journey block durations from total minutes", () => {
    const items: ItineraryItem[] = [
      buildItineraryItem({
        id: "block",
        durationMinutes: 60,
        isPlanBlock: true,
      }),
      buildItineraryItem({
        id: "activity",
        durationMinutes: 45,
        isPlanBlock: false,
      }),
      buildItineraryItem({ id: "plain", durationMinutes: 30 }),
    ];

    expect(computeItinerarySummaryCounts(items)).toEqual({
      subActivitiesCount: 0,
      flexibleItemsCount: 0,
      totalMinutes: 75,
    });
  });

  it("counts a 60-minute plan block as zero total minutes", () => {
    const items: ItineraryItem[] = [
      buildItineraryItem({
        id: "block",
        durationMinutes: 60,
        isPlanBlock: true,
      }),
    ];

    expect(computeItinerarySummaryCounts(items)).toEqual({
      subActivitiesCount: 0,
      flexibleItemsCount: 0,
      totalMinutes: 0,
    });
  });
});
