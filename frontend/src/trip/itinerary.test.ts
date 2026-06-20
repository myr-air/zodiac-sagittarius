import { describe, expect, it } from "vitest";
import { seedTrip } from "./seed";
import { hongKongDay, shenzhenDay } from "./itinerary.test-support";
import {
  buildItineraryCommitmentsByItemId,
  buildItineraryView,
  hasDescendantItem,
  moveTripItem,
  moveTripItemIntoPlanBlock,
  moveTripItemToDay,
} from "./itinerary";

describe("itinerary planning domain", () => {
  it("moves an itinerary item before a target and reorders the target day", () => {
    const updatedAt = "2026-06-16T00:00:00.000Z";
    const planVariantId = seedTrip.activePlanVariantId;
    const firstItem = seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!;
    const secondItem = seedTrip.itineraryItems.find((item) => item.id === "item-victoria-peak")!;

    const nextTrip = moveTripItem(seedTrip, secondItem.id, firstItem.id, planVariantId, updatedAt);
    const dayItems = nextTrip?.itineraryItems
      .filter((item) => item.day === firstItem.day && item.planVariantId === planVariantId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    expect(dayItems?.[0]).toMatchObject({
      id: secondItem.id,
      day: firstItem.day,
      parentItemId: firstItem.parentItemId ?? null,
      sortOrder: 100,
      updatedAt,
      version: secondItem.version + 1,
    });
    expect(dayItems?.[1]).toMatchObject({ id: firstItem.id, sortOrder: 200 });
  });

  it("moves an itinerary item to the end of another day and clears its parent", () => {
    const updatedAt = "2026-06-16T00:00:00.000Z";
    const planVariantId = seedTrip.activePlanVariantId;
    const draggedItem = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!,
      parentItemId: "item-parent",
    };
    const trip = {
      ...seedTrip,
      itineraryItems: seedTrip.itineraryItems.map((item) =>
        item.id === draggedItem.id ? draggedItem : item,
      ),
    };

    const nextTrip = moveTripItemToDay(trip, draggedItem.id, shenzhenDay, planVariantId, updatedAt);
    const movedItem = nextTrip?.itineraryItems.find((item) => item.id === draggedItem.id);

    expect(movedItem).toMatchObject({
      day: shenzhenDay,
      parentItemId: null,
      updatedAt,
      version: draggedItem.version + 1,
    });
    expect(movedItem?.sortOrder).toBeGreaterThan(0);
  });

  it("moves an itinerary item inside a plan block after existing children", () => {
    const updatedAt = "2026-06-16T00:00:00.000Z";
    const planVariantId = seedTrip.activePlanVariantId;
    const planBlock = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!,
      id: "item-plan-block",
      isPlanBlock: true,
      sortOrder: 100,
    };
    const child = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-victoria-peak")!,
      id: "item-existing-child",
      parentItemId: planBlock.id,
      sortOrder: 200,
    };
    const draggedItem = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-pacific-place")!,
      id: "item-dragged-activity",
      sortOrder: 300,
    };
    const trip = {
      ...seedTrip,
      itineraryItems: [planBlock, child, draggedItem],
    };

    const nextTrip = moveTripItemIntoPlanBlock(
      trip,
      draggedItem.id,
      planBlock.id,
      planVariantId,
      updatedAt,
    );
    const movedItem = nextTrip?.itineraryItems.find((item) => item.id === draggedItem.id);
    const orderedIds = nextTrip?.itineraryItems
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => item.id);

    expect(movedItem).toMatchObject({
      parentItemId: planBlock.id,
      day: planBlock.day,
      sortOrder: 300,
      updatedAt,
      version: draggedItem.version + 1,
    });
    expect(orderedIds).toEqual([planBlock.id, child.id, draggedItem.id]);
  });

  it("rejects hierarchy moves that would nest a plan block under a child or create a cycle", () => {
    const updatedAt = "2026-06-16T00:00:00.000Z";
    const planVariantId = seedTrip.activePlanVariantId;
    const planBlock = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!,
      id: "item-plan-block",
      isPlanBlock: true,
      sortOrder: 100,
    };
    const child = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-victoria-peak")!,
      id: "item-child",
      parentItemId: planBlock.id,
      sortOrder: 200,
    };
    const grandchild = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-pacific-place")!,
      id: "item-grandchild",
      parentItemId: child.id,
      sortOrder: 300,
    };
    const trip = {
      ...seedTrip,
      itineraryItems: [planBlock, child, grandchild],
    };

    expect(hasDescendantItem(trip.itineraryItems, planBlock.id, grandchild.id)).toBe(true);
    expect(moveTripItem(trip, planBlock.id, child.id, planVariantId, updatedAt)).toBeNull();
    expect(moveTripItemIntoPlanBlock(trip, planBlock.id, child.id, planVariantId, updatedAt)).toBeNull();
  });

  it("builds a shared itinerary view with sorted items and warning totals", () => {
    const selectedItems = [
      {
        ...seedTrip.itineraryItems.find((item) => item.id === "item-victoria-peak")!,
        id: "item-overlap-a",
        day: hongKongDay,
        sortOrder: 300,
        startTime: "09:30",
        durationMinutes: 45,
      },
      {
        ...seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!,
        id: "item-overlap-b",
        day: hongKongDay,
        sortOrder: 100,
        startTime: "09:00",
        durationMinutes: 60,
      },
      {
        ...seedTrip.itineraryItems.find((item) => item.id === "item-pacific-place")!,
        id: "item-safe-stop",
        day: hongKongDay,
        sortOrder: 200,
        startTime: "11:00",
        durationMinutes: 30,
      },
      {
        ...seedTrip.itineraryItems.find((item) => item.id === "item-temple-street")!,
        id: "item-invalid-fields",
        day: hongKongDay,
        sortOrder: 400,
        startTime: "24:99",
        durationMinutes: 0,
        mapLink: " ",
        transportation: " ",
      },
      {
        ...seedTrip.itineraryItems.find((item) => item.id === "item-checkout")!,
        id: "item-other-day",
      },
    ];

    const view = buildItineraryView(selectedItems);

    expect(view.sortedItems.map((item) => item.id)).toEqual([
      "item-overlap-b",
      "item-overlap-a",
      "item-safe-stop",
      "item-invalid-fields",
      "item-other-day",
    ]);
    expect(view.dayGroups.map((group) => ({
      day: group.day,
      warningCount: group.warningCount,
      ids: group.items.map((item) => item.id),
    }))).toEqual([
      {
        day: hongKongDay,
        warningCount: 6,
        ids: ["item-overlap-b", "item-overlap-a", "item-safe-stop", "item-invalid-fields"],
      },
      {
        day: shenzhenDay,
        warningCount: 0,
        ids: ["item-other-day"],
      },
    ]);
    expect(view.routeDayStats).toEqual([
      {
        day: hongKongDay,
        itemCount: 4,
        coordinateItemCount: 4,
        warningCount: 6,
      },
      {
        day: shenzhenDay,
        itemCount: 1,
        coordinateItemCount: 1,
        warningCount: 0,
      },
    ]);
  });

  it("summarizes linked bookings, expenses, notes, and open tasks by itinerary item", () => {
    const commitments = buildItineraryCommitmentsByItemId({
      bookingDocs: [
        {
          relatedItineraryItemIds: ["item-dimdim", "item-peak"],
        },
        {
          relatedItineraryItemIds: ["item-dimdim"],
        },
      ],
      expenses: [
        { itineraryItemId: "item-dimdim" },
        { itineraryItemId: null },
      ],
      stopNotes: [
        { itemId: "item-dimdim" },
        { itemId: "item-peak" },
      ],
      tasks: [
        { relatedItemId: "item-dimdim", status: "open" },
        { relatedItemId: "item-dimdim", status: "done" },
        { relatedItemId: "item-peak", status: "open" },
      ],
    });

    expect(commitments).toEqual({
      "item-dimdim": {
        bookingCount: 2,
        expenseCount: 1,
        noteCount: 1,
        openTaskCount: 1,
      },
      "item-peak": {
        bookingCount: 1,
        noteCount: 1,
        openTaskCount: 1,
      },
    });
  });

});
