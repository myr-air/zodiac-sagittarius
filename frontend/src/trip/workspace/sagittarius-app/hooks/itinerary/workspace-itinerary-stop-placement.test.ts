import { describe, expect, it } from "vitest";
import {
  appendItineraryItemPlacement,
  mainItineraryPathId,
} from "@/src/trip/itinerary";
import { applyItemToActivityBranch } from "@/src/trip/itinerary-paths";
import { seedTrip } from "@/src/trip/seed";
import { placeCreatedWorkspaceStop } from "./workspace-itinerary-stop-placement";

const baseItem = {
  ...seedTrip.itineraryItems[0]!,
  id: "item-new-stop",
  activity: "New stop",
};

describe("placeCreatedWorkspaceStop", () => {
  it("uses activity branch placement for top-level main-path stops", () => {
    expect(
      placeCreatedWorkspaceStop(seedTrip, baseItem, {
        hasParentItem: false,
        targetPathId: mainItineraryPathId,
      }),
    ).toEqual(applyItemToActivityBranch(seedTrip, baseItem));
  });

  it("appends child stops without branch side effects", () => {
    expect(
      placeCreatedWorkspaceStop(seedTrip, baseItem, {
        hasParentItem: true,
        targetPathId: mainItineraryPathId,
      }),
    ).toEqual(appendItineraryItemPlacement(seedTrip, baseItem));
  });

  it("appends non-main path stops without branch side effects", () => {
    expect(
      placeCreatedWorkspaceStop(seedTrip, baseItem, {
        hasParentItem: false,
        targetPathId: "path-rain",
      }),
    ).toEqual(appendItineraryItemPlacement(seedTrip, baseItem));
  });
});
