import { defaultTripPlanId } from "@/src/trip/trip-plans";
import type { Member, Trip, Expense } from "@/src/trip/types";
import { normalizeCurrencyCode } from "@/src/trip/currencies";

export interface ExpenseDialogInitialFields {
  amount: string;
  category: Expense["category"];
  currency: string;
  exchangeRate: string;
  exchangeRateTouched: boolean;
  itemId: string;
  notes: string;
  paidBy: string;
  repeatCount: string;
  receiptUrl: string;
  spentOn: string;
  title: string;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
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
    category: expense?.category ?? "transport",
    currency: normalizeCurrencyCode(expense?.currency ?? "HKD"),
    exchangeRate: expense?.exchangeRateToSettlementCurrency
      ? String(expense.exchangeRateToSettlementCurrency)
      : "1",
    exchangeRateTouched: Boolean(expense?.exchangeRateToSettlementCurrency),
    itemId: expense?.itineraryItemId ?? "",
    notes: expense?.notes ?? "",
    paidBy: expense?.paidBy ?? currentMemberId,
    repeatCount: "1",
    receiptUrl: expense?.receiptUrl ?? "",
    spentOn: expense?.spentOn ?? todayIsoDate(),
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
