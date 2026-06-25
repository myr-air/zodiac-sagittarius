export const expenseCategoryValues = [
  "food",
  "transport",
  "tickets",
  "stay",
  "shopping",
  "settlement",
] as const;
export type ExpenseCategory = (typeof expenseCategoryValues)[number];
export const storedValueTransactionTypeValues = ["topup", "spend", "refund"] as const;
export type StoredValueTransactionType = (typeof storedValueTransactionTypeValues)[number];

export interface Expense {
  id: string;
  tripId?: string;
  tripPlanId?: string | null;
  title: string;
  amount: number;
  amountMinor?: number;
  currency?: string;
  exchangeRateToSettlementCurrency?: number;
  notes?: string;
  receiptUrl?: string | null;
  spentOn?: string | null;
  storedValueCardId?: string | null;
  storedValueCardName?: string | null;
  storedValueTransactionType?: StoredValueTransactionType | null;
  lineItems?: ExpenseLineItem[];
  comments?: ExpenseComment[];
  settlementAllocations?: ExpenseSettlementAllocation[];
  paidBy: string;
  splits: Record<string, number>;
  category: ExpenseCategory;
  itineraryItemId?: string | null;
  version?: number;
}

export interface ExpenseSettlementAllocation {
  expenseId: string;
  memberId: string;
  amount: number;
}

export interface ExpenseLineItem {
  id: string;
  title: string;
  amount: number;
  participantIds: string[];
}

export interface ExpenseComment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface ExpenseReminder {
  tripPlanId?: string | null;
  from: string;
  to: string;
  amount: number;
  lastRemindedAt: string;
}

export interface SettlementSuggestion {
  from: string;
  to: string;
  amount: number;
  currency?: string;
  lastRemindedAt?: string | null;
}

export interface ExpenseSummary {
  groupSpend: number;
  settlementCurrency?: string;
  netByMember: Record<string, number>;
  currentUserNetLabel: string;
  settlementSuggestions: SettlementSuggestion[];
}
