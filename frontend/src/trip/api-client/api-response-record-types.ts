import type {
  Expense,
  ExpenseComment,
  ExpenseLineItem,
  ExpenseSettlementAllocation,
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
  spentOn?: string | null;
  storedValueCardId?: string | null;
  storedValueCardName?: string | null;
  storedValueTransactionType?: Expense["storedValueTransactionType"];
  lineItems: ExpenseLineItem[];
  comments: ExpenseComment[];
  settlementAllocations: ExpenseSettlementAllocation[];
  paidBy: string;
  category: Expense["category"];
  splits: Record<string, number>;
  itineraryItemId: string | null;
  version: number;
}
