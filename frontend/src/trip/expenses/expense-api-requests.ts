import type {
  CreateExpenseApiRequest,
  PatchExpenseApiRequest,
} from "../api-client";
import { expenseSplitsToMinor } from "./expense-splits";
import type {
  ExpenseCreateDraft,
  ExpenseUpdateDraft,
} from "./expense-drafts";

export interface BuildCreateExpenseRequestOptions {
  clientMutationId: string;
  tripPlanId?: string | null;
}

export interface BuildPatchExpenseRequestOptions {
  clientMutationId: string;
  expectedVersion: number;
}

export function buildCreateExpenseRequest(
  draft: ExpenseCreateDraft,
  options: BuildCreateExpenseRequestOptions,
): CreateExpenseApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    title: draft.title,
    amountMinor: Math.round(draft.amount * 100),
    currency: draft.currency ?? "HKD",
    exchangeRateToSettlementCurrency:
      draft.exchangeRateToSettlementCurrency ?? 1,
    notes: draft.notes ?? "",
    receiptUrl: draft.receiptUrl ?? null,
    lineItems: draft.lineItems,
    comments: draft.comments ?? [],
    tripPlanId: options.tripPlanId,
    paidBy: draft.paidBy,
    category: draft.category,
    splits: expenseSplitsToMinor(draft.splits),
    itineraryItemId: draft.itemId,
  };
}

export function buildPatchExpenseRequest(
  draft: ExpenseUpdateDraft,
  options: BuildPatchExpenseRequestOptions,
): PatchExpenseApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    expectedVersion: options.expectedVersion,
    title: draft.title,
    amountMinor: draft.amountMinor,
    currency: draft.currency,
    exchangeRateToSettlementCurrency:
      draft.exchangeRateToSettlementCurrency,
    notes: draft.notes,
    receiptUrl: draft.receiptUrl,
    lineItems: draft.lineItems,
    comments: draft.comments,
    tripPlanId: draft.tripPlanId,
    paidBy: draft.paidBy,
    category: draft.category,
    splits: expenseSplitsToMinor(draft.splits),
    itineraryItemId: draft.itineraryItemId,
  };
}
