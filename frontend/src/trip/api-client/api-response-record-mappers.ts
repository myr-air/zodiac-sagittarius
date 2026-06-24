import { normalizeExpenseSplitsFromMinor } from "../expenses";
import type { Expense } from "../types";
import type { ExpenseResponse } from "./api-response-record-types";

export function mapExpense(expense: ExpenseResponse): Expense {
  return {
    id: expense.id,
    tripId: expense.tripId,
    tripPlanId: expense.tripPlanId,
    title: expense.title,
    amount: expense.amountMinor / 100,
    amountMinor: expense.amountMinor,
    currency: expense.currency,
    exchangeRateToSettlementCurrency: expense.exchangeRateToSettlementCurrency,
    notes: expense.notes ?? "",
    receiptUrl: expense.receiptUrl,
    lineItems: expense.lineItems ?? [],
    comments: expense.comments ?? [],
    settlementAllocations: expense.settlementAllocations ?? [],
    paidBy: expense.paidBy,
    splits: normalizeExpenseSplitsFromMinor(expense.splits),
    category: expense.category,
    itineraryItemId: expense.itineraryItemId,
    version: expense.version,
  };
}
