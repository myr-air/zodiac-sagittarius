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
      "2025-05-15",
      "2025-05-16",
      "2025-05-17",
      "2025-05-18",
      "2025-05-19",
      "2025-05-20",
    ]);
    expect(groups[0]?.day).toBe("2025-05-15");
    expect(groups[0]?.items.map((item) => item.id)).toEqual([
      "item-flight-bkk-hkg",
      "item-arrive-hkg",
      "item-airport-express",
      "item-hotel-checkin",
      "item-avenue-stars",
      "item-symphony-lights",
      "item-temple-street",
    ]);
  });

  it("finds validation issues without relying on color alone", () => {
    const dayItems = sortItemsForDay(seedTrip.itineraryItems, "2025-05-16");
    const missing = seedTrip.itineraryItems.find((item) => item.id === "item-arrive-hkg");
    const dimsum = dayItems.find((item) => item.id === "item-dimdim")!;
    const overlapFixture = { ...dimsum, id: "item-overlap-fixture", startTime: "09:00", durationMinutes: 90 };

    expect(validateItineraryItem(missing!, [missing!]).map((warning) => warning.code)).toContain("missing-duration");
    expect(validateItineraryItem(dimsum, [...dayItems, overlapFixture]).map((warning) => warning.code)).toContain("overlap");
    expect(validateItineraryItem(dimsum, [...dayItems, overlapFixture])[0]?.message).toMatch(/overlaps|เวลา/i);
  });

  it("derives now and next for the on-trip context", () => {
    const state = getNowNext(seedTrip.itineraryItems, "2025-05-16", "09:10");

    expect(state.current?.id).toBe("item-dimdim");
    expect(state.next?.id).toBe("item-victoria-peak");
    expect(state.fallbackReason).toBeNull();
  });

  it("detects stale suggestion conflicts and approves fresh suggestions", () => {
    const target = seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!;
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
      mode: "demo",
      restBase: "demo-fixture",
    });
  });
});
