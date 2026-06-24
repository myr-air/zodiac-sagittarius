import { describe, expect, it } from "vitest";

import { seedTrip } from "@/src/trip/seed";

import {
  expenseDayFilterOptions,
  expenseLedgerDayGroups,
  expenseCategorySpend,
  filterExpenses,
  inferredScopeExpenses,
} from "../expense-page-filters";

describe("expense page filters", () => {
  it("filters expenses by search text, category, payer, and linked itinerary item", () => {
    const [expense] = seedTrip.expenses;
    const linkedItem = seedTrip.itineraryItems.find(
      (item) => item.id === expense.itineraryItemId,
    );

    expect(filterExpenses({
      categoryFilter: expense.category,
      dayFilter: "all",
      expenses: seedTrip.expenses,
      itineraryItems: seedTrip.itineraryItems,
      members: seedTrip.members,
      payerFilter: expense.paidBy,
      query: `  ${(linkedItem?.activity.slice(0, 6) ?? expense.title).toLocaleUpperCase()}  `,
    }).map((item) => item.id)).toContain(expense.id);

    expect(filterExpenses({
      categoryFilter: "settlement",
      dayFilter: "all",
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

  it("filters and groups ledger rows by linked itinerary day", () => {
    const hongKongItem = seedTrip.itineraryItems.find((item) => item.day === "2026-06-19");
    const expenses = [
      {
        ...seedTrip.expenses[0],
        id: "expense-arrival",
        itineraryItemId: "item-arrive-hkg",
        title: "Arrival taxi",
      },
      {
        ...seedTrip.expenses[1],
        id: "expense-peak",
        itineraryItemId: hongKongItem?.id,
        title: "Peak snack",
      },
      {
        ...seedTrip.expenses[2],
        id: "expense-unlinked",
        itineraryItemId: null,
        spentOn: "2026-06-20",
        title: "General top-up",
      },
    ];

    expect(filterExpenses({
      categoryFilter: "all",
      dayFilter: "2026-06-18",
      expenses,
      itineraryItems: seedTrip.itineraryItems,
      members: seedTrip.members,
      payerFilter: "all",
      query: "",
    }).map((expense) => expense.id)).toEqual(["expense-arrival"]);

    expect(expenseDayFilterOptions({
      allDaysLabel: "All days",
      expenses,
      itineraryItems: seedTrip.itineraryItems,
      unlinkedLabel: "No day",
    })).toEqual(expect.arrayContaining([
      { label: "2026-06-18", value: "2026-06-18" },
      { label: "2026-06-20", value: "2026-06-20" },
    ]));

    expect(expenseLedgerDayGroups({
      expenses,
      itineraryItems: seedTrip.itineraryItems,
      settlementCurrency: "HKD",
      unlinkedLabel: "No day",
    }).map((group) => ({
      id: group.id,
      label: group.label,
      totalLabel: group.totalLabel,
      titles: group.expenses.map((expense) => expense.title),
    }))).toEqual([
      {
        id: "2026-06-18",
        label: "2026-06-18",
        totalLabel: "HK$512.00",
        titles: ["Arrival taxi"],
      },
      {
        id: "2026-06-19",
        label: "2026-06-19",
        totalLabel: "HK$880.00",
        titles: ["Peak snack"],
      },
      {
        id: "2026-06-20",
        label: "2026-06-20",
        totalLabel: "HK$280.00",
        titles: ["General top-up"],
      },
    ]);
  });
});
