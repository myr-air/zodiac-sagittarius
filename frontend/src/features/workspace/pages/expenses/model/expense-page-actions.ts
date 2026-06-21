import { refundSplits, sumShares } from "@/src/trip/expenses";
import { findMemberById } from "@/src/trip/members";
import type { Expense, Member, SettlementSuggestion } from "@/src/trip/types";
import type { ExpenseInput } from "./expense-page-types";

export function buildSettlementExpenseInput({
  members,
  settlementCurrency,
  suggestion,
}: {
  members: Member[];
  settlementCurrency: string;
  suggestion: SettlementSuggestion;
}): ExpenseInput {
  const from = findMemberById(members, suggestion.from);
  const to = findMemberById(members, suggestion.to);
  return {
    itemId: null,
    title: `${from?.displayName ?? "Traveler"} paid ${to?.displayName ?? "Traveler"} back`,
    amount: suggestion.amount,
    currency: suggestion.currency ?? settlementCurrency,
    exchangeRateToSettlementCurrency: 1,
    paidBy: suggestion.from,
    category: "settlement",
    splits: { [suggestion.to]: suggestion.amount },
  };
}

export function buildRefundExpenseInput({
  expense,
  selectedTripPlanId,
  settlementCurrency,
}: {
  expense: Expense;
  selectedTripPlanId?: string | null;
  settlementCurrency: string;
}): ExpenseInput | null {
  const splits = refundSplits(expense);
  const amount = sumShares(splits);
  if (amount <= 0) return null;
  return {
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
  };
}
