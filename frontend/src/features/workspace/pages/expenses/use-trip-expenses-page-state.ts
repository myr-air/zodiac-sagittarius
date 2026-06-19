import { useEffect, useMemo, useState } from "react";
import { slugifyFilePart } from "@/src/lib/file-names";
import {
  buildExpenseCsv,
  buildExpenseStatement,
  buildPaybackReminder,
  expenseAmountInSettlementCurrency,
} from "@/src/trip/expenses";
import type { Expense, ExpenseSummary, Member, SettlementSuggestion, Trip } from "@/src/trip/types";
import type { ExpenseInput, ExpenseUpdateInput } from "./expense-page-types";
import {
  memberById,
  refundSplits,
  sumShares,
} from "./expense-page-support";

type ExpenseCategoryFilter = "all" | Expense["category"];
type ExpenseCopyState = "idle" | "copied" | "error";
type ExpenseDialogTarget = Expense | "new" | null;

interface UseTripExpensesPageStateArgs {
  currentMember: Member;
  expenseSummary: ExpenseSummary;
  onCreateExpense: (input: ExpenseInput) => void | Promise<void>;
  onRecordPaybackReminder?: (suggestion: SettlementSuggestion) => void | Promise<void>;
  onUpdateExpense: (input: ExpenseUpdateInput) => void | Promise<void>;
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
  const [copyState, setCopyState] = useState<ExpenseCopyState>("idle");

  const settlementCurrency = expenseSummary.settlementCurrency ?? "HKD";
  const currentNet = expenseSummary.netByMember[currentMember.id] ?? 0;
  const youOwe = Math.max(0, -currentNet);
  const owedToYou = Math.max(0, currentNet);
  const statement = useMemo(
    () => buildExpenseStatement({ trip, expenseSummary }),
    [expenseSummary, trip],
  );
  const csv = useMemo(
    () => buildExpenseCsv({ trip, expenseSummary }),
    [expenseSummary, trip],
  );
  const inferredScopeExpenses = useMemo(
    () =>
      trip.expenses.filter(
        (expense) =>
          expense.category !== "settlement" &&
          Boolean(expense.tripPlanId) &&
          !expense.itineraryItemId,
      ),
    [trip.expenses],
  );
  const categorySpend = useMemo(() => {
    const totals = new Map<Expense["category"], number>();
    for (const expense of trip.expenses) {
      if (expense.category === "settlement") continue;
      totals.set(
        expense.category,
        (totals.get(expense.category) ?? 0) +
          expenseAmountInSettlementCurrency(expense, settlementCurrency),
      );
    }
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  }, [settlementCurrency, trip.expenses]);
  const filteredExpenses = useMemo(
    () =>
      trip.expenses.filter((expense) => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        const payer = memberById(trip.members, expense.paidBy);
        const linkedItem = expense.itineraryItemId
          ? trip.itineraryItems.find((item) => item.id === expense.itineraryItemId)
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
      }),
    [categoryFilter, payerFilter, query, trip.expenses, trip.itineraryItems, trip.members],
  );

  useEffect(() => {
    if (copyState === "idle") return undefined;
    const timeout = window.setTimeout(() => setCopyState("idle"), 2500);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  function clearFilters() {
    setQuery("");
    setCategoryFilter("all");
    setPayerFilter("all");
  }

  async function copyStatement() {
    try {
      await navigator.clipboard.writeText(statement);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  async function copyPaybackReminder(suggestion: SettlementSuggestion) {
    try {
      await navigator.clipboard.writeText(buildPaybackReminder({ trip, suggestion }));
      await onRecordPaybackReminder?.(suggestion);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  function downloadCsv() {
    const blob = new Blob([`${csv}\n`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugifyFilePart(trip.name)}-expenses.csv`;
    window.document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function recordSettlement(suggestion: SettlementSuggestion) {
    const from = memberById(trip.members, suggestion.from);
    const to = memberById(trip.members, suggestion.to);
    onCreateExpense({
      itemId: null,
      title: `${from?.displayName ?? "Traveler"} paid ${to?.displayName ?? "Traveler"} back`,
      amount: suggestion.amount,
      currency: suggestion.currency ?? settlementCurrency,
      exchangeRateToSettlementCurrency: 1,
      paidBy: suggestion.from,
      category: "settlement",
      splits: { [suggestion.to]: suggestion.amount },
    });
  }

  function recordRefund(expense: Expense) {
    const splits = refundSplits(expense);
    const amount = sumShares(splits);
    if (amount <= 0) return;
    onCreateExpense({
      itemId: expense.itineraryItemId ?? null,
      tripPlanId: expense.tripPlanId ?? selectedTripPlanId ?? null,
      title: `Refund: ${expense.title}`,
      amount,
      currency: expense.currency ?? settlementCurrency,
      exchangeRateToSettlementCurrency:
        expense.exchangeRateToSettlementCurrency ?? 1,
      notes: `Refund settlement for actual expense: ${expense.title}`,
      paidBy: expense.paidBy,
      category: "settlement",
      splits,
    });
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
