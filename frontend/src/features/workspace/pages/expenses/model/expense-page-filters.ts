import { expenseAmountInSettlementCurrency } from "@/src/trip/expenses";
import { findMemberById } from "@/src/trip/members";
import type { Expense, ItineraryItem, Member } from "@/src/trip/types";

import type { ExpenseCategoryFilter } from "./expense-page-types";

export interface ExpenseFilterInput {
  categoryFilter: ExpenseCategoryFilter;
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
    if (expense.category === "settlement") continue;
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
  expenses,
  itineraryItems,
  members,
  payerFilter,
  query,
}: ExpenseFilterInput): Expense[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return expenses.filter((expense) => {
    const payer = findMemberById(members, expense.paidBy);
    const linkedItem = expense.itineraryItemId
      ? itineraryItems.find((item) => item.id === expense.itineraryItemId)
      : null;
    const matchesQuery =
      !normalizedQuery ||
      expense.title.toLocaleLowerCase().includes(normalizedQuery) ||
      payer?.displayName.toLocaleLowerCase().includes(normalizedQuery) ||
      linkedItem?.activity.toLocaleLowerCase().includes(normalizedQuery);
    const matchesCategory =
      categoryFilter === "all" || expense.category === categoryFilter;
    const matchesPayer =
      payerFilter === "all" || expense.paidBy === payerFilter;
    return matchesQuery && matchesCategory && matchesPayer;
  });
}
