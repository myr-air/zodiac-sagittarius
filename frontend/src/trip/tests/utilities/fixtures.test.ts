import { describe, expect, it } from "vitest";
import {
  buildDenseTripFixture,
  buildEmptyTripFixture,
  getTripFixtureMember,
  getTripFixtureMemberById,
  tripFixture,
} from "@/src/trip/testing/fixtures/trip-fixtures";
import { buildDenseTripFixture as buildDenseTripFixtureDirect } from "@/src/trip/testing/fixtures/dense-trip-fixture";
import { tripRoleValues } from "../../members";

describe("trip fixtures", () => {
  it("exposes deterministic owner, traveler, and viewer members", () => {
    expect(tripRoleValues.map((role) => getTripFixtureMember(role).role)).toEqual(tripRoleValues);
    expect(getTripFixtureMemberById("member-beam").role).toBe("organizer");
    expect(tripFixture.currentMembers.owner.id).toBe(getTripFixtureMember("owner").id);
  });

  it("keeps shared suggestions, tasks, stop notes, and expense summaries deterministic", () => {
    expect(tripFixture.suggestions.map((suggestion) => suggestion.id)).toEqual([
      "suggestion-rating",
      "suggestion-booking",
    ]);
    expect(tripFixture.tasks.map((task) => task.id)).toEqual([
      "task-esim",
      "task-passport-nam",
      "task-hotel-names",
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

    expect(buildDenseTripFixtureDirect).toBe(buildDenseTripFixture);
    expect(empty.itineraryItems).toEqual([]);
    expect(dense.itineraryItems.length).toBeGreaterThanOrEqual(100);
    expect(new Set(dense.itineraryItems.map((item) => item.day)).size).toBeGreaterThanOrEqual(10);
    expect(new Set(dense.itineraryItems.map((item) => item.pathId ?? "main")).size).toBeGreaterThanOrEqual(3);
    expect(dense.members.length).toBeGreaterThanOrEqual(24);
    expect(dense.expenses.length).toBeGreaterThanOrEqual(60);
    expect(tripFixture.trip.itineraryItems.length).toBeGreaterThan(0);
    expect(dense.itineraryItems[0]).not.toBe(tripFixture.trip.itineraryItems[0]);
  });
});
