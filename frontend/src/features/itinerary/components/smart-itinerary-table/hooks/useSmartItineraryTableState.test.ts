import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import {
  mainPathOption,
  pathOptionPlanA,
} from "@/src/features/itinerary/testing/fixtures/path-options";
import type { ItineraryItem } from "@/src/trip/types";
import { useSmartItineraryTableState, computeItinerarySummaryCounts } from "./useSmartItineraryTableState";

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

const selectedCountLabel = ({ count }: { count: number }) => `${count} selected`;
const selectedNamesLabel = ({ names }: { names: string }) => names;

function renderTableState(
  overrides: Partial<Parameters<typeof useSmartItineraryTableState>[0]> = {},
) {
  return renderHook(() =>
    useSmartItineraryTableState({
      items: [],
      pathOptions: [mainPathOption],
      role: "owner",
      startDate: "2026-06-19",
      endDate: "2026-06-20",
      selectedCountLabel,
      selectedNamesLabel,
      ...overrides,
    }),
  );
}

describe("useSmartItineraryTableState", () => {
  it("scopes warning count to selected paths", () => {
    const items = [
      buildItineraryItem({
        id: "main",
        mapLink: "https://example.test/main",
        startTime: "09:00",
        durationMinutes: 60,
      }),
      buildItineraryItem({
        id: "plan-a",
        mapLink: "https://example.test/plan-a",
        pathRole: "alternative",
        pathId: pathOptionPlanA.id,
        pathName: pathOptionPlanA.name,
        startTime: "09:00",
        durationMinutes: 60,
      }),
    ];
    const { result } = renderTableState({
      items,
      pathOptions: [mainPathOption, pathOptionPlanA],
    });

    expect(result.current.warningCount).toBe(2);

    act(() => result.current.togglePlanFilter(pathOptionPlanA.id));

    expect(result.current.warningCount).toBe(0);
  });

  it("scopes warning count to the selected item's day", () => {
    const items = [
      buildItineraryItem({
        id: "a",
        day: "2026-06-19",
        mapLink: "https://example.test/a",
        startTime: "09:00",
        durationMinutes: 60,
      }),
      buildItineraryItem({
        id: "b",
        day: "2026-06-19",
        mapLink: "https://example.test/b",
        startTime: "09:00",
        durationMinutes: 60,
      }),
      buildItineraryItem({
        id: "c",
        day: "2026-06-20",
        mapLink: "https://example.test/c",
        startTime: "09:00",
        durationMinutes: 60,
      }),
    ];
    const { result } = renderTableState({
      items,
      selectedItemId: "c",
    });

    expect(result.current.warningCount).toBe(0);
  });

  it("ignores the global itineraryView warningCount", () => {
    const items = [
      buildItineraryItem({
        id: "a",
        mapLink: "https://example.test/a",
        startTime: "09:00",
        durationMinutes: 60,
      }),
      buildItineraryItem({
        id: "b",
        mapLink: "https://example.test/b",
        startTime: "09:00",
        durationMinutes: 60,
      }),
    ];
    const { result } = renderTableState({
      items,
      itineraryView: {
        dayGroups: [],
        sortedItems: items,
        warningCount: 99,
        routeDayStats: [],
      },
    });

    expect(result.current.warningCount).toBe(2);
  });
});
