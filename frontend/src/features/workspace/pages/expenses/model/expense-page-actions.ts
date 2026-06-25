import {
  convertToSettlementCurrency,
  expenseExchangeRate,
  refundSplits,
  roundMoney,
  sumShares,
} from "@/src/trip/expenses";
import { findMemberById } from "@/src/trip/members";
import { displayNameOrFallback } from "@/src/shared/text-parts";
import type { Expense, ExpenseSettlementAllocation, Member, SettlementSuggestion, Trip } from "@/src/trip/types";
import type { ExpenseInput } from "./expense-page-types";

export function buildSettlementExpenseInput({
  members,
  selectedTripPlanId,
  settlementCurrency,
  suggestion,
  trip,
}: {
  members: Member[];
  selectedTripPlanId?: string | null;
  settlementCurrency: string;
  suggestion: SettlementSuggestion;
  trip: Pick<Trip, "expenses">;
}): ExpenseInput {
  const from = findMemberById(members, suggestion.from);
  const to = findMemberById(members, suggestion.to);
  return {
    itemId: null,
    tripPlanId: selectedTripPlanId ?? null,
    title: `${displayNameOrFallback(from, "Traveler")} paid ${displayNameOrFallback(to, "Traveler")} back`,
    amount: suggestion.amount,
    currency: suggestion.currency ?? settlementCurrency,
    exchangeRateToSettlementCurrency: 1,
    paidBy: suggestion.from,
    category: "settlement",
    splits: { [suggestion.to]: suggestion.amount },
    settlementAllocations: settlementAllocationsForSuggestion({
      settlementCurrency,
      suggestion,
      trip,
    }),
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
    settlementAllocations: Object.entries(splits)
      .filter(([, amount]) => amount > 0)
      .map(([memberId, amount]) => ({
        expenseId: expense.id,
        memberId,
        amount: roundMoney(
          convertToSettlementCurrency(
            amount,
            expenseExchangeRate(expense, settlementCurrency),
          ),
        ),
      })),
  };
}

function settlementAllocationsForSuggestion({
  settlementCurrency,
  suggestion,
  trip,
}: {
  settlementCurrency: string;
  suggestion: SettlementSuggestion;
  trip: Pick<Trip, "expenses">;
}): ExpenseSettlementAllocation[] {
  let remaining = suggestion.amount;
  const allocations: ExpenseSettlementAllocation[] = [];
  const coveredByExpenseId = existingSettlementCoverageForMember({
    memberId: suggestion.from,
    trip,
  });
  const debtExpenses = [...trip.expenses]
    .filter((expense) =>
      expense.category !== "settlement" &&
      expense.paidBy !== suggestion.from &&
      (expense.splits[suggestion.from] ?? 0) > 0
    );

  for (const expense of debtExpenses) {
    if (remaining <= 0) break;
    const share = expense.splits[suggestion.from] ?? 0;
    const shareInSettlementCurrency = convertToSettlementCurrency(
      share,
      expenseExchangeRate(expense, settlementCurrency),
    );
    const outstanding = roundMoney(
      shareInSettlementCurrency - (coveredByExpenseId.get(expense.id) ?? 0),
    );
    const amount = Math.min(outstanding, remaining);
    if (amount <= 0) continue;
    allocations.push({
      expenseId: expense.id,
      memberId: suggestion.from,
      amount: roundMoney(amount),
    });
    remaining = roundMoney(remaining - amount);
  }

  return allocations;
}

function existingSettlementCoverageForMember({
  memberId,
  trip,
}: {
  memberId: string;
  trip: Pick<Trip, "expenses">;
}): Map<string, number> {
  const coverage = new Map<string, number>();
  for (const settlement of trip.expenses.filter((expense) => expense.category === "settlement" && expense.paidBy === memberId)) {
    for (const allocation of settlement.settlementAllocations ?? []) {
      if (allocation.memberId !== memberId || allocation.amount <= 0) continue;
      coverage.set(
        allocation.expenseId,
        roundMoney((coverage.get(allocation.expenseId) ?? 0) + allocation.amount),
      );
    }
  }
  return coverage;
}
