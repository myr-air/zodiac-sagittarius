import { describe, expect, it } from "vitest";
import { seedTrip } from "../../../seed";
import { buildTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  appendItineraryItemPlacement,
  appendItineraryItemToTrip,
  deleteItineraryItemFromTrip,
  replaceItineraryItem,
  replaceItineraryItems,
} from "../../../itinerary-items";

describe("itinerary collection mutations", () => {
  it("appends itinerary items to trips without branch side effects", () => {
    const item = buildTripFixtureItineraryItem({
      id: "item-appended",
      activity: "Appended item",
    });

    const nextTrip = appendItineraryItemToTrip(seedTrip, item);
    const placement = appendItineraryItemPlacement(seedTrip, item);

    expect(nextTrip).not.toBe(seedTrip);
    expect(nextTrip.itineraryItems.at(-1)).toEqual(item);
    expect(seedTrip.itineraryItems.some((candidate) => candidate.id === item.id)).toBe(false);
    expect(placement).toEqual({
      trip: nextTrip,
      item,
      changedExistingItems: [],
    });
  });

  it("replaces one itinerary item without changing other trip records", () => {
    const item = seedTrip.itineraryItems[0]!;
    const updatedItem = { ...item, activity: "Updated activity" };

    const nextTrip = replaceItineraryItem(seedTrip, updatedItem);

    expect(nextTrip.itineraryItems.find((candidate) => candidate.id === item.id)).toEqual(updatedItem);
    expect(nextTrip.itineraryItems).toHaveLength(seedTrip.itineraryItems.length);
  });

  it("replaces multiple itinerary items without changing unrelated items", () => {
    const firstItem = seedTrip.itineraryItems[0]!;
    const secondItem = seedTrip.itineraryItems[1]!;
    const updatedFirst = { ...firstItem, activity: "Updated first activity" };
    const updatedSecond = { ...secondItem, activity: "Updated second activity" };

    const nextTrip = replaceItineraryItems(seedTrip, [
      updatedFirst,
      updatedSecond,
    ]);

    expect(
      nextTrip.itineraryItems.find((candidate) => candidate.id === firstItem.id),
    ).toEqual(updatedFirst);
    expect(
      nextTrip.itineraryItems.find(
        (candidate) => candidate.id === secondItem.id,
      ),
    ).toEqual(updatedSecond);
    expect(nextTrip.itineraryItems).toHaveLength(seedTrip.itineraryItems.length);
  });

  it("deletes an itinerary item and removes expenses linked to it", () => {
    const item = seedTrip.itineraryItems[0]!;
    const linkedExpense = {
      ...seedTrip.expenses[0]!,
      id: "expense-linked-item",
      itineraryItemId: item.id,
    };
    const unrelatedExpense = {
      ...seedTrip.expenses[0]!,
      id: "expense-unrelated-item",
      itineraryItemId: "other-item",
    };
    const trip = {
      ...seedTrip,
      expenses: [linkedExpense, unrelatedExpense],
    };

    const nextTrip = deleteItineraryItemFromTrip(trip, item.id);

    expect(nextTrip.itineraryItems.some((candidate) => candidate.id === item.id)).toBe(false);
    expect(nextTrip.expenses).toEqual([unrelatedExpense]);
  });
});
