import { describe, expect, it } from "vitest";
import { buildExpenseSummary } from "./expenses";
import { seedTrip } from "./seed";
import { hongKongDay, shenzhenDay } from "./itinerary.test-support";
import {
  buildItineraryCommitmentsByItemId,
  buildItineraryView,
  formatDayLabel,
  getNowNext,
  getTripDates,
  hasDescendantItem,
  moveTripItem,
  moveTripItemIntoPlanBlock,
  moveTripItemToDay,
  parseTime,
  sortItemsForDay,
  validateItineraryItem,
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

  it("keeps invalid field warning totals stable in shared derive", () => {
    const invalidDayItem = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!,
      id: "item-invalid-fields-only",
      day: hongKongDay,
      sortOrder: 999,
      startTime: " ",
      durationMinutes: 0,
      mapLink: " ",
      transportation: " ",
    };

    const view = buildItineraryView([invalidDayItem]);

    expect(view.warningCount).toBe(4);
    expect(view.dayGroups[0]?.warningCount).toBe(4);
  });

  it("falls back for invalid trip dates and invalid display days", () => {
    expect(getTripDates("bad-date", "2026-06-23")).toEqual(["bad-date"]);
    expect(getTripDates("2026-06-23", "2025-05-21")).toEqual(["2026-06-23"]);
    expect(formatDayLabel("not-a-date", seedTrip.startDate)).toBe("not-a-date");
  });

  it("formats day labels in the active locale", () => {
    expect(formatDayLabel(hongKongDay, seedTrip.startDate)).toBe("Day 2");
    expect(formatDayLabel(shenzhenDay, seedTrip.startDate, "th")).toBe("วันที่ 3");
  });

  it("finds validation issues without relying on color alone", () => {
    const dayItems = sortItemsForDay(seedTrip.itineraryItems, hongKongDay);
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

  it("uses explicit end time windows when duration is not set", () => {
    const overnight = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!,
      id: "item-explicit-window",
      day: hongKongDay,
      startTime: "23:00",
      endTime: "02:00",
      endOffsetDays: 1,
      durationMinutes: null,
    };

    expect(
      validateItineraryItem(overnight, [overnight]).map(
        (warning) => warning.code,
      ),
    ).not.toContain("missing-duration");
    expect(getNowNext([overnight], hongKongDay, "23:30").current?.id).toBe(
      "item-explicit-window",
    );
  });

  it("derives now and next for the on-trip context", () => {
    const state = getNowNext(seedTrip.itineraryItems, hongKongDay, "09:10");

    expect(state.current?.id).toBe("item-dimdim");
    expect(state.next?.id).toBe("item-victoria-peak");
    expect(state.fallbackReason).toBeNull();
  });

  it("explains now/next fallback states for invalid, empty, and completed days", () => {
    expect(getNowNext(seedTrip.itineraryItems, hongKongDay, "bad")).toMatchObject({
      current: null,
      next: null,
      fallbackReason: "Current time is unavailable.",
    });
    expect(getNowNext(seedTrip.itineraryItems, "2099-01-01", "09:00")).toMatchObject({
      current: null,
      next: null,
      fallbackReason: "No timed stops for this day yet.",
    });
    expect(getNowNext(seedTrip.itineraryItems, hongKongDay, "23:59")).toMatchObject({
      current: null,
      next: null,
      fallbackReason: "The day plan has ended.",
    });
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
    expect(summary.settlementSuggestions).toEqual([{ from: "member-beam", to: "member-aom", amount: 50, currency: "HKD" }]);

    expect(buildExpenseSummary([
      {
        id: "expense-mismatch",
        title: "Refunded deposit",
        amount: 100,
        paidBy: "member-aom",
        splits: { "member-aom": 90 },
        category: "settlement",
      },
    ], "member-aom").groupSpend).toBe(0);

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
});
