import { useMemo, useState } from "react";
import { buildExpenseStatement } from "@/src/trip/expenses";
import type {
  Expense,
  ExpenseSummary,
  Member,
  SettlementSuggestion,
  Trip,
} from "@/src/trip/types";
import {
  buildRefundExpenseInput,
  buildSettlementExpenseInput,
} from "./model/expense-page-actions";
import type {
  CreateExpenseHandler,
  ExpenseInput,
  ExpenseUpdateInput,
  RecordPaybackReminderHandler,
  UpdateExpenseHandler,
} from "./model/expense-page-types";
import {
  expenseCategorySpend,
  filterExpenses,
  inferredScopeExpenses as filterInferredScopeExpenses,
} from "./model/expense-page-filters";
import {
  currentMemberExpenseBalance,
  expensePageSettlementCurrency,
} from "./model/expense-page-selectors";
import type {
  ExpenseCategoryFilter,
  ExpenseDialogTarget,
} from "./model/expense-page-types";
import { useExpenseLedgerActions } from "./hooks/useExpenseLedgerActions";

interface UseTripExpensesPageStateArgs {
  currentMember: Member;
  expenseSummary: ExpenseSummary;
  onCreateExpense: CreateExpenseHandler;
  onRecordPaybackReminder?: RecordPaybackReminderHandler;
  onUpdateExpense: UpdateExpenseHandler;
  selectedTripPlanId?: string | null;
  trip: Trip;
}

export function useTripExpensesPageState({
  currentMember,
  expenseSummary,
  onCreateExpense,
  onRecordPaybackReminder,
  onUpdateExpense,
  selectedTripPlanId,
  trip,
}: UseTripExpensesPageStateArgs) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<ExpenseCategoryFilter>("all");
  const [payerFilter, setPayerFilter] = useState("all");
  const [dialogExpense, setDialogExpense] = useState<ExpenseDialogTarget>(null);

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
  const {
    copyPaybackReminder,
    copyState,
    copyStatement,
    downloadCsv,
  } = useExpenseLedgerActions({
    expenseSummary,
    onRecordPaybackReminder,
    statement,
    trip,
  });
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
    [categoryFilter, payerFilter, query, trip.expenses, trip.itineraryItems, trip.members],
  );

  function clearFilters() {
    setQuery("");
    setCategoryFilter("all");
    setPayerFilter("all");
  }

  function recordSettlement(suggestion: SettlementSuggestion) {
    onCreateExpense(buildSettlementExpenseInput({
      members: trip.members,
      settlementCurrency,
      suggestion,
    }));
  }

  function recordRefund(expense: Expense) {
    const input = buildRefundExpenseInput({
      expense,
      selectedTripPlanId,
      settlementCurrency,
    });
    if (input) onCreateExpense(input);
  }

  async function createDialogExpense(input: ExpenseInput) {
    await onCreateExpense(input);
    setDialogExpense(null);
  }

  async function updateDialogExpense(input: ExpenseUpdateInput) {
    await onUpdateExpense(input);
    setDialogExpense(null);
  }

  return {
    categoryFilter,
    categorySpend,
    clearFilters,
    copyPaybackReminder,
    copyState,
    copyStatement,
    createDialogExpense,
    currentNet,
    dialogExpense,
    downloadCsv,
    filteredExpenses,
    inferredScopeExpenses,
    owedToYou,
    payerFilter,
    query,
    recordRefund,
    recordSettlement,
    setCategoryFilter,
    setDialogExpense,
    setPayerFilter,
    setQuery,
    settlementCurrency,
    updateDialogExpense,
    youOwe,
  };
}
