import type {
  Expense,
  ExpenseComment,
  ExpenseLineItem,
} from "../types";

export interface ExpenseResponse {
  id: string;
  tripId: string;
  tripPlanId?: string | null;
  title: string;
  amountMinor: number;
  currency: string;
  exchangeRateToSettlementCurrency: number;
  notes: string | null;
  receiptUrl: string | null;
  lineItems: ExpenseLineItem[];
  comments: ExpenseComment[];
  paidBy: string;
  category: Expense["category"];
  splits: Record<string, number>;
  itineraryItemId: string | null;
  version: number;
}
