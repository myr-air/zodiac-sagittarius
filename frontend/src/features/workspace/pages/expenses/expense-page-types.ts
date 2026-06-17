import type { Expense, ExpenseComment, ExpenseLineItem } from "@/src/trip/types";

export interface ExpenseInput {
  itemId: string | null;
  tripPlanId?: string | null;
  title: string;
  amount: number;
  currency: string;
  exchangeRateToSettlementCurrency?: number;
  notes?: string;
  receiptUrl?: string | null;
  lineItems?: ExpenseLineItem[];
  comments?: ExpenseComment[];
  repeatCount?: number;
  paidBy: string;
  category: Expense["category"];
  splits: Record<string, number>;
}

export interface ExpenseUpdateInput extends ExpenseInput {
  expenseId: string;
}
