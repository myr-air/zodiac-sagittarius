import { describe, expect, it } from "vitest";
import type { TripCockpitItineraryItem } from "./trip-cockpit-load";
import { buildItineraryTableModel } from "./itinerary-table-model";

const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const MAIN_PLAN_ID = "018f4e82-3000-7c00-b111-000000000001";
const ALT_PLAN_ID = "018f4e82-3000-7c00-b222-000000000002";
/** Real Main Plan itinerary variant — intentionally ≠ MAIN_PLAN_ID (diverge case). */
const ACTIVE_PLAN_VARIANT_ID = "dddddddd-eeee-4fff-8000-111111111111";

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

  /**
   * T2 #2: When trip.mainTripPlanId ≠ trip.activePlanVariantId, Main Plan
   * itinerary scope is the real variant id. Day-spine grouping must still
   * place seeded Main stops under their calendar days — filtering by
   * mainTripPlanId would keep only the decoy and empty the spine.
   */
  it("when mainTripPlanId ≠ activePlanVariantId, day spine still groups Main Plan seeded stops under the real activePlanVariantId", () => {
    // Trip-level ids diverge (Main Plan row id ≠ itinerary variant scope).
    const mainTripPlanId = MAIN_PLAN_ID;
    const activePlanVariantId = ACTIVE_PLAN_VARIANT_ID;
    expect(mainTripPlanId).not.toBe(activePlanVariantId);

    const mainSeededDay1 = item({
      id: "item-main-variant-day1",
      planVariantId: activePlanVariantId,
      day: "2026-06-18",
      activity: "Wat Phra That Doi Suthep",
      activityType: "attraction",
      startTime: "09:00",
    });
    const mainSeededDay3 = item({
      id: "item-main-variant-day3",
      planVariantId: activePlanVariantId,
      day: "2026-06-20",
      activity: "Dim Dim Sum",
      place: "The Elements",
      startTime: "08:30",
    });
    /** Decoy tagged with mainTripPlanId — wrong filter would keep only this. */
    const mainTripPlanIdDecoy = item({
      id: "item-main-plan-id-decoy",
      planVariantId: mainTripPlanId,
      day: "2026-06-18",
      activity: "Decoy stop on mainTripPlanId",
      activityType: "food",
      startTime: "12:00",
    });

    // Contract: Main Plan filter id is activePlanVariantId when ids diverge.
    const model = buildItineraryTableModel({
      startDate: START_DATE,
      endDate: END_DATE,
      planVariantId: activePlanVariantId,
      itineraryItems: [
        mainTripPlanIdDecoy,
        mainSeededDay3,
        ALT_DAY2,
        mainSeededDay1,
      ],
    });

    expect(model.planVariantId).toBe(activePlanVariantId);
    expect(model.days).toEqual([
      { day: "2026-06-18", items: [mainSeededDay1] },
      { day: "2026-06-19", items: [] },
      { day: "2026-06-20", items: [mainSeededDay3] },
    ]);
    const groupedIds = model.days.flatMap((d) => d.items.map((i) => i.id));
    expect(groupedIds).not.toContain(mainTripPlanIdDecoy.id);
    expect(groupedIds).not.toContain(ALT_DAY2.id);
  });

  /**
   * T6 #1: Child rows (parentItemId set) nest under their parent stop for the
   * day spine — one level only. Grandchildren stay top-level (no deeper tree).
   */
  it("nests child itinerary items under their parent stop (one level only)", () => {
    type ItemWithParent = TripCockpitItineraryItem & {
      parentItemId: string | null;
    };
    type NestedStop = ItemWithParent & { children: ItemWithParent[] };

    const parentStay: ItemWithParent = {
      ...item({
        id: "item-parent-stay",
        planVariantId: MAIN_PLAN_ID,
        day: "2026-06-18",
        activity: "Harbour Hotel stay",
        activityType: "stay",
        place: "Harbour Hotel",
        startTime: "15:00",
      }),
      parentItemId: null,
    };
    const childCheckIn: ItemWithParent = {
      ...item({
        id: "item-child-checkin",
        planVariantId: MAIN_PLAN_ID,
        day: "2026-06-18",
        activity: "Lobby check-in",
        activityType: "stay",
        place: "Harbour Hotel",
        startTime: "15:00",
      }),
      parentItemId: parentStay.id,
    };
    /** parentItemId → child — one-level rule keeps this top-level, not nested deeper. */
    const grandchildOrphan: ItemWithParent = {
      ...item({
        id: "item-grandchild-orphan",
        planVariantId: MAIN_PLAN_ID,
        day: "2026-06-18",
        activity: "Room key pickup",
        activityType: "stay",
        startTime: "15:20",
      }),
      parentItemId: childCheckIn.id,
    };
    const siblingRoot: ItemWithParent = {
      ...item({
        id: "item-sibling-food",
        planVariantId: MAIN_PLAN_ID,
        day: "2026-06-18",
        activity: "Dim Dim Sum",
        place: "The Elements",
        startTime: "08:30",
      }),
      parentItemId: null,
    };

    const model = buildItineraryTableModel({
      startDate: START_DATE,
      endDate: END_DATE,
      planVariantId: MAIN_PLAN_ID,
      // Parent before child so root order stays deterministic after nesting.
      itineraryItems: [
        parentStay,
        childCheckIn,
        siblingRoot,
        grandchildOrphan,
        ALT_DAY1,
      ],
    });

    const day0 = model.days[0] as {
      day: string;
      items: NestedStop[];
    };
    expect(day0.day).toBe("2026-06-18");
    expect(day0.items).toEqual([
      {
        ...parentStay,
        children: [childCheckIn],
      },
      {
        ...siblingRoot,
        children: [],
      },
      {
        ...grandchildOrphan,
        children: [],
      },
    ]);
    expect(day0.items.map((row) => row.id)).not.toContain(childCheckIn.id);
    expect(day0.items[0]!.children[0]).not.toHaveProperty("children");
  });
});
