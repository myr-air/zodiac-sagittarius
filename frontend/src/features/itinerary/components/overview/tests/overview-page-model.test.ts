import { afterEach, describe, expect, it, vi } from "vitest";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { seedTrip } from "@/src/trip/seed";
import {
  buildTripFixtureSuggestion,
  getTripFixtureItineraryItem,
} from "@/src/trip/testing/fixtures/trip-fixtures";
import { buildOverviewPageModel } from "../overview-page-model";

describe("overview page model", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("derives role, cockpit counts, and sorted highlights from trip data", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-06-18T12:00:00.000Z"));

    const model = buildOverviewPageModel({
      currentMemberId: "member-beam",
      expenseSummary: buildExpenseSummary(seedTrip.expenses, "member-beam"),
      focusTodayLabel: "Focus today",
      items: [...seedTrip.itineraryItems].reverse(),
      locale: "en",
      suggestions: [buildTripFixtureSuggestion({ id: "suggestion-pending" })],
      trip: seedTrip,
    });

    expect(model.roleLens).toBe("manager");
    expect(model.pendingSuggestions).toBe(1);
    expect(model.activeMembers).toBeGreaterThan(0);
    expect(model.nextStop?.day).toBe(seedTrip.startDate);
    expect(model.focusTodayHeading).toBe("Focus today");
    expect(model.groupSpendLabel).toBe("HK$1,672.00");
    expect(model.highlightItems.length).toBeGreaterThan(0);
  });

  it("uses itinerary view overrides when supplied", () => {
    const item = getTripFixtureItineraryItem("item-dimdim");

    const model = buildOverviewPageModel({
      currentMemberId: "member-nam",
      expenseSummary: buildExpenseSummary(seedTrip.expenses, "member-nam"),
      focusTodayLabel: "Focus today",
      items: seedTrip.itineraryItems,
      itineraryView: {
        dayGroups: [{ day: item.day, items: [item], warningCount: 42 }],
        routeDayStats: [
          {
            coordinateItemCount: item.coordinates ? 1 : 0,
            day: item.day,
            itemCount: 1,
            warningCount: 42,
          },
        ],
        sortedItems: [item],
        warningCount: 42,
      },
      locale: "en",
      suggestions: [],
      trip: seedTrip,
    });

    expect(model.roleLens).toBe("traveler");
    expect(model.sortedItems).toEqual([item]);
    expect(model.warningCount).toBe(42);
    expect(model.nextDayItems).toEqual([item]);
  });
});
