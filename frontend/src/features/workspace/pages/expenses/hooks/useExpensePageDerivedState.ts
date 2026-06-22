import { useMemo } from "react";
import { buildExpenseStatement } from "@/src/trip/expenses";
import type {
  ExpenseSummary,
  Member,
  Trip,
} from "@/src/trip/types";
import {
  expenseCategorySpend,
  filterExpenses,
  inferredScopeExpenses as filterInferredScopeExpenses,
} from "../model/expense-page-filters";
import type { ExpenseCategoryFilter } from "../model/expense-page-options";
import {
  currentMemberExpenseBalance,
  expensePageSettlementCurrency,
} from "../model/expense-page-selectors";

interface UseExpensePageDerivedStateArgs {
  categoryFilter: ExpenseCategoryFilter;
  currentMember: Member;
  expenseSummary: ExpenseSummary;
  payerFilter: string;
  query: string;
  trip: Trip;
}

export function useExpensePageDerivedState({
  categoryFilter,
  currentMember,
  expenseSummary,
  payerFilter,
  query,
  trip,
}: UseExpensePageDerivedStateArgs) {
  const settlementCurrency = expensePageSettlementCurrency(expenseSummary);
  const {
    currentNet,
    owedToYou,
    youOwe,
  } = currentMemberExpenseBalance(expenseSummary, currentMember.id);
  const statement = useMemo(
    () => buildExpenseStatement({ trip, expenseSummary }),
    [expenseSummary, trip],
  );
  const inferredScopeExpenses = useMemo(
    () => filterInferredScopeExpenses(trip.expenses),
    [trip.expenses],
  );
  const categorySpend = useMemo(
    () => expenseCategorySpend(trip.expenses, settlementCurrency),
    [settlementCurrency, trip.expenses],
  );
  const filteredExpenses = useMemo(
    () => filterExpenses({
      categoryFilter,
      expenses: trip.expenses,
      itineraryItems: trip.itineraryItems,
      members: trip.members,
      payerFilter,
      query,
    }),
    [
      categoryFilter,
      payerFilter,
      query,
      trip.expenses,
      trip.itineraryItems,
      trip.members,
    ],
  );

  return {
    categorySpend,
    currentNet,
    filteredExpenses,
    inferredScopeExpenses,
    owedToYou,
    settlementCurrency,
    statement,
    youOwe,
  };
}
