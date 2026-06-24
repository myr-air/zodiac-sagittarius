import type {
  Expense,
  ExpenseComment,
  ExpenseLineItem,
  ExpenseSettlementAllocation,
} from "../types";

export interface ExpenseInputLike {
  itemId: string | null;
  title: string;
  amount: number;
  tripPlanId?: string | null;
  paidBy: string;
  category: Expense["category"];
  currency?: string;
  exchangeRateToSettlementCurrency?: number;
  notes?: string;
  receiptUrl?: string | null;
  spentOn?: string | null;
  lineItems?: ExpenseLineItem[];
  comments?: ExpenseComment[];
  settlementAllocations?: ExpenseSettlementAllocation[];
  repeatCount?: number;
  splits?: Record<string, number>;
}

export type ExpenseCreateDraft = Omit<
  ExpenseInputLike,
  "repeatCount" | "splits"
> & {
  splits: Record<string, number>;
};

export interface ExpenseUpdateInputLike
  extends Omit<ExpenseInputLike, "repeatCount" | "itemId"> {
  expenseId: string;
  itemId?: string | null;
}

export interface ExpenseUpdateDraft {
  expenseId: string;
  title: string;
  amount: number;
  amountMinor: number;
  currency: string;
  exchangeRateToSettlementCurrency: number;
  notes: string;
  receiptUrl: string | null;
  spentOn: string | null;
  lineItems: ExpenseLineItem[];
  comments: ExpenseComment[];
  settlementAllocations?: ExpenseSettlementAllocation[];
  tripPlanId: string | null | undefined;
  paidBy: string;
  category: Expense["category"];
  splits: Record<string, number>;
  itineraryItemId: string | null;
}
