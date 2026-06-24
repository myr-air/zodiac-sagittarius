import { formatMoney } from "@/src/trip/expenses";
import { tripPlanName } from "@/src/trip/trip-plans";
import type { Expense, Trip } from "@/src/trip/types";
import { categoryTone, type CategoryTone } from "./expense-page-options";

export interface CategorySpendDisplay {
  amountLabel: string;
  category: Expense["category"];
  tone: CategoryTone;
}

export interface ScopeAuditExpenseDisplay {
  id: string;
  title: string;
  tripPlanName: string;
}

export function categorySpendAmountLabel({
  amount,
  settlementCurrency,
}: {
  amount: number;
  settlementCurrency: string;
}): string {
  return formatMoney(amount, settlementCurrency);
}

export function categorySpendDisplay({
  amount,
  category,
  settlementCurrency,
}: {
  amount: number;
  category: Expense["category"];
  settlementCurrency: string;
}): CategorySpendDisplay {
  return {
    amountLabel: categorySpendAmountLabel({ amount, settlementCurrency }),
    category,
    tone: categoryTone(category),
  };
}

export function scopeAuditExpenseDisplay({
  expense,
  trip,
}: {
  expense: Expense;
  trip: Trip;
}): ScopeAuditExpenseDisplay {
  return {
    id: expense.id,
    title: expense.title,
    tripPlanName: tripPlanName(trip, expense.tripPlanId),
  };
}
