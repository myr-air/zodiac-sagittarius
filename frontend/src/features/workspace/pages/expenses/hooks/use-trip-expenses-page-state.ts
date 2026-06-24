import type {
  ExpenseSummary,
  Member,
  Trip,
} from "@/src/trip/types";
import type {
  CreateExpenseHandler,
  RecordPaybackReminderHandler,
  UpdateExpenseHandler,
} from "../model/expense-page-types";
import { useExpenseDialogTargetState } from "./useExpenseDialogTargetState";
import { useExpenseLedgerActions } from "./useExpenseLedgerActions";
import { useExpensePageDerivedState } from "./useExpensePageDerivedState";
import { useExpensePageFilters } from "./useExpensePageFilters";
import { useExpenseSettlementActions } from "./useExpenseSettlementActions";

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
  const {
    categoryFilter,
    clearFilters,
    payerFilter,
    query,
    setCategoryFilter,
    setPayerFilter,
    setQuery,
  } = useExpensePageFilters();
  const {
    createDialogExpense,
    dialogExpense,
    setDialogExpense,
    updateDialogExpense,
  } = useExpenseDialogTargetState({
    onCreateExpense,
    onUpdateExpense,
  });

  const {
    categorySpend,
    currentNet,
    filteredExpenses,
    inferredScopeExpenses,
    owedToYou,
    settlementCurrency,
    statement,
    youOwe,
  } = useExpensePageDerivedState({
    categoryFilter,
    currentMember,
    expenseSummary,
    payerFilter,
    query,
    trip,
  });
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
  const {
    recordRefund,
    recordSettlement,
  } = useExpenseSettlementActions({
    onCreateExpense,
    selectedTripPlanId,
    settlementCurrency,
    trip,
  });

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
