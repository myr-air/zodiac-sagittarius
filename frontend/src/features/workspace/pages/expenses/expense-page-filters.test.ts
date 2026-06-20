import { describe, expect, it } from "vitest";

import { seedTrip } from "@/src/trip/seed";

import {
  expenseCategorySpend,
  filterExpenses,
  inferredScopeExpenses,
} from "./expense-page-filters";

describe("expense page filters", () => {
  it("filters expenses by search text, category, payer, and linked itinerary item", () => {
    const [expense] = seedTrip.expenses;
    const linkedItem = seedTrip.itineraryItems.find(
      (item) => item.id === expense.itineraryItemId,
    );

    expect(filterExpenses({
      categoryFilter: expense.category,
      expenses: seedTrip.expenses,
      itineraryItems: seedTrip.itineraryItems,
      members: seedTrip.members,
      payerFilter: expense.paidBy,
      query: linkedItem?.activity.slice(0, 6) ?? expense.title,
    }).map((item) => item.id)).toContain(expense.id);

    expect(filterExpenses({
      categoryFilter: "settlement",
      expenses: seedTrip.expenses,
      itineraryItems: seedTrip.itineraryItems,
      members: seedTrip.members,
      payerFilter: expense.paidBy,
      query: "no matching expense",
    })).toEqual([]);
  });

  it("derives scoped expenses and category spend without mutating source expenses", () => {
    const scoped = inferredScopeExpenses(seedTrip.expenses);
    expect(scoped.every((expense) => expense.tripPlanId && !expense.itineraryItemId)).toBe(true);
    expect(scoped.every((expense) => expense.category !== "settlement")).toBe(true);

    const spend = expenseCategorySpend(seedTrip.expenses, "HKD");
    expect(spend.some(([category]) => category === "settlement")).toBe(false);
    expect([...spend].sort((a, b) => b[1] - a[1])).toEqual(spend);
  });
});
