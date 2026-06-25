import {
  normalizeSearchQuery,
  valuesMatchSearchQuery,
} from "@/src/shared/text-search";
import {
  expenseAmountInSettlementCurrency,
  formatMoney,
  isStoredValueFundingExpense,
} from "@/src/trip/expenses";
import { findItineraryItemById } from "@/src/trip/itinerary-items";
import { findMemberById } from "@/src/trip/members";
import type { Expense, ItineraryItem, Member } from "@/src/trip/types";
import type { SelectOption } from "@/src/shared/select-options";

import type { ExpenseCategoryFilter } from "./expense-page-types";
import {
  formatSettlementAmountForDisplay,
  type ExpenseDisplayCurrencyOptions,
} from "./expense-display-currency";

export interface ExpenseFilterInput {
  categoryFilter: ExpenseCategoryFilter;
  dayFilter?: string;
  expenses: Expense[];
  itineraryItems: ItineraryItem[];
  members: Member[];
  payerFilter: string;
  query: string;
}

export function inferredScopeExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter(
    (expense) =>
      expense.category !== "settlement" &&
      Boolean(expense.tripPlanId) &&
      !expense.itineraryItemId,
  );
}

export function expenseCategorySpend(
  expenses: Expense[],
  settlementCurrency: string,
): Array<[Expense["category"], number]> {
  const totals = new Map<Expense["category"], number>();
  for (const expense of expenses) {
    if (expense.category === "settlement" || isStoredValueFundingExpense(expense)) continue;
    totals.set(
      expense.category,
      (totals.get(expense.category) ?? 0) +
        expenseAmountInSettlementCurrency(expense, settlementCurrency),
    );
  }
  return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
}

export function filterExpenses({
  categoryFilter,
  dayFilter = "all",
  expenses,
  itineraryItems,
  members,
  payerFilter,
  query,
}: ExpenseFilterInput): Expense[] {
  const normalizedQuery = normalizeSearchQuery(query);
  return expenses.filter((expense) => {
    const payer = findMemberById(members, expense.paidBy);
    const linkedItem = findItineraryItemById(
      itineraryItems,
      expense.itineraryItemId,
    );
    const expenseDay = linkedItem?.day ?? expense.spentOn ?? "unlinked";
    const matchesQuery = valuesMatchSearchQuery(
      [expense.title, payer?.displayName, linkedItem?.activity],
      normalizedQuery,
    );
    const matchesCategory =
      categoryFilter === "all" || expense.category === categoryFilter;
    const matchesPayer =
      payerFilter === "all" || expense.paidBy === payerFilter;
    const matchesDay = dayFilter === "all" || expenseDay === dayFilter;
    return matchesQuery && matchesCategory && matchesPayer && matchesDay;
  });
}

export interface ExpenseLedgerDayGroup {
  expenses: Expense[];
  id: string;
  label: string;
  totalLabel: string;
}

export function expenseDayFilterOptions({
  allDaysLabel,
  expenses = [],
  itineraryItems,
  unlinkedLabel,
}: {
  allDaysLabel: string;
  expenses?: Expense[];
  itineraryItems: ItineraryItem[];
  unlinkedLabel: string;
}): SelectOption[] {
  const days = Array.from(
    new Set([
      ...itineraryItems.map((item) => item.day),
      ...expenses.flatMap((expense) => expense.spentOn ? [expense.spentOn] : []),
    ]),
  ).sort();
  return [
    { label: allDaysLabel, value: "all" },
    ...days.map((day) => ({ label: day, value: day })),
    { label: unlinkedLabel, value: "unlinked" },
  ];
}

export function expenseLedgerDayGroups({
  displayCurrency,
  displayExchangeRate,
  expenses,
  itineraryItems,
  settlementCurrency,
  unlinkedLabel,
}: {
  expenses: Expense[];
  itineraryItems: ItineraryItem[];
  settlementCurrency: string;
  unlinkedLabel: string;
} & Partial<Pick<ExpenseDisplayCurrencyOptions, "displayCurrency" | "displayExchangeRate">>): ExpenseLedgerDayGroup[] {
  const groups = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const linkedItem = findItineraryItemById(
      itineraryItems,
      expense.itineraryItemId,
    );
    const key = linkedItem?.day ?? expense.spentOn ?? "unlinked";
    groups.set(key, [...(groups.get(key) ?? []), expense]);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      if (a === "unlinked") return 1;
      if (b === "unlinked") return -1;
      return a.localeCompare(b);
    })
    .map(([id, groupExpenses]) => {
      const total = groupExpenses.reduce(
        (sum, expense) =>
          sum + expenseAmountInSettlementCurrency(expense, settlementCurrency),
        0,
      );
      return {
        expenses: groupExpenses,
        id,
        label: id === "unlinked" ? unlinkedLabel : id,
        totalLabel: displayCurrency
          ? formatSettlementAmountForDisplay(total, {
            displayCurrency,
            displayExchangeRate,
            settlementCurrency,
          })
          : formatMoney(total, settlementCurrency),
      };
    });
}
