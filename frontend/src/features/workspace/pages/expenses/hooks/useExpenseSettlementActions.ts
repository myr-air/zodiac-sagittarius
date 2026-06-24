import type {
  Expense,
  SettlementSuggestion,
  Trip,
} from "@/src/trip/types";
import {
  buildRefundExpenseInput,
  buildSettlementExpenseInput,
} from "../model/expense-page-actions";
import type { CreateExpenseHandler } from "../model/expense-page-types";

interface UseExpenseSettlementActionsInput {
  onCreateExpense: CreateExpenseHandler;
  selectedTripPlanId?: string | null;
  settlementCurrency: string;
  trip: Trip;
}

export function useExpenseSettlementActions({
  onCreateExpense,
  selectedTripPlanId,
  settlementCurrency,
  trip,
}: UseExpenseSettlementActionsInput) {
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

  return {
    recordRefund,
    recordSettlement,
  };
}
