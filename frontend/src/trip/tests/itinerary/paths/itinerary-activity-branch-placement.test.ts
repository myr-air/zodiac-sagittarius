import { describe, expect, it } from "vitest";
import { tripFixture } from "../../../trip-fixtures";
import { applyItemToActivityBranch } from "../../../itinerary-paths";
import { overlappingActivityItems } from "../../../testing/itinerary-activity-branch-fixtures";

describe("itinerary activity branch placement", () => {
  it("keeps overlapping created activities on main until an organizer explicitly chooses an alternative path", () => {
    const { mainItem, middleItem, lateItem } = overlappingActivityItems();
    const trip = {
      ...tripFixture.trip,
      itineraryItems: [mainItem],
    };

    const withMiddle = applyItemToActivityBranch(trip, middleItem).trip;
    const withLate = applyItemToActivityBranch(withMiddle, lateItem).trip;
    const itemsById = new Map(withLate.itineraryItems.map((item) => [item.id, item]));

    expect(itemsById.get("item-main-long")).toMatchObject({ pathRole: undefined });
    expect(itemsById.get("item-main-long")?.pathGroupId).toBeUndefined();
    expect(itemsById.get("item-middle")).toMatchObject({ pathRole: "main" });
    expect(itemsById.get("item-middle")?.pathGroupId).toBeUndefined();
    expect(itemsById.get("item-late")).toMatchObject({ pathRole: "main" });
    expect(itemsById.get("item-late")?.pathGroupId).toBeUndefined();
  });

  it("keeps non-overlapping created activities on the main path", () => {
    const trip = {
      ...tripFixture.trip,
      itineraryItems: [{
        ...tripFixture.planItems[0],
        id: "item-main",
        day: "2026-06-19",
        startTime: "08:00",
        durationMinutes: 45,
        sortOrder: 100,
      }],
    };
    const nextItem = {
      ...tripFixture.planItems[1],
      id: "item-later",
      day: "2026-06-19",
      startTime: "10:00",
      durationMinutes: 45,
      sortOrder: 200,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };

    const next = applyItemToActivityBranch(trip, nextItem).trip;

    expect(next.itineraryItems.find((item) => item.id === "item-later")).toMatchObject({
      pathRole: "main",
    });
    expect(next.itineraryItems.find((item) => item.id === "item-later")?.pathGroupId).toBeUndefined();
  });
});
