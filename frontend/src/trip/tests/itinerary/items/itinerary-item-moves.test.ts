import { describe, expect, it } from "vitest";
import { seedTrip } from "../../../seed";
import { getTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";
import { shenzhenDay } from "../../../testing/itinerary-test-days";
import {
  hasDescendantItem,
  moveTripItem,
  moveTripItemIntoPlanBlock,
  moveTripItemToDay,
} from "../../../itinerary";

describe("itinerary item moves", () => {
  it("moves an itinerary item before a target and reorders the target day", () => {
    const updatedAt = "2026-06-16T00:00:00.000Z";
    const planVariantId = seedTrip.activePlanVariantId;
    const firstItem = getTripFixtureItineraryItem("item-dimdim");
    const secondItem = getTripFixtureItineraryItem("item-victoria-peak");

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
      ...getTripFixtureItineraryItem("item-dimdim"),
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
      ...getTripFixtureItineraryItem("item-dimdim"),
      id: "item-plan-block",
      isPlanBlock: true,
      sortOrder: 100,
    };
    const child = {
      ...getTripFixtureItineraryItem("item-victoria-peak"),
      id: "item-existing-child",
      parentItemId: planBlock.id,
      sortOrder: 200,
    };
    const draggedItem = {
      ...getTripFixtureItineraryItem("item-pacific-place"),
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
      ...getTripFixtureItineraryItem("item-dimdim"),
      id: "item-plan-block",
      isPlanBlock: true,
      sortOrder: 100,
    };
    const child = {
      ...getTripFixtureItineraryItem("item-victoria-peak"),
      id: "item-child",
      parentItemId: planBlock.id,
      sortOrder: 200,
    };
    const grandchild = {
      ...getTripFixtureItineraryItem("item-pacific-place"),
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
});
