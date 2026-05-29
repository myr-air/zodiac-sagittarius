import { describe, expect, it } from "vitest";
import {
  buildDenseTripFixture,
  buildEmptyTripFixture,
  getTripFixtureMember,
  tripFixture,
} from "./fixtures";

describe("trip fixtures", () => {
  it("exposes deterministic owner, traveler, and viewer members", () => {
    expect(getTripFixtureMember("owner").role).toBe("owner");
    expect(getTripFixtureMember("traveler").role).toBe("traveler");
    expect(getTripFixtureMember("viewer").role).toBe("viewer");
    expect(tripFixture.currentMembers.owner.id).toBe(getTripFixtureMember("owner").id);
  });

  it("keeps shared suggestions, tasks, stop notes, and expense summaries deterministic", () => {
    expect(tripFixture.suggestions.map((suggestion) => suggestion.id)).toEqual([
      "suggestion-rating",
      "suggestion-booking",
    ]);
    expect(tripFixture.tasks.map((task) => task.id)).toEqual([
      "task-esim",
      "task-peak-tram",
      "task-dimdim-booking",
      "task-expenses",
    ]);
    expect(tripFixture.stopNotes).toHaveLength(1);
    expect(tripFixture.expenseSummaries.owner.groupSpend).toBeGreaterThan(0);
  });

  it("builds empty and dense trip states without mutating the base seed", () => {
    const empty = buildEmptyTripFixture();
    const dense = buildDenseTripFixture();

    expect(empty.itineraryItems).toEqual([]);
    expect(dense.itineraryItems.length).toBeGreaterThan(tripFixture.trip.itineraryItems.length);
    expect(tripFixture.trip.itineraryItems.length).toBeGreaterThan(0);
    expect(dense.itineraryItems[0]).not.toBe(tripFixture.trip.itineraryItems[0]);
  });
});
