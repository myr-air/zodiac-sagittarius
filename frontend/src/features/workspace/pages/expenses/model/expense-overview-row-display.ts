import { formatMoney } from "@/src/trip/expenses";
import { tripPlanName } from "@/src/trip/trip-plans";
import type { Expense, Trip } from "@/src/trip/types";
import { categoryTone, type CategoryTone } from "./expense-page-options";
import {
  formatSettlementAmountForDisplay,
  type ExpenseDisplayCurrencyOptions,
} from "./expense-display-currency";

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
  displayCurrency,
  displayExchangeRate,
  settlementCurrency,
}: {
  amount: number;
  settlementCurrency: string;
} & Partial<Pick<ExpenseDisplayCurrencyOptions, "displayCurrency" | "displayExchangeRate">>): string {
  return displayCurrency
    ? formatSettlementAmountForDisplay(amount, {
      displayCurrency,
      displayExchangeRate,
      settlementCurrency,
    })
    : formatMoney(amount, settlementCurrency);
}

export function categorySpendDisplay({
  amount,
  category,
  displayCurrency,
  displayExchangeRate,
  settlementCurrency,
}: {
  amount: number;
  category: Expense["category"];
  settlementCurrency: string;
} & Partial<Pick<ExpenseDisplayCurrencyOptions, "displayCurrency" | "displayExchangeRate">>): CategorySpendDisplay {
  return {
    amountLabel: categorySpendAmountLabel({
      amount,
      displayCurrency,
      displayExchangeRate,
      settlementCurrency,
    }),
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
