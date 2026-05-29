import { describe, expect, it } from "vitest";
import { buildExpenseSummary } from "./expenses";
import { seedTrip } from "./seed";
import {
  getNowNext,
  getTripDates,
  groupItemsByDay,
  parseTime,
  formatDayLabel,
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

  it("falls back for invalid trip dates and invalid display days", () => {
    expect(getTripDates("bad-date", "2025-05-20")).toEqual(["bad-date"]);
    expect(getTripDates("2025-05-21", "2025-05-20")).toEqual(["2025-05-21"]);
    expect(formatDayLabel("not-a-date", seedTrip.startDate)).toBe("not-a-date");
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

  it("reports invalid timing and missing movement details", () => {
    const item = {
      ...seedTrip.itineraryItems[0],
      startTime: "24:99",
      durationMinutes: 0,
      mapLink: " ",
      transportation: "",
    };

    expect(validateItineraryItem(item, [item]).map((warning) => warning.code)).toEqual([
      "invalid-start-time",
      "missing-duration",
      "missing-map-link",
      "missing-transportation",
    ]);
    expect(parseTime("23:59")).toBe(1439);
    expect(parseTime("7:30")).toBeNull();
    expect(validateItineraryItem({ ...item, startTime: " " }, [item]).map((warning) => warning.code)).toContain("missing-start-time");
  });

  it("derives now and next for the on-trip context", () => {
    const state = getNowNext(seedTrip.itineraryItems, "2025-05-16", "09:10");

    expect(state.current?.id).toBe("item-dimdim");
    expect(state.next?.id).toBe("item-victoria-peak");
    expect(state.fallbackReason).toBeNull();
  });

  it("explains now/next fallback states for invalid, empty, and completed days", () => {
    expect(getNowNext(seedTrip.itineraryItems, "2025-05-16", "bad")).toMatchObject({
      current: null,
      next: null,
      fallbackReason: "Current time is unavailable.",
    });
    expect(getNowNext(seedTrip.itineraryItems, "2099-01-01", "09:00")).toMatchObject({
      current: null,
      next: null,
      fallbackReason: "No timed stops for this day yet.",
    });
    expect(getNowNext(seedTrip.itineraryItems, "2025-05-16", "23:59")).toMatchObject({
      current: null,
      next: null,
      fallbackReason: "The day plan has ended.",
    });
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

  it("leaves add, resolved, and missing-target suggestions out of conflict handling", () => {
    const baseSuggestion = {
      id: "suggestion-add",
      tripId: seedTrip.id,
      planVariantId: seedTrip.activePlanVariantId,
      proposerId: "member-beam",
      type: "add" as const,
      targetItemId: null,
      sourceVersion: null,
      status: "pending" as const,
      proposedPatch: { activity: "Add dessert stop" },
      createdAt: "2026-05-27T12:00:00.000Z",
    };

    expect(detectSuggestionConflict(seedTrip.itineraryItems, baseSuggestion)).toBe(baseSuggestion);
    expect(approveSuggestion(seedTrip.itineraryItems, { ...baseSuggestion, type: "edit", targetItemId: null }).items).toBe(seedTrip.itineraryItems);
    expect(approveSuggestion(seedTrip.itineraryItems, { ...baseSuggestion, type: "edit", targetItemId: "missing-item" })).toMatchObject({
      status: "conflicted",
      suggestion: { status: "conflicted" },
    });
    expect(detectSuggestionConflict(seedTrip.itineraryItems, { ...baseSuggestion, status: "approved" })).toMatchObject({ status: "approved" });
  });

  it("summarizes owed, owing, and settled expense states", () => {
    expect(buildExpenseSummary([], "member-aom")).toMatchObject({
      groupSpend: 0,
      currentUserNetLabel: "You are settled",
      settlementSuggestions: [],
    });
    const summary = buildExpenseSummary(
      [
        {
          id: "expense-1",
          title: "Taxi",
          amount: 100.005,
          paidBy: "member-aom",
          splits: { "member-aom": 50.005, "member-beam": 50 },
          category: "transport",
        },
      ],
      "member-beam",
    );

    expect(summary.groupSpend).toBe(100.01);
    expect(summary.currentUserNetLabel).toBe("You owe HK$50.00");
    expect(summary.settlementSuggestions).toEqual([{ from: "member-beam", to: "member-aom", amount: 50 }]);

    expect(buildExpenseSummary([
      {
        id: "expense-mismatch",
        title: "Refunded deposit",
        amount: 100,
        paidBy: "member-aom",
        splits: { "member-aom": 90 },
        category: "settlement",
      },
    ], "member-aom").groupSpend).toBe(100);

    const currentMemberPaidOnly = buildExpenseSummary([
      {
        id: "expense-paid-only",
        title: "Deposit",
        amount: 25,
        paidBy: "member-aom",
        splits: {},
        category: "stay",
      },
    ], "member-aom");
    expect(currentMemberPaidOnly.currentUserNetLabel).toBe("You are owed HK$25.00");

    const zeroSettlement = buildExpenseSummary([
      {
        id: "expense-zero-share",
        title: "Zero adjustment",
        amount: 0,
        paidBy: "member-aom",
        splits: { "member-aom": 0 },
        category: "settlement",
      },
    ], "member-aom");
    expect(zeroSettlement.settlementSuggestions).toEqual([]);
  });

  it("summarizes shared expenses with current-user impact", () => {
    const summary = buildExpenseSummary(seedTrip.expenses, "member-aom");

    expect(summary.groupSpend).toBeGreaterThan(0);
    expect(summary.currentUserNetLabel).toMatch(/You/);
    expect(summary.settlementSuggestions.length).toBeGreaterThan(0);
  });

  it("saves through a repository boundary instead of direct UI storage", () => {
    const saved: string[] = [];
    const repository = createLocalTripRepository("test-storage", {
      load: () => saved[0] ?? null,
      save: (_key, value) => saved.push(value),
      remove: () => saved.splice(0),
    });

    repository.saveTrip(seedTrip);
    expect(repository.loadTrip().id).toBe(seedTrip.id);
    repository.clearDraft();
    expect(repository.loadTrip()).toBe(seedTrip);
    expect(repository.describeSource()).toEqual({
      mode: "demo",
      restBase: "demo-fixture",
    });
  });

  it("returns the seed trip when local draft JSON is corrupt", () => {
    const repository = createLocalTripRepository("test-storage", {
      load: () => "{",
      save: () => undefined,
      remove: () => undefined,
    });

    expect(repository.loadTrip()).toBe(seedTrip);
  });
});
