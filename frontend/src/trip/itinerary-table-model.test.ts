import { describe, expect, it } from "vitest";
import type { TripCockpitItineraryItem } from "./trip-cockpit-load";
import { buildItineraryTableModel } from "./itinerary-table-model";

const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const MAIN_PLAN_ID = "018f4e82-3000-7c00-b111-000000000001";
const ALT_PLAN_ID = "018f4e82-3000-7c00-b222-000000000002";

/** Independent 3-day trip window — middle day intentionally empty for Main. */
const START_DATE = "2026-06-18";
const END_DATE = "2026-06-20";

function item(
  overrides: Partial<TripCockpitItineraryItem> &
    Pick<TripCockpitItineraryItem, "id" | "planVariantId" | "day" | "activity">,
): TripCockpitItineraryItem {
  return {
    tripId: TRIP_ID,
    activityType: "food",
    place: "",
    startTime: "09:00",
    status: "idea",
    version: 1,
    ...overrides,
  };
}

const MAIN_DAY1 = item({
  id: "item-main-day1",
  planVariantId: MAIN_PLAN_ID,
  day: "2026-06-18",
  activity: "Airport transfer",
  activityType: "travel",
  startTime: "08:00",
});

const ALT_DAY1 = item({
  id: "item-alt-day1",
  planVariantId: ALT_PLAN_ID,
  day: "2026-06-18",
  activity: "Alt hotel check-in",
  activityType: "stay",
  startTime: "15:00",
});

/** Belongs to Main but on a day with no other Main stops — proves grouping. */
const MAIN_DAY3 = item({
  id: "item-main-day3",
  planVariantId: MAIN_PLAN_ID,
  day: "2026-06-20",
  activity: "Dim Dim Sum",
  place: "The Elements",
  startTime: "08:30",
});

/** Alt-only middle day — must not appear under Main, day stays empty. */
const ALT_DAY2 = item({
  id: "item-alt-day2",
  planVariantId: ALT_PLAN_ID,
  day: "2026-06-19",
  activity: "Alt museum",
  activityType: "attraction",
  startTime: "11:00",
});

describe("buildItineraryTableModel", () => {
  it("materializes one day header per trip calendar date (empty days included) and groups itineraryItems for the selected planVariantId", () => {
    const model = buildItineraryTableModel({
      startDate: START_DATE,
      endDate: END_DATE,
      planVariantId: MAIN_PLAN_ID,
      itineraryItems: [ALT_DAY2, MAIN_DAY3, ALT_DAY1, MAIN_DAY1],
    });

    // Inclusive spine: 18, 19, 20 — day 19 empty for Main even though Alt has a stop.
    expect(model.days).toEqual([
      { day: "2026-06-18", items: [MAIN_DAY1] },
      { day: "2026-06-19", items: [] },
      { day: "2026-06-20", items: [MAIN_DAY3] },
    ]);
  });
});
