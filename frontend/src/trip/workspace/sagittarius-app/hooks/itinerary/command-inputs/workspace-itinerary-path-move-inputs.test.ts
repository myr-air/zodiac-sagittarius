import { describe, expect, it } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { applyManualActivityPath } from "@/src/trip/itinerary-paths";
import { overlappingActivityItems } from "@/src/trip/testing/itinerary-activity-branch-fixtures";
import {
  pathIdPlanA,
  pathIdPlanB,
} from "@/src/trip/testing/itinerary-path-fixtures";
import {
  buildWorkspacePathMovePlacement,
  buildWorkspacePathMoveReplacementItems,
} from "./workspace-itinerary-path-move-inputs";

function overlappingBranchTrip() {
  const { mainItem, middleItem, lateItem } = overlappingActivityItems();
  return applyManualActivityPath(
    applyManualActivityPath(
      {
        ...tripFixture.trip,
        itineraryItems: [mainItem, middleItem, lateItem],
      },
      "item-late",
      pathIdPlanA,
    ).trip,
    "item-main-long",
    pathIdPlanB,
  ).trip;
}

describe("workspace itinerary path move inputs", () => {
  it("builds manual path placements when path assignment changes branch items", () => {
    const trip = overlappingBranchTrip();

    expect(
      buildWorkspacePathMovePlacement(trip, "item-middle", pathIdPlanA),
    ).toEqual(applyManualActivityPath(trip, "item-middle", pathIdPlanA));
  });

  it("returns null when manual path assignment does not change branch items", () => {
    const trip = overlappingBranchTrip();

    expect(
      buildWorkspacePathMovePlacement(trip, "item-late", pathIdPlanA),
    ).toBeNull();
  });

  it("combines local branch placement items with API-patched branch items", () => {
    const trip = overlappingBranchTrip();
    const branchPlacement = applyManualActivityPath(
      trip,
      "item-middle",
      pathIdPlanA,
    );
    const patchedItem = {
      ...branchPlacement.changedExistingItems[0]!,
      version: branchPlacement.changedExistingItems[0]!.version + 1,
    };

    expect(
      buildWorkspacePathMoveReplacementItems(branchPlacement, [patchedItem]),
    ).toEqual([
      ...branchPlacement.trip.itineraryItems.filter((item) =>
        branchPlacement.changedExistingItems.some(
          (changedItem) => changedItem.id === item.id,
        ),
      ),
      patchedItem,
    ]);
  });
});
