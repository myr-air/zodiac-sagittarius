import { defaultTripPlanId } from "@/src/trip/trip-plans";
import type { Member, Trip, Expense } from "@/src/trip/types";
import { normalizeCurrencyCode } from "@/src/trip/currencies";

export interface ExpenseDialogInitialFields {
  amount: string;
  currency: string;
  exchangeRate: string;
  exchangeRateTouched: boolean;
  itemId: string;
  notes: string;
  paidBy: string;
  receiptUrl: string;
  title: string;
}

export function initialExpenseDialogFields({
  currentMemberId,
  expense,
}: {
  currentMemberId: string;
  expense: Expense | null;
}): ExpenseDialogInitialFields {
  return {
    amount: expense ? String(expense.amount) : "",
    currency: normalizeCurrencyCode(expense?.currency ?? "HKD"),
    exchangeRate: expense?.exchangeRateToSettlementCurrency
      ? String(expense.exchangeRateToSettlementCurrency)
      : "1",
    exchangeRateTouched: Boolean(expense?.exchangeRateToSettlementCurrency),
    itemId: expense?.itineraryItemId ?? "",
    notes: expense?.notes ?? "",
    paidBy: expense?.paidBy ?? currentMemberId,
    receiptUrl: expense?.receiptUrl ?? "",
    title: expense?.title ?? "",
  };
}

export function initialExpenseSplitValues(
  members: Member[],
  expense: Expense | null,
): Record<string, string> {
  return Object.fromEntries(
    members.map((member) => [
      member.id,
      expense ? String(expense.splits[member.id] ?? 0) : "0",
    ]),
  );
}

export function expenseSplitValuesForMode(
  members: Member[],
  value: "0" | "1",
): Record<string, string> {
  return Object.fromEntries(members.map((member) => [member.id, value]));
}

export function initialExpenseTripPlanId({
  expense,
  selectedTripPlanId,
  trip,
}: {
  expense: Expense | null;
  selectedTripPlanId?: string | null;
  trip: Trip;
}): string {
  return (
    expense?.tripPlanId ??
    selectedTripPlanId ??
    defaultTripPlanId(trip)
  );
}
