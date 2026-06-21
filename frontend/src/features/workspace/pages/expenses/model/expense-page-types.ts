import type { useI18n } from "@/src/i18n/I18nProvider";
import type { CopyFeedbackState } from "@/src/shared/hooks/use-copy-feedback-state";
import type {
  Expense,
  ExpenseComment,
  ExpenseLineItem,
  SettlementSuggestion,
} from "@/src/trip/types";
import type { WorkspaceMutationResult } from "../../../model/workspace-action-types";

export type { ExpenseCategoryFilter } from "./expense-page-options";
export type ExpenseCopyState = CopyFeedbackState;
export type ExpenseDialogTarget = Expense | "new" | null;
export type ExpensePageLabels = ReturnType<typeof useI18n>["t"];

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

export type ExpenseMutationResult = WorkspaceMutationResult;

export type CreateExpenseHandler = (
  input: ExpenseInput,
) => ExpenseMutationResult;

export type UpdateExpenseHandler = (
  input: ExpenseUpdateInput,
) => ExpenseMutationResult;

export type DeleteExpenseHandler = (expenseId: string) => void;

export type DuplicateExpenseAsEstimateHandler = (
  expense: Expense,
) => ExpenseMutationResult;

export type RecordPaybackReminderHandler = (
  suggestion: SettlementSuggestion,
) => ExpenseMutationResult;
