import { describe, expect, it } from "vitest";
import type { TripCockpitItineraryItem } from "./trip-cockpit-load";
import { groupPathAlternatives, type PathGroupEntry } from "./itinerary-path-groups";

/**
 * T1 #2 — pure fork-group model over cockpit itinerary items.
 * Same-day siblings sharing a pathGroupId collapse into one fork group whose
 * activeItemId is the sibling with pathRole === "main" (null if none is
 * main); items with no pathGroupId pass through unchanged/ungrouped.
 */

const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const PLAN_VARIANT_ID = "dddddddd-eeee-4fff-8000-111111111111";
const DAY = "2026-07-22";

function item(
  overrides: Partial<TripCockpitItineraryItem> &
    Pick<TripCockpitItineraryItem, "id">,
): TripCockpitItineraryItem {
  return {
    tripId: TRIP_ID,
    planVariantId: PLAN_VARIANT_ID,
    day: DAY,
    activity: "Stop",
    activityType: "sight",
    place: "",
    startTime: "09:00",
    status: "idea",
    version: 1,
    ...overrides,
  };
}

describe("groupPathAlternatives", () => {
  it("collapses same-day pathGroupId siblings into one fork group with the main sibling as activeItemId, groups with no main to a null activeItemId, and passes unpathed items through ungrouped", () => {
    // --- Fork group "pg-riverside": alternative seen first, main second ---
    const riversideAlt = item({
      id: "item-riverside-alt",
      pathGroupId: "pg-riverside",
      pathId: "path-riverside-walk",
      pathName: "Riverside walk",
      pathRole: "alternative",
    });
    const riversideMain = item({
      id: "item-riverside-main",
      pathGroupId: "pg-riverside",
      pathId: "path-riverside-cable-car",
      pathName: "Cable car",
      pathRole: "main",
    });

    // --- Plain unpathed stop, interleaved between the two fork groups ---
    const plainLunch = item({
      id: "item-plain-lunch",
      activity: "Lunch",
    });

    // --- Fork group "pg-transfer": neither sibling is main ---
    const transferBus = item({
      id: "item-transfer-bus",
      pathGroupId: "pg-transfer",
      pathId: "path-transfer-bus",
      pathName: "Bus transfer",
      pathRole: "alternative",
    });
    const transferTaxi = item({
      id: "item-transfer-taxi",
      pathGroupId: "pg-transfer",
      pathId: "path-transfer-taxi",
      pathName: "Taxi transfer",
      pathRole: "alternative",
    });

    const result = groupPathAlternatives([
      riversideAlt,
      riversideMain,
      plainLunch,
      transferBus,
      transferTaxi,
    ]);

    const expected: PathGroupEntry[] = [
      {
        kind: "fork",
        pathGroupId: "pg-riverside",
        day: DAY,
        activeItemId: "item-riverside-main",
        items: [riversideAlt, riversideMain],
      },
      { kind: "single", item: plainLunch },
      {
        kind: "fork",
        pathGroupId: "pg-transfer",
        day: DAY,
        activeItemId: null,
        items: [transferBus, transferTaxi],
      },
    ];

    expect(result).toEqual(expected);
  });
});
