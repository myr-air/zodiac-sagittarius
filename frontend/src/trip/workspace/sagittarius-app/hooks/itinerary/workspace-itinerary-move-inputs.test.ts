import { describe, expect, it } from "vitest";
import {
  moveTripItem,
  moveTripItemIntoPlanBlock,
} from "@/src/trip/itinerary";
import {
  buildMoveItineraryItemRequest,
  buildMoveItineraryItemToDayRequest,
  buildReorderItineraryItemsRequest,
} from "@/src/trip/itinerary-api-requests";
import { seedTrip } from "@/src/trip/seed";
import { getTripFixtureItineraryItem } from "@/src/trip/trip-fixtures";
import { shenzhenDay } from "@/src/trip/tests/itinerary/core/itinerary.test-support";
import { workspaceLocalMutationTimestamp } from "../../support/local-mutations";
import {
  buildWorkspaceMoveItemPatchRequest,
  buildWorkspaceMoveItemToDayPatchRequest,
  buildWorkspaceReorderApiInput,
} from "./workspace-itinerary-move-inputs";

const selectedTripPlanId = seedTrip.activePlanVariantId;

describe("workspace itinerary move inputs", () => {
  it("builds placement patch requests from original and moved items", () => {
    const planBlock = {
      ...getTripFixtureItineraryItem("item-dimdim"),
      id: "item-plan-block",
      isPlanBlock: true,
      sortOrder: 100,
    };
    const draggedItem = {
      ...getTripFixtureItineraryItem("item-pacific-place"),
      id: "item-dragged-activity",
      sortOrder: 300,
    };
    const trip = {
      ...seedTrip,
      itineraryItems: [planBlock, draggedItem],
    };
    const nextTrip = moveTripItemIntoPlanBlock(
      trip,
      draggedItem.id,
      planBlock.id,
      selectedTripPlanId,
      workspaceLocalMutationTimestamp,
    )!;
    const movedItem = nextTrip.itineraryItems.find(
      (item) => item.id === draggedItem.id,
    )!;

    expect(
      buildWorkspaceMoveItemPatchRequest({
        clientMutationId: "mutation-move",
        itemId: draggedItem.id,
        nextTrip,
        trip,
      }),
    ).toEqual(
      buildMoveItineraryItemRequest(movedItem, {
        clientMutationId: "mutation-move",
        expectedVersion: draggedItem.version,
      }),
    );
  });

  it("builds day move patch requests from the original item version", () => {
    const draggedItem = getTripFixtureItineraryItem("item-dimdim");

    expect(
      buildWorkspaceMoveItemToDayPatchRequest({
        clientMutationId: "mutation-day",
        itemId: draggedItem.id,
        targetDay: shenzhenDay,
        trip: seedTrip,
      }),
    ).toEqual(
      buildMoveItineraryItemToDayRequest({
        clientMutationId: "mutation-day",
        expectedVersion: draggedItem.version,
        targetDay: shenzhenDay,
      }),
    );
  });

  it("resolves same-day drag moves to reorder requests", () => {
    const draggedItem = getTripFixtureItineraryItem("item-victoria-peak");
    const targetItem = getTripFixtureItineraryItem("item-dimdim");
    const nextTrip = moveTripItem(
      seedTrip,
      draggedItem.id,
      targetItem.id,
      selectedTripPlanId,
      workspaceLocalMutationTimestamp,
    )!;
    const reorderedDayItems = nextTrip.itineraryItems.filter(
      (item) =>
        item.planVariantId === targetItem.planVariantId &&
        item.day === targetItem.day,
    );
    let moveIdCalls = 0;
    let reorderIdCalls = 0;

    expect(
      buildWorkspaceReorderApiInput({
        draggedItemId: draggedItem.id,
        getMoveClientMutationId: () => {
          moveIdCalls += 1;
          return "mutation-move";
        },
        getReorderClientMutationId: () => {
          reorderIdCalls += 1;
          return "mutation-reorder";
        },
        nextTrip,
        targetItemId: targetItem.id,
        trip: seedTrip,
      }),
    ).toEqual({
      kind: "reorder",
      request: buildReorderItineraryItemsRequest(reorderedDayItems, {
        clientMutationId: "mutation-reorder",
        day: targetItem.day,
        planVariantId: targetItem.planVariantId,
      }),
    });
    expect(moveIdCalls).toBe(0);
    expect(reorderIdCalls).toBe(1);
  });

  it("resolves cross-day drag moves to placement patch requests", () => {
    const draggedItem = getTripFixtureItineraryItem("item-flight-bkk-hkg");
    const targetItem = getTripFixtureItineraryItem("item-dimdim");
    const nextTrip = moveTripItem(
      seedTrip,
      draggedItem.id,
      targetItem.id,
      selectedTripPlanId,
      workspaceLocalMutationTimestamp,
    )!;
    const movedItem = nextTrip.itineraryItems.find(
      (item) => item.id === draggedItem.id,
    )!;
    let moveIdCalls = 0;
    let reorderIdCalls = 0;

    expect(
      buildWorkspaceReorderApiInput({
        draggedItemId: draggedItem.id,
        getMoveClientMutationId: () => {
          moveIdCalls += 1;
          return "mutation-move";
        },
        getReorderClientMutationId: () => {
          reorderIdCalls += 1;
          return "mutation-reorder";
        },
        nextTrip,
        targetItemId: targetItem.id,
        trip: seedTrip,
      }),
    ).toEqual({
      kind: "move",
      request: buildMoveItineraryItemRequest(movedItem, {
        clientMutationId: "mutation-move",
        expectedVersion: draggedItem.version,
      }),
    });
    expect(moveIdCalls).toBe(1);
    expect(reorderIdCalls).toBe(0);
  });

  it("returns null when required move items are missing", () => {
    expect(
      buildWorkspaceMoveItemPatchRequest({
        clientMutationId: "mutation-move",
        itemId: "missing",
        nextTrip: seedTrip,
        trip: seedTrip,
      }),
    ).toBeNull();
    expect(
      buildWorkspaceReorderApiInput({
        draggedItemId: "missing",
        getMoveClientMutationId: () => "mutation-move",
        getReorderClientMutationId: () => "mutation-reorder",
        nextTrip: seedTrip,
        targetItemId: "item-dimdim",
        trip: seedTrip,
      }),
    ).toBeNull();
  });
});
