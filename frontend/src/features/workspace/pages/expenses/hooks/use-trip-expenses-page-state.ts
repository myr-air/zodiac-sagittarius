import type {
  ExpenseSummary,
  Member,
  Trip,
} from "@/src/trip/types";
import { useEffect, useState } from "react";
import {
  fetchMajorExchangeRate,
  formatExchangeRateInput,
  normalizeCurrencyCode,
  type MajorCurrencyCode,
} from "@/src/trip/currencies";
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
  apiBaseUrl: string;
  selectedTripPlanId?: string | null;
  trip: Trip;
}

export function useTripExpensesPageState({
  currentMember,
  expenseSummary,
  onCreateExpense,
  onRecordPaybackReminder,
  onUpdateExpense,
  apiBaseUrl,
  selectedTripPlanId,
  trip,
}: UseTripExpensesPageStateArgs) {
  const {
    categoryFilter,
    clearFilters,
    dayFilter,
    payerFilter,
    query,
    setCategoryFilter,
    setDayFilter,
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
    dayFilter,
    expenseSummary,
    payerFilter,
    query,
    trip,
  });
  const normalizedSettlementCurrency = normalizeCurrencyCode(settlementCurrency);
  const [displayCurrency, setDisplayCurrencyState] =
    useState<MajorCurrencyCode>(normalizedSettlementCurrency);
  const [displayExchangeRate, setDisplayExchangeRate] = useState("1");
  const [displayExchangeRateTouched, setDisplayExchangeRateTouched] =
    useState(false);

  function setDisplayCurrency(nextCurrency: string) {
    const normalizedCurrency = normalizeCurrencyCode(nextCurrency);
    setDisplayCurrencyState(normalizedCurrency);
    setDisplayExchangeRateTouched(false);
    if (normalizedCurrency === normalizedSettlementCurrency) {
      setDisplayExchangeRate("1");
    }
  }

  function changeDisplayExchangeRate(nextRate: string) {
    setDisplayExchangeRate(nextRate);
    setDisplayExchangeRateTouched(true);
  }

  useEffect(() => {
    let cancelled = false;
    if (displayCurrency === normalizedSettlementCurrency) {
      return undefined;
    }
    if (displayExchangeRateTouched) return undefined;

    fetchMajorExchangeRate(normalizedSettlementCurrency, displayCurrency, {
      backendBaseUrl: apiBaseUrl,
    })
      .then((quote) => {
        if (!cancelled && quote) {
          setDisplayExchangeRate(formatExchangeRateInput(quote.rate));
        }
      })
      .catch(() => {
        // Keep manual display-rate entry available when providers are offline.
      });

    return () => {
      cancelled = true;
    };
  }, [
    apiBaseUrl,
    displayCurrency,
    displayExchangeRateTouched,
    normalizedSettlementCurrency,
  ]);

  const effectiveDisplayExchangeRate =
    displayCurrency === normalizedSettlementCurrency
      ? "1"
      : displayExchangeRate;
  const displayExchangeRateNumber = Number(effectiveDisplayExchangeRate);
  const normalizedDisplayExchangeRate =
    Number.isFinite(displayExchangeRateNumber) && displayExchangeRateNumber > 0
      ? displayExchangeRateNumber
      : 1;
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
    pendingRefundExpenseIds,
    pendingSettlementKeys,
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
    dayFilter,
    displayCurrency,
    displayExchangeRate: effectiveDisplayExchangeRate,
    displayExchangeRateNumber: normalizedDisplayExchangeRate,
    dialogExpense,
    downloadCsv,
    filteredExpenses,
    inferredScopeExpenses,
    owedToYou,
    pendingRefundExpenseIds,
    pendingSettlementKeys,
    payerFilter,
    query,
    recordRefund,
    recordSettlement,
    setCategoryFilter,
    setDayFilter,
    setDisplayCurrency,
    setDisplayExchangeRate: changeDisplayExchangeRate,
    setDialogExpense,
    setPayerFilter,
    setQuery,
    settlementCurrency,
    updateDialogExpense,
    youOwe,
  };
}
