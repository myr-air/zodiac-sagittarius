import { describe, expect, it, vi } from "vitest";
import { patchApiItineraryBranchItems } from "../../../itinerary-paths-api";
import type { TripApiClient } from "../../../api-client";
import type { ItineraryItem } from "../../../types";
import { pathIdPlanA, pathNamePlanA } from "@/src/trip/testing/fixtures/itinerary-path-fixtures";

describe("itinerary path API adapter", () => {
  it("patches branch root items with current path fields", async () => {
    const rootItem = itineraryItem({
      id: "item-root",
      pathGroupId: "path-group-root",
      pathId: pathIdPlanA,
      pathName: pathNamePlanA,
      pathRole: "alternative",
      version: 4,
    });
    const apiClient = apiClientStub((itemId) => ({
      ...rootItem,
      id: itemId,
      version: 5,
    }));

    const patchedItems = await patchApiItineraryBranchItems({
      apiClient,
      items: [rootItem],
      nextClientMutationId: (prefix) => `${prefix}-mutation`,
      sessionToken: "session-token",
      tripId: "trip-1",
    });

    expect(apiClient.patchItineraryItem).toHaveBeenCalledWith(
      "trip-1",
      "item-root",
      "session-token",
      {
        clientMutationId: "itinerary-branch-mutation",
        expectedVersion: 4,
        patch: {
          pathGroupId: "path-group-root",
          pathId: pathIdPlanA,
          pathName: pathNamePlanA,
          pathRole: "alternative",
        },
      },
    );
    expect(patchedItems).toEqual([{ ...rootItem, version: 5 }]);
  });

  it("skips child items when their parent branch item is patched in the same batch", async () => {
    const parentItem = itineraryItem({ id: "item-parent", version: 2 });
    const childItem = itineraryItem({
      id: "item-child",
      parentItemId: "item-parent",
      version: 3,
    });
    const apiClient = apiClientStub((itemId) => itineraryItem({ id: itemId }));

    await patchApiItineraryBranchItems({
      apiClient,
      items: [parentItem, childItem],
      nextClientMutationId: (prefix) => `${prefix}-mutation`,
      sessionToken: "session-token",
      tripId: "trip-1",
    });

    expect(apiClient.patchItineraryItem).toHaveBeenCalledTimes(1);
    expect(apiClient.patchItineraryItem).toHaveBeenCalledWith(
      "trip-1",
      "item-parent",
      "session-token",
      expect.objectContaining({ expectedVersion: 2 }),
    );
  });
});

function apiClientStub(
  patchItineraryItem: (itemId: string) => ItineraryItem,
): TripApiClient {
  return {
    patchItineraryItem: vi.fn(async (_tripId, itemId) =>
      patchItineraryItem(itemId),
    ),
  } as unknown as TripApiClient;
}

function itineraryItem(input: Partial<ItineraryItem>): ItineraryItem {
  return {
    activity: "Dim Dim Sum",
    activityType: "food",
    createdBy: "member-aom",
    day: "2026-06-19",
    details: {},
    durationMinutes: 60,
    id: "item-root",
    linkLabel: "",
    mapLink: "",
    note: "",
    parentItemId: undefined,
    pathGroupId: undefined,
    pathId: undefined,
    pathName: undefined,
    pathRole: "main",
    place: "The Elements",
    planVariantId: "plan-main",
    sortOrder: 100,
    startTime: "08:30",
    transportation: "walk",
    tripId: "trip-1",
    updatedAt: "2026-06-16T00:00:00.000Z",
    version: 1,
    ...input,
  };
}
