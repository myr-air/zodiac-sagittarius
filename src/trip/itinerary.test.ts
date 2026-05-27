import { describe, expect, it } from "vitest";
import { buildExpenseSummary } from "./expenses";
import { seedTrip } from "./seed";
import {
  getNowNext,
  getTripDates,
  groupItemsByDay,
  sortItemsForDay,
  validateItineraryItem,
} from "./itinerary";
import { createLocalTripRepository } from "./repository";
import { approveSuggestion, detectSuggestionConflict } from "./suggestions";

describe("itinerary planning domain", () => {
  it("groups and sorts selected plan items by day", () => {
    const items = seedTrip.itineraryItems.filter((item) => item.planVariantId === seedTrip.activePlanVariantId);
    const groups = groupItemsByDay(items);

    expect(getTripDates(seedTrip.startDate, seedTrip.endDate)).toEqual([
      "2026-06-18",
      "2026-06-19",
      "2026-06-20",
      "2026-06-21",
      "2026-06-22",
    ]);
    expect(groups[0]?.day).toBe("2026-06-18");
    expect(groups[0]?.items.map((item) => item.id)).toEqual([
      "item-dmk-checkin",
      "item-flight-hkg",
      "item-lan-fong-yuen",
      "item-avenue-stars",
    ]);
  });

  it("finds validation issues without relying on color alone", () => {
    const dayItems = sortItemsForDay(seedTrip.itineraryItems, "2026-06-18");
    const missing = dayItems.find((item) => item.id === "item-dmk-checkin");
    const overlapping = dayItems.find((item) => item.id === "item-lan-fong-yuen");

    expect(validateItineraryItem(missing!, dayItems).map((warning) => warning.code)).toContain("missing-start-time");
    expect(validateItineraryItem(overlapping!, dayItems).map((warning) => warning.code)).toContain("overlap");
    expect(validateItineraryItem(overlapping!, dayItems)[0]?.message).toMatch(/overlaps|เวลา/i);
  });

  it("derives now and next for the on-trip context", () => {
    const state = getNowNext(seedTrip.itineraryItems, "2026-06-18", "13:45");

    expect(state.current?.id).toBe("item-lan-fong-yuen");
    expect(state.next?.id).toBe("item-avenue-stars");
    expect(state.fallbackReason).toBeNull();
  });

  it("detects stale suggestion conflicts and approves fresh suggestions", () => {
    const target = seedTrip.itineraryItems.find((item) => item.id === "item-lan-fong-yuen")!;
    const conflicted = detectSuggestionConflict(seedTrip.itineraryItems, {
      id: "suggestion-stale",
      tripId: seedTrip.id,
      planVariantId: seedTrip.activePlanVariantId,
      proposerId: "member-beam",
      type: "edit",
      targetItemId: target.id,
      sourceVersion: target.version - 1,
      status: "pending",
      proposedPatch: { note: "ขอเลื่อนร้านนี้หลังเช็คอิน" },
      createdAt: "2026-05-27T12:00:00.000Z",
    });

    const approved = approveSuggestion(seedTrip.itineraryItems, {
      ...conflicted,
      id: "suggestion-fresh",
      sourceVersion: target.version,
      status: "pending",
    });

    expect(conflicted.status).toBe("conflicted");
    expect(approved.status).toBe("approved");
    expect(approved.items.find((item) => item.id === target.id)?.note).toBe("ขอเลื่อนร้านนี้หลังเช็คอิน");
  });

  it("summarizes shared expenses with current-user impact", () => {
    const summary = buildExpenseSummary(seedTrip.expenses, "member-aom");

    expect(summary.groupSpend).toBeGreaterThan(0);
    expect(summary.currentUserNetLabel).toMatch(/You/);
    expect(summary.settlementSuggestions.length).toBeGreaterThan(0);
  });

  it("saves through a repository boundary instead of direct UI storage", () => {
    const repository = createLocalTripRepository("test-storage", {
      load: () => null,
      save: () => undefined,
      remove: () => undefined,
    });

    expect(repository.describeSource()).toEqual({
      mode: "local",
      futureRestBase: "/trips/:tripId",
      futureWebSocketEvents: expect.arrayContaining(["trip.updated", "presence.updated"]),
    });
  });
});
