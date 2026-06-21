import { describe, expect, it } from "vitest";
import {
  buildActivityBranchPlacement,
  cascadePathFieldsToSubActivities,
} from "../../../itinerary-activity-branch-placement";
import { overlappingActivityItems } from "@/src/trip/testing/fixtures/itinerary-activity-branch-fixtures";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  pathIdPlanA,
  pathNamePlanA,
} from "@/src/trip/testing/fixtures/itinerary-path-fixtures";

describe("itinerary activity branch placement model", () => {
  it("cascades parent path fields to sub-activities in the same branch", () => {
    const { mainItem } = overlappingActivityItems();
    const child = {
      ...tripFixture.planItems[1],
      id: "item-child",
      parentItemId: mainItem.id,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const branchedParent = {
      ...mainItem,
      pathGroupId: "path-group-main",
      pathId: pathIdPlanA,
      pathName: pathNamePlanA,
      pathRole: "alternative" as const,
    };

    expect(cascadePathFieldsToSubActivities([mainItem, child], [branchedParent])).toEqual([
      branchedParent,
      expect.objectContaining({
        id: "item-child",
        pathGroupId: "path-group-main",
        pathId: pathIdPlanA,
        pathName: pathNamePlanA,
        pathRole: "alternative",
      }),
    ]);
  });

  it("builds placement output and reports changed existing path fields", () => {
    const { mainItem, middleItem } = overlappingActivityItems();
    const trip = {
      ...tripFixture.trip,
      itineraryItems: [mainItem, middleItem],
      version: 4,
    };
    const movedMiddle = {
      ...middleItem,
      pathGroupId: "path-group-main",
      pathId: pathIdPlanA,
      pathName: pathNamePlanA,
      pathRole: "alternative" as const,
    };

    const placement = buildActivityBranchPlacement(
      trip,
      movedMiddle,
      [movedMiddle],
      trip.itineraryItems,
    );

    expect(placement.trip.version).toBe(5);
    expect(placement.trip.itineraryItems.find((item) => item.id === middleItem.id)).toBe(movedMiddle);
    expect(placement.changedExistingItems).toEqual([movedMiddle]);
  });
});
