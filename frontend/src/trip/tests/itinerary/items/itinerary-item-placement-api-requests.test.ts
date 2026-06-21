import { describe, expect, it } from "vitest";
import {
  buildMoveItineraryItemRequest,
  buildMoveItineraryItemToDayRequest,
  buildReorderItineraryItemsRequest,
  buildShiftItineraryItemDayRequest,
} from "../../../itinerary-items";

describe("itinerary item placement API request builders", () => {
  it("builds move itinerary item patch requests", () => {
    expect(
      buildMoveItineraryItemRequest(
        {
          day: "2025-05-18",
          parentItemId: "plan-block-1",
          sortOrder: 250,
        },
        {
          clientMutationId: "mutation-3",
          expectedVersion: 4,
        },
      ),
    ).toEqual({
      clientMutationId: "mutation-3",
      expectedVersion: 4,
      patch: {
        day: "2025-05-18",
        parentItemId: "plan-block-1",
        sortOrder: 250,
      },
    });
  });

  it("builds move itinerary item to day patch requests", () => {
    expect(
      buildMoveItineraryItemToDayRequest({
        clientMutationId: "mutation-5",
        expectedVersion: 9,
        targetDay: "2025-05-19",
      }),
    ).toEqual({
      clientMutationId: "mutation-5",
      expectedVersion: 9,
      patch: {
        day: "2025-05-19",
        parentItemId: null,
      },
    });
  });

  it("builds shifted itinerary item day patch requests without changing parent placement", () => {
    expect(
      buildShiftItineraryItemDayRequest({
        clientMutationId: "mutation-7",
        expectedVersion: 14,
        shiftedDay: "2025-05-20",
      }),
    ).toEqual({
      clientMutationId: "mutation-7",
      expectedVersion: 14,
      patch: {
        day: "2025-05-20",
      },
    });
  });

  it("builds reorder itinerary item requests from sorted day items", () => {
    expect(
      buildReorderItineraryItemsRequest(
        [
          {
            id: "later",
            sortOrder: 200,
            startTime: "09:00",
          },
          {
            id: "earlier",
            sortOrder: 100,
            startTime: "11:00",
          },
          {
            id: "tie-breaker",
            sortOrder: 200,
            startTime: "08:30",
          },
        ],
        {
          clientMutationId: "mutation-4",
          day: "2025-05-18",
          planVariantId: "plan-main",
        },
      ),
    ).toEqual({
      clientMutationId: "mutation-4",
      planVariantId: "plan-main",
      day: "2025-05-18",
      itemIds: ["earlier", "tie-breaker", "later"],
    });
  });
});
