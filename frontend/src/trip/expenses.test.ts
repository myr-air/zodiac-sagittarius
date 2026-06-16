import { describe, expect, it } from "vitest";
import {
  appendExpensesToTrip,
  appendLocalExpensesToTrip,
  buildCreateExpenseRequest,
  buildExpenseCreateDrafts,
  buildExpenseSummary,
  buildExpenseSplits,
  buildExpenseUpdateDraft,
  buildItemizedExpenseSplits,
  buildPatchExpenseRequest,
  buildExpenseReminderRequest,
  expenseReminderRequestForSuggestion,
  expenseSplitsToMinor,
  normalizeExpenseRepeatCount,
  normalizeExpenseSplitsFromMinor,
  repeatExpenseLineItems,
  recordLocalExpenseReminderInTrip,
  removeExpenseFromTrip,
  replaceExpenseInTrip,
  updateLocalExpenseInTrip,
} from "./expenses";
import * as expenseHelpers from "./expenses";
import type { Expense, Trip } from "./types";

const members = ["member-aom", "member-beam", "member-nam"];

describe("expense money helpers", () => {
  it("builds equal, exact, share, and percentage splits in major money units", () => {
    expect(buildExpenseSplits({ amount: 100, memberIds: members, mode: "equal" })).toEqual({
      "member-aom": 33.34,
      "member-beam": 33.33,
      "member-nam": 33.33,
    });

    expect(buildExpenseSplits({
      amount: 120,
      memberIds: members,
      mode: "exact",
      valuesByMember: { "member-aom": 60, "member-beam": 40, "member-nam": 20 },
    })).toEqual({ "member-aom": 60, "member-beam": 40, "member-nam": 20 });

    expect(buildExpenseSplits({
      amount: 90,
      memberIds: members,
      mode: "shares",
      valuesByMember: { "member-aom": 2, "member-beam": 1, "member-nam": 0 },
    })).toEqual({ "member-aom": 60, "member-beam": 30, "member-nam": 0 });

    expect(buildExpenseSplits({
      amount: 200,
      memberIds: members,
      mode: "percentage",
      valuesByMember: { "member-aom": 50, "member-beam": 25, "member-nam": 25 },
    })).toEqual({ "member-aom": 100, "member-beam": 50, "member-nam": 50 });

    expect(buildExpenseSplits({
      amount: 200,
      memberIds: members,
      mode: "percentage",
      valuesByMember: { "member-aom": 50, "member-beam": 0, "member-nam": 0 },
    })).toEqual({ "member-aom": 100, "member-beam": 0, "member-nam": 0 });
  });

  it("allocates percentage rounding remainders so a 100 percent split keeps every cent", () => {
    const splits = buildExpenseSplits({
      amount: 100,
      memberIds: members,
      mode: "percentage",
      valuesByMember: { "member-aom": 33.333, "member-beam": 33.333, "member-nam": 33.334 },
    });

    expect(splits).toEqual({
      "member-aom": 33.33,
      "member-beam": 33.33,
      "member-nam": 33.34,
    });
    expect(Object.values(splits).reduce((sum, split) => sum + split, 0)).toBe(100);
  });

  it("builds itemized receipt splits by assigning each line to the friends who shared it", () => {
    const splits = buildItemizedExpenseSplits({
      lineItems: [
        {
          id: "line-taxi",
          title: "Taxi van",
          amount: 120,
          participantIds: ["member-aom", "member-beam", "member-nam"],
        },
        {
          id: "line-pass",
          title: "Museum pass",
          amount: 99.99,
          participantIds: ["member-aom", "member-nam"],
        },
      ],
      memberIds: members,
    });

    expect(splits).toEqual({
      "member-aom": 90,
      "member-beam": 40,
      "member-nam": 89.99,
    });
  });

  it("keeps frontend splits as major money and converts API minor cents only at the boundary", () => {
    const majorSplits = { "member-aom": 33.34, "member-beam": 33.33, "member-nam": 33.33 };

    expect(expenseSplitsToMinor(majorSplits)).toEqual({
      "member-aom": 3334,
      "member-beam": 3333,
      "member-nam": 3333,
    });
    expect(normalizeExpenseSplitsFromMinor({
      "member-aom": 3334,
      "member-beam": 3333,
      "member-nam": 3333,
    })).toEqual(majorSplits);
  });

  it("normalizes repeated expense counts to the supported daily range", () => {
    expect(normalizeExpenseRepeatCount(undefined)).toBe(1);
    expect(normalizeExpenseRepeatCount(0)).toBe(1);
    expect(normalizeExpenseRepeatCount(Number.NaN)).toBe(1);
    expect(normalizeExpenseRepeatCount(2.9)).toBe(2);
    expect(normalizeExpenseRepeatCount(99)).toBe(31);
  });

  it("keeps single expense line item ids and suffixes repeated copies", () => {
    const lineItems = [
      {
        id: "line-taxi",
        title: "Taxi van",
        amount: 120,
        participantIds: ["member-aom", "member-beam"],
      },
    ];

    expect(repeatExpenseLineItems(undefined, 0, 3)).toBeUndefined();
    expect(repeatExpenseLineItems(lineItems, 0, 1)).toBe(lineItems);
    expect(repeatExpenseLineItems(lineItems, 1, 3)).toEqual([
      {
        ...lineItems[0],
        id: "line-taxi-repeat-2",
      },
    ]);
  });

  it("builds repeated expense create drafts with shared split policy", () => {
    const drafts = buildExpenseCreateDrafts(
      {
        itemId: "item-lunch",
        title: "Dim sum lunch",
        amount: 120,
        currency: "HKD",
        paidBy: "member-aom",
        category: "food",
        repeatCount: 2,
        lineItems: [
          {
            id: "line-table",
            title: "Table set",
            amount: 120,
            participantIds: ["member-aom", "member-beam"],
          },
        ],
      },
      ["member-aom", "member-beam"],
    );

    expect(drafts).toEqual([
      expect.objectContaining({
        title: "Dim sum lunch (1/2)",
        splits: { "member-aom": 60, "member-beam": 60 },
        lineItems: [
          {
            id: "line-table-repeat-1",
            title: "Table set",
            amount: 120,
            participantIds: ["member-aom", "member-beam"],
          },
        ],
      }),
      expect.objectContaining({
        title: "Dim sum lunch (2/2)",
        splits: { "member-aom": 60, "member-beam": 60 },
        lineItems: [
          {
            id: "line-table-repeat-2",
            title: "Table set",
            amount: 120,
            participantIds: ["member-aom", "member-beam"],
          },
        ],
      }),
    ]);
    expect(drafts[0].splits).toBe(drafts[1].splits);
  });

  it("appends local expenses with record defaults and resolved trip plan ids", () => {
    const trip = {
      id: "trip-1",
      expenses: [
        {
          id: "expense-existing",
          tripId: "trip-1",
          title: "Existing",
          amount: 10,
          paidBy: "member-aom",
          splits: { "member-aom": 10 },
          category: "food",
        },
      ],
      itineraryItems: [],
      mainTripPlanId: "plan-main",
      activePlanVariantId: "plan-main",
    } as Pick<Trip, "id" | "expenses" | "itineraryItems" | "mainTripPlanId" | "activePlanVariantId">;

    const nextTrip = appendLocalExpensesToTrip(
      trip,
      [
        {
          itemId: null,
          tripPlanId: null,
          title: "Taxi",
          amount: 88.4,
          paidBy: "member-beam",
          category: "transport",
          splits: { "member-aom": 44.2, "member-beam": 44.2 },
        },
      ],
      {
        selectedTripPlanId: "plan-selected",
        nextExpenseId: (expenses) => `expense-local-${expenses.length + 1}`,
        resolveTripPlanId: (_trip, _recordId, preferredTripPlanId) => preferredTripPlanId ?? "plan-main",
      },
    );

    expect(nextTrip).not.toBe(trip);
    expect(nextTrip.expenses).toHaveLength(2);
    expect(nextTrip.expenses[1]).toMatchObject({
      id: "expense-local-2",
      tripId: "trip-1",
      title: "Taxi",
      amount: 88.4,
      amountMinor: 8840,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      notes: "",
      receiptUrl: null,
      lineItems: [],
      comments: [],
      tripPlanId: "plan-selected",
      paidBy: "member-beam",
      category: "transport",
      splits: { "member-aom": 44.2, "member-beam": 44.2 },
      itineraryItemId: null,
      version: 1,
    });
  });

  it("builds create expense API requests from expense drafts", () => {
    expect(
      buildCreateExpenseRequest(
        {
          itemId: "item-lunch",
          title: "Dim sum lunch",
          amount: 120.45,
          currency: undefined,
          exchangeRateToSettlementCurrency: undefined,
          notes: undefined,
          receiptUrl: undefined,
          lineItems: undefined,
          comments: undefined,
          tripPlanId: "plan-draft",
          paidBy: "member-aom",
          category: "food",
          splits: { "member-aom": 60.23, "member-beam": 60.22 },
        },
        {
          clientMutationId: "expense-create-mutation",
          tripPlanId: "plan-resolved",
        },
      ),
    ).toEqual({
      clientMutationId: "expense-create-mutation",
      title: "Dim sum lunch",
      amountMinor: 12045,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      notes: "",
      receiptUrl: null,
      lineItems: undefined,
      comments: [],
      tripPlanId: "plan-resolved",
      paidBy: "member-aom",
      category: "food",
      splits: { "member-aom": 6023, "member-beam": 6022 },
      itineraryItemId: "item-lunch",
    });
  });

  it("builds expense update drafts from form values and existing defaults", () => {
    const trip = {
      members: [
        { id: "member-aom", displayName: "Aom", role: "owner", presence: "online", color: "#0f766e" },
        { id: "member-beam", displayName: "Beam", role: "traveler", presence: "online", color: "#2563eb" },
      ],
      itineraryItems: [],
      mainTripPlanId: "plan-main",
      activePlanVariantId: "plan-main",
    } as Pick<Trip, "members" | "itineraryItems" | "mainTripPlanId" | "activePlanVariantId">;
    const existing: Expense = {
      id: "expense-taxi",
      title: "Taxi",
      amount: 80,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      notes: "Original note",
      receiptUrl: "https://receipts.example/original.jpg",
      lineItems: [{ id: "line-original", title: "Original", amount: 80, participantIds: ["member-aom"] }],
      comments: [{ id: "comment-1", authorId: "member-aom", body: "Paid cash", createdAt: "2026-06-05T12:00:00.000Z" }],
      tripPlanId: "plan-main",
      paidBy: "member-aom",
      category: "transport",
      splits: { "member-aom": 80 },
      itineraryItemId: "item-old",
      version: 3,
    };

    const draft = buildExpenseUpdateDraft(
      trip,
      existing,
      {
        expenseId: existing.id,
        title: "Airport taxi",
        amount: 99.5,
        paidBy: "member-beam",
        category: "transport",
        itemId: undefined,
      },
      {
        selectedTripPlanId: "plan-selected",
        resolveTripPlanId: (_trip, recordId, preferredTripPlanId) =>
          `${preferredTripPlanId ?? "none"}:${recordId ?? "none"}`,
      },
    );

    expect(draft).toMatchObject({
      expenseId: "expense-taxi",
      title: "Airport taxi",
      amount: 99.5,
      amountMinor: 9950,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      notes: "Original note",
      receiptUrl: "https://receipts.example/original.jpg",
      lineItems: existing.lineItems,
      comments: existing.comments,
      tripPlanId: "plan-main:item-old",
      paidBy: "member-beam",
      category: "transport",
      splits: { "member-aom": 49.75, "member-beam": 49.75 },
      itineraryItemId: "item-old",
    });
  });

  it("builds patch expense API requests from update drafts", () => {
    expect(
      buildPatchExpenseRequest(
        {
          expenseId: "expense-lunch",
          title: "Dim sum lunch",
          amount: 120.45,
          amountMinor: 12045,
          currency: "HKD",
          exchangeRateToSettlementCurrency: 1,
          notes: "Paid at counter",
          receiptUrl: null,
          lineItems: [],
          comments: [],
          tripPlanId: "plan-rain",
          paidBy: "member-aom",
          category: "food",
          splits: { "member-aom": 60.23, "member-beam": 60.22 },
          itineraryItemId: "item-lunch",
        },
        {
          clientMutationId: "expense-patch-mutation",
          expectedVersion: 4,
        },
      ),
    ).toEqual({
      clientMutationId: "expense-patch-mutation",
      expectedVersion: 4,
      title: "Dim sum lunch",
      amountMinor: 12045,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      notes: "Paid at counter",
      receiptUrl: null,
      lineItems: [],
      comments: [],
      tripPlanId: "plan-rain",
      paidBy: "member-aom",
      category: "food",
      splits: { "member-aom": 6023, "member-beam": 6022 },
      itineraryItemId: "item-lunch",
    });
  });

  it("updates local expenses with draft fields and increments version", () => {
    const trip = {
      expenses: [
        {
          id: "expense-taxi",
          title: "Taxi",
          amount: 80,
          paidBy: "member-aom",
          category: "transport",
          splits: { "member-aom": 80 },
          version: 3,
        },
        {
          id: "expense-food",
          title: "Dinner",
          amount: 120,
          paidBy: "member-beam",
          category: "food",
          splits: { "member-beam": 120 },
          version: 1,
        },
      ],
    } as Pick<Trip, "expenses">;

    const nextTrip = updateLocalExpenseInTrip(trip, {
      expenseId: "expense-taxi",
      title: "Airport taxi",
      amount: 99.5,
      amountMinor: 9950,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      notes: "",
      receiptUrl: null,
      lineItems: [],
      comments: [],
      tripPlanId: "plan-main",
      paidBy: "member-beam",
      category: "transport",
      splits: { "member-aom": 49.75, "member-beam": 49.75 },
      itineraryItemId: null,
    });

    expect(nextTrip).not.toBe(trip);
    expect(nextTrip.expenses[0]).toMatchObject({
      id: "expense-taxi",
      title: "Airport taxi",
      amount: 99.5,
      amountMinor: 9950,
      paidBy: "member-beam",
      splits: { "member-aom": 49.75, "member-beam": 49.75 },
      version: 4,
    });
    expect(nextTrip.expenses[1]).toBe(trip.expenses[1]);
  });

  it("appends, replaces, and removes expenses in trip collections", () => {
    const trip = {
      expenses: [
        {
          id: "expense-taxi",
          title: "Taxi",
          amount: 80,
          paidBy: "member-aom",
          category: "transport",
          splits: { "member-aom": 80 },
        },
      ],
    } as Pick<Trip, "expenses">;
    const dinner = {
      id: "expense-dinner",
      title: "Dinner",
      amount: 120,
      paidBy: "member-beam",
      category: "food",
      splits: { "member-aom": 60, "member-beam": 60 },
    } satisfies Expense;

    const appended = appendExpensesToTrip(trip, [dinner]);
    expect(appended.expenses.map((expense) => expense.id)).toEqual([
      "expense-taxi",
      "expense-dinner",
    ]);
    expect(trip.expenses.map((expense) => expense.id)).toEqual(["expense-taxi"]);

    const replaced = replaceExpenseInTrip(appended, {
      ...dinner,
      title: "Dinner updated",
    });
    expect(replaced.expenses.find((expense) => expense.id === "expense-dinner")).toMatchObject({
      id: "expense-dinner",
      title: "Dinner updated",
    });

    expect(removeExpenseFromTrip(replaced, "expense-taxi").expenses).toEqual([
      expect.objectContaining({ id: "expense-dinner" }),
    ]);
  });

  it("records settle-up payments without inflating trip spend", () => {
    const dinner: Expense = {
      id: "expense-dinner",
      title: "Dinner",
      amount: 90,
      paidBy: "member-aom",
      splits: { "member-aom": 30, "member-beam": 30, "member-nam": 30 },
      category: "food",
    };
    const settlement: Expense = {
      id: "expense-settlement",
      title: "Beam paid Aom back",
      amount: 30,
      paidBy: "member-beam",
      splits: { "member-aom": 30 },
      category: "settlement",
    };

    const beforeSettlement = buildExpenseSummary([dinner], "member-beam");
    expect(beforeSettlement.groupSpend).toBe(90);
    expect(beforeSettlement.settlementSuggestions).toEqual([
      { from: "member-beam", to: "member-aom", amount: 30, currency: "HKD" },
      { from: "member-nam", to: "member-aom", amount: 30, currency: "HKD" },
    ]);

    const afterSettlement = buildExpenseSummary([dinner, settlement], "member-beam");
    expect(afterSettlement.groupSpend).toBe(90);
    expect(afterSettlement.currentUserNetLabel).toBe("You are settled");
    expect(afterSettlement.settlementSuggestions).toEqual([
      { from: "member-nam", to: "member-aom", amount: 30, currency: "HKD" },
    ]);
  });

  it("converts travel expenses into the trip settlement currency before balancing friends", () => {
    const expenses = [
      {
        id: "expense-hkd-meal",
        title: "Hong Kong dinner",
        amount: 120,
        currency: "HKD",
        paidBy: "member-aom",
        splits: { "member-aom": 60, "member-beam": 60 },
        category: "food",
      },
      {
        id: "expense-cny-taxi",
        title: "Shenzhen taxi",
        amount: 100,
        currency: "CNY",
        exchangeRateToSettlementCurrency: 1.1,
        paidBy: "member-beam",
        splits: { "member-aom": 50, "member-beam": 50 },
        category: "transport",
      },
    ] satisfies Expense[];

    const summary = buildExpenseSummary(expenses, "member-beam", [], { settlementCurrency: "HKD" });

    expect(summary.settlementCurrency).toBe("HKD");
    expect(summary.groupSpend).toBe(230);
    expect(summary.netByMember).toEqual({
      "member-aom": 5,
      "member-beam": -5,
    });
    expect(summary.currentUserNetLabel).toBe("You owe HK$5.00");
    expect(summary.settlementSuggestions).toEqual([
      { from: "member-beam", to: "member-aom", amount: 5, currency: "HKD" },
    ]);
  });

  it("carries reminder history onto matching settle-up suggestions", () => {
    const dinner: Expense = {
      id: "expense-dinner",
      title: "Dinner",
      amount: 90,
      paidBy: "member-aom",
      splits: { "member-aom": 30, "member-beam": 30, "member-nam": 30 },
      category: "food",
    };

    const summary = buildExpenseSummary([dinner], "member-beam", [
      {
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T12:00:00.000Z",
      },
    ]);

    expect(summary.settlementSuggestions).toEqual([
      {
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        currency: "HKD",
        lastRemindedAt: "2026-06-05T12:00:00.000Z",
      },
      { from: "member-nam", to: "member-aom", amount: 30, currency: "HKD" },
    ]);
  });

  it("upserts payback reminder history by payer, receiver, and amount", () => {
    expect(expenseHelpers.upsertExpenseReminder([
      {
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T11:00:00.000Z",
      },
    ], {
      from: "member-beam",
      to: "member-aom",
      amount: 30,
      lastRemindedAt: "2026-06-05T12:00:00.000Z",
    })).toEqual([
      {
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T12:00:00.000Z",
      },
    ]);
  });

  it("keeps payback reminder history separate by Trip Plan", () => {
    expect(expenseHelpers.upsertExpenseReminder([
      {
        tripPlanId: "plan-main",
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T11:00:00.000Z",
      },
    ], {
      tripPlanId: "plan-rain",
      from: "member-beam",
      to: "member-aom",
      amount: 30,
      lastRemindedAt: "2026-06-05T12:00:00.000Z",
    })).toEqual([
      {
        tripPlanId: "plan-main",
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T11:00:00.000Z",
      },
      {
        tripPlanId: "plan-rain",
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T12:00:00.000Z",
      },
    ]);
  });

  it("filters reminder history to the selected Trip Plan and treats legacy reminders as Main Plan", () => {
    const reminders = [
      {
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T10:00:00.000Z",
      },
      {
        tripPlanId: "plan-rain",
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T12:00:00.000Z",
      },
    ];

    expect(
      expenseHelpers.filterExpenseRemindersForTripPlan(
        reminders,
        "plan-main",
        "plan-main",
      ),
    ).toEqual([reminders[0]]);
    expect(
      expenseHelpers.filterExpenseRemindersForTripPlan(
        reminders,
        "plan-rain",
        "plan-main",
      ),
    ).toEqual([reminders[1]]);
  });

  it("builds a shareable trip money statement with balances, paybacks, and ledger lines", () => {
    const trip = {
      name: "Weekend food crawl",
      members: [
        { id: "member-aom", displayName: "Aom", role: "owner", presence: "online", color: "#0f766e" },
        { id: "member-beam", displayName: "Beam", role: "traveler", presence: "online", color: "#2563eb" },
        { id: "member-nam", displayName: "Nam", role: "traveler", presence: "online", color: "#9333ea" },
      ],
      itineraryItems: [
        { id: "item-dinner", activity: "Dinner stop" },
      ],
      expenses: [
        {
          id: "expense-dinner",
          title: "Dinner",
          amount: 90,
          paidBy: "member-aom",
          splits: { "member-aom": 30, "member-beam": 30, "member-nam": 30 },
          category: "food",
          itineraryItemId: "item-dinner",
        },
      ],
    } as unknown as Pick<Trip, "name" | "members" | "itineraryItems" | "expenses">;
    const summary = buildExpenseSummary(trip.expenses, "member-beam");

    const statement = expenseHelpers.buildExpenseStatement({ trip, expenseSummary: summary });

    expect(statement).toContain("Trip money - Weekend food crawl");
    expect(statement).toContain("Trip spend: HK$90.00");
    expect(statement).toContain("- Aom: owed HK$60.00");
    expect(statement).toContain("- Beam: owes HK$30.00");
    expect(statement).toContain("- Beam pays Aom HK$30.00");
    expect(statement).toContain("- Nam pays Aom HK$30.00");
    expect(statement).toContain("- Dinner: HK$90.00 paid by Aom, split HK$90.00, linked to Dinner stop");
  });

  it("keeps original currency and converted settlement value visible in statements", () => {
    const trip = {
      name: "Cross-border weekend",
      members: [
        { id: "member-aom", displayName: "Aom", role: "owner", presence: "online", color: "#0f766e" },
        { id: "member-beam", displayName: "Beam", role: "traveler", presence: "online", color: "#2563eb" },
      ],
      itineraryItems: [],
      expenses: [
        {
          id: "expense-taxi",
          title: "Shenzhen taxi",
          amount: 100,
          currency: "CNY",
          exchangeRateToSettlementCurrency: 1.1,
          paidBy: "member-beam",
          splits: { "member-aom": 50, "member-beam": 50 },
          category: "transport",
        },
      ],
    } as unknown as Pick<Trip, "name" | "members" | "itineraryItems" | "expenses">;
    const summary = buildExpenseSummary(trip.expenses, "member-aom", [], { settlementCurrency: "HKD" });

    const statement = expenseHelpers.buildExpenseStatement({ trip, expenseSummary: summary });

    expect(statement).toContain("Trip spend: HK$110.00");
    expect(statement).toContain("- Aom pays Beam HK$55.00");
    expect(statement).toContain("- Shenzhen taxi: CN¥100.00 (HK$110.00 settle value) paid by Beam, split CN¥100.00");
  });

  it("includes receipt links and itemized lines in shareable statements", () => {
    const trip = {
      name: "Weekend food crawl",
      members: [
        { id: "member-aom", displayName: "Aom", role: "owner", presence: "online", color: "#0f766e" },
        { id: "member-beam", displayName: "Beam", role: "traveler", presence: "online", color: "#2563eb" },
      ],
      itineraryItems: [],
      expenses: [
        {
          id: "expense-receipt",
          title: "Night market receipt",
          amount: 90,
          currency: "HKD",
          notes: "Beam paid cash for dessert later.",
          receiptUrl: "https://receipts.example/night-market.jpg",
          comments: [
            {
              id: "comment-dessert",
              authorId: "member-beam",
              body: "I covered dessert in cash.",
              createdAt: "2026-06-05T12:00:00.000Z",
            },
          ],
          lineItems: [
            { id: "line-noodles", title: "Noodles", amount: 60, participantIds: ["member-aom", "member-beam"] },
            { id: "line-tea", title: "Milk tea", amount: 30, participantIds: ["member-beam"] },
          ],
          paidBy: "member-aom",
          splits: { "member-aom": 30, "member-beam": 60 },
          category: "food",
        },
      ],
    } as unknown as Pick<Trip, "name" | "members" | "itineraryItems" | "expenses">;
    const summary = buildExpenseSummary(trip.expenses, "member-beam");

    const statement = expenseHelpers.buildExpenseStatement({ trip, expenseSummary: summary });

    expect(statement).toContain("receipt https://receipts.example/night-market.jpg");
    expect(statement).toContain("  note: Beam paid cash for dessert later.");
    expect(statement).toContain("  comment Beam: I covered dessert in cash.");
    expect(statement).toContain("  - Noodles: HK$60.00 shared by Aom, Beam");
    expect(statement).toContain("  - Milk tea: HK$30.00 shared by Beam");
  });

  it("builds an audit-friendly CSV export with escaped ledger and settlement rows", () => {
    const trip = {
      name: "Weekend food crawl",
      members: [
        { id: "member-aom", displayName: "Aom", role: "owner", presence: "online", color: "#0f766e" },
        { id: "member-beam", displayName: "Beam", role: "traveler", presence: "online", color: "#2563eb" },
      ],
      itineraryItems: [
        { id: "item-dinner", activity: "Dinner, Central" },
      ],
      expenses: [
        {
          id: "expense-dinner",
          title: "Dinner \"round 1\"",
          amount: 80,
          currency: "HKD",
          notes: "Use the promo voucher.",
          comments: [
            {
              id: "comment-voucher",
              authorId: "member-beam",
              body: "Voucher is in the shared folder.",
              createdAt: "2026-06-05T12:00:00.000Z",
            },
          ],
          paidBy: "member-aom",
          splits: { "member-aom": 40, "member-beam": 40 },
          category: "food",
          itineraryItemId: "item-dinner",
        },
        {
          id: "expense-payback",
          title: "Beam paid Aom back",
          amount: 40,
          currency: "HKD",
          paidBy: "member-beam",
          splits: { "member-aom": 40 },
          category: "settlement",
        },
      ],
    } as unknown as Pick<Trip, "name" | "members" | "itineraryItems" | "expenses">;
    const summary = buildExpenseSummary(trip.expenses, "member-beam");

    const csv = expenseHelpers.buildExpenseCsv({ trip, expenseSummary: summary });

    expect(csv.split("\n")[0]).toBe("section,type,title,amount,currency,paid_by,member,share,category,linked_stop,notes,comments");
    expect(csv).toContain("\"expenses\",\"expense\",\"Dinner \"\"round 1\"\"\",\"80.00\",\"HKD\",\"Aom\",\"Beam\",\"40.00\",\"food\",\"Dinner, Central\",\"Use the promo voucher.\",\"Beam: Voucher is in the shared folder.\"");
    expect(csv).toContain("\"expenses\",\"settlement\",\"Beam paid Aom back\",\"40.00\",\"HKD\",\"Beam\",\"Aom\",\"40.00\",\"settlement\",\"\",\"\",\"\"");
    expect(csv).toContain("\"balances\",\"balance\",\"Weekend food crawl\",\"0.00\",\"HKD\",\"\",\"Aom\",\"0.00\",\"settled\",\"\",\"\",\"\"");
    expect(csv).toContain("\"paybacks\",\"payback\",\"Everyone is settled\",\"0.00\",\"HKD\",\"\",\"\",\"0.00\",\"settled\",\"\",\"\",\"\"");
  });

  it("builds a direct payback reminder that can be pasted into chat", () => {
    const trip = {
      name: "Weekend food crawl",
      members: [
        { id: "member-aom", displayName: "Aom", role: "owner", presence: "online", color: "#0f766e" },
        { id: "member-beam", displayName: "Beam", role: "traveler", presence: "online", color: "#2563eb" },
      ],
      itineraryItems: [],
      expenses: [],
    } as unknown as Pick<Trip, "name" | "members" | "itineraryItems" | "expenses">;

    expect(expenseHelpers.buildPaybackReminder({
      trip,
      suggestion: { from: "member-beam", to: "member-aom", amount: 42.5 },
    })).toBe("Beam, please pay Aom HK$42.50 for Weekend food crawl. Mark it as paid in Joii after you send it.");
  });

  it("builds API reminder requests from settlement suggestions", () => {
    expect(
      expenseReminderRequestForSuggestion({
        from: "member-beam",
        to: "member-aom",
        amount: 42.56,
      }),
    ).toEqual({
      from: "member-beam",
      to: "member-aom",
      amountMinor: 4256,
    });
  });

  it("builds expense reminder API requests with mutation ids", () => {
    expect(
      buildExpenseReminderRequest(
        {
          from: "member-beam",
          to: "member-aom",
          amount: 42.56,
        },
        {
          clientMutationId: "expense-reminder-mutation",
        },
      ),
    ).toEqual({
      clientMutationId: "expense-reminder-mutation",
      from: "member-beam",
      to: "member-aom",
      amountMinor: 4256,
    });
  });

  it("records local expense reminders with deterministic timestamps", () => {
    const trip = {
      expenseReminders: [
        {
          tripPlanId: "plan-main",
          from: "member-beam",
          to: "member-aom",
          amount: 42.5,
          lastRemindedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    } as Pick<Trip, "expenseReminders">;

    const nextTrip = recordLocalExpenseReminderInTrip(
      trip,
      { from: "member-beam", to: "member-aom", amount: 42.5 },
      {
        tripPlanId: "plan-main",
        remindedAt: "2026-06-02T00:00:00.000Z",
      },
    );

    expect(nextTrip).not.toBe(trip);
    expect(nextTrip.expenseReminders).toEqual([
      {
        tripPlanId: "plan-main",
        from: "member-beam",
        to: "member-aom",
        amount: 42.5,
        lastRemindedAt: "2026-06-02T00:00:00.000Z",
      },
    ]);
  });
});
