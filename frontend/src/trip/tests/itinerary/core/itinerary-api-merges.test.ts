import { describe, expect, it } from "vitest";
import {
  mergeCreatedItineraryItemIntoTrip,
  mergeUpdatedItineraryBranchIntoTrip,
} from "../../../itinerary-items";
import { seedTrip } from "../../../seed";
import { getTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";

describe("itinerary API merge helpers", () => {
  it("merges API-created itinerary items with placement path fields and patched branch items", () => {
    const existingItem = getTripFixtureItineraryItem("item-dimdim");
    const creationBaseItem = getTripFixtureItineraryItem("item-victoria-peak");
    const patchedExistingItem = {
      ...existingItem,
      activity: "Patched branch item",
      version: existingItem.version + 1,
    };
    const placementItem = {
      ...creationBaseItem,
      id: "item-created-draft",
      pathGroupId: "path-group-created",
      pathId: "path-created",
      pathName: "Created path",
      pathRole: "alternative" as const,
    };
    const createdItem = {
      ...placementItem,
      id: "item-created-api",
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
      version: 1,
    };

    const nextTrip = mergeCreatedItineraryItemIntoTrip(
      seedTrip,
      createdItem,
      { item: placementItem },
      [patchedExistingItem],
    );

    expect(
      nextTrip.itineraryItems.find((item) => item.id === patchedExistingItem.id),
    ).toMatchObject({
      activity: "Patched branch item",
      version: patchedExistingItem.version,
    });
    expect(nextTrip.itineraryItems.at(-1)).toMatchObject({
      id: "item-created-api",
      pathGroupId: "path-group-created",
      pathId: "path-created",
      pathName: "Created path",
      pathRole: "alternative",
    });
  });

  it("merges updated itinerary branch placement with patched API items first", () => {
    const editableItem = getTripFixtureItineraryItem("item-dimdim");
    const branchItem = getTripFixtureItineraryItem("item-victoria-peak");
    const editedItem = {
      ...editableItem,
      activity: "Edited item",
      pathId: "path-edited",
    };
    const branchChangedItem = {
      ...branchItem,
      activity: "Branch placement change",
      pathId: "path-branch",
    };
    const patchedBranchItem = {
      ...branchChangedItem,
      activity: "API patched branch change",
      version: branchChangedItem.version + 1,
    };
    const placement = {
      trip: {
        ...seedTrip,
        itineraryItems: seedTrip.itineraryItems.map((item) =>
          item.id === editedItem.id
            ? editedItem
            : item.id === branchChangedItem.id
            ? branchChangedItem
            : item,
        ),
      },
      item: editedItem,
      changedExistingItems: [branchChangedItem],
    };

    const nextTrip = mergeUpdatedItineraryBranchIntoTrip(
      seedTrip,
      editedItem.id,
      placement,
      [patchedBranchItem],
    );

    expect(nextTrip.itineraryItems.find((item) => item.id === editedItem.id)).toMatchObject({
      activity: "Edited item",
      pathId: "path-edited",
    });
    expect(
      nextTrip.itineraryItems.find((item) => item.id === branchChangedItem.id),
    ).toMatchObject({
      activity: "API patched branch change",
      pathId: "path-branch",
      version: patchedBranchItem.version,
    });
  });
});
