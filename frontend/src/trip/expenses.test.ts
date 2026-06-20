import { describe, expect, it } from "vitest";
import {
  appendExpensesToTrip,
  appendLocalExpensesToTrip,
  buildCreateExpenseRequest,
  buildExpenseUpdateDraft,
  buildPatchExpenseRequest,
  removeExpenseFromTrip,
  replaceExpenseInTrip,
  resolveExpenseCreateDraftTripPlanId,
  updateLocalExpenseInTrip,
} from "./expenses";
import type { Expense, Trip } from "./types";

describe("expense local, API, and settlement helpers", () => {
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

  it("resolves create draft trip plan ids with linked item, explicit, and selected fallbacks", () => {
    const trip = {
      itineraryItems: [
        {
          id: "item-linked",
          planVariantId: "plan-linked",
        },
      ],
      mainTripPlanId: "plan-main",
      activePlanVariantId: "plan-main",
    } as Pick<Trip, "itineraryItems" | "mainTripPlanId" | "activePlanVariantId">;
    const resolveTripPlanId = (
      targetTrip: typeof trip,
      itemId: string | null | undefined,
      preferredTripPlanId?: string | null,
    ) =>
      targetTrip.itineraryItems.find((item) => item.id === itemId)
        ?.planVariantId ??
      preferredTripPlanId ??
      targetTrip.mainTripPlanId;

    expect(
      resolveExpenseCreateDraftTripPlanId(
        trip,
        { itemId: "item-linked", tripPlanId: "plan-explicit" },
        {
          selectedTripPlanId: "plan-selected",
          resolveTripPlanId,
        },
      ),
    ).toBe("plan-linked");

    expect(
      resolveExpenseCreateDraftTripPlanId(
        trip,
        { itemId: null, tripPlanId: "plan-explicit" },
        {
          selectedTripPlanId: "plan-selected",
          resolveTripPlanId,
        },
      ),
    ).toBe("plan-explicit");

    expect(
      resolveExpenseCreateDraftTripPlanId(
        trip,
        { itemId: null, tripPlanId: null },
        {
          selectedTripPlanId: "plan-selected",
          resolveTripPlanId,
        },
      ),
    ).toBe("plan-selected");
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
});
