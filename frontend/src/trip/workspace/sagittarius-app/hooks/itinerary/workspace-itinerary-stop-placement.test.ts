import { describe, expect, it } from "vitest";
import {
  appendItineraryItemPlacement,
  replaceItineraryItem,
} from "@/src/trip/itinerary-items";
import {
  applyItemToActivityBranch,
  applyManualActivityPath,
  mainItineraryPathId,
} from "@/src/trip/itinerary-paths";
import { seedTrip } from "@/src/trip/seed";
import { buildTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  placeCreatedWorkspaceStop,
  placeUpdatedWorkspaceStop,
} from "./workspace-itinerary-stop-placement";

const baseItem = buildTripFixtureItineraryItem({
  id: "item-new-stop",
  activity: "New stop",
});

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

describe("placeUpdatedWorkspaceStop", () => {
  it("places updated stops into the activity branch", () => {
    const item = buildTripFixtureItineraryItem({ activity: "Updated stop" });
    const tripWithItem = replaceItineraryItem(seedTrip, item);

    expect(placeUpdatedWorkspaceStop(seedTrip, item)).toEqual(
      applyItemToActivityBranch(tripWithItem, item),
    );
  });

  it("applies manual path assignment after branch placement", () => {
    const item = buildTripFixtureItineraryItem({ activity: "Updated stop" });
    const pathPlacement = applyItemToActivityBranch(
      replaceItineraryItem(seedTrip, item),
      item,
    );

    expect(placeUpdatedWorkspaceStop(seedTrip, item, "path-rain")).toEqual(
      applyManualActivityPath(pathPlacement.trip, item.id, "path-rain"),
    );
  });
});
