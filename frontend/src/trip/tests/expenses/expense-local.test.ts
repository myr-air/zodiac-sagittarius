import { describe, expect, it } from "vitest";
import {
  appendExpensesToTrip,
  appendLocalExpensesToTrip,
  removeExpenseFromTrip,
  replaceExpenseInTrip,
  updateLocalExpenseInTrip,
} from "../../expenses";
import type { Expense, Trip } from "../../types";

describe("expense local mutations", () => {
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
      spentOn: null,
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
      spentOn: "2026-06-25",
      storedValueCardId: null,
      storedValueCardName: null,
      storedValueTransactionType: null,
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
      spentOn: "2026-06-25",
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
