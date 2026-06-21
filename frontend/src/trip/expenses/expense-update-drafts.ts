import { buildExpenseSplits } from "./expense-splits";
import type {
  ExpenseUpdateDraft,
  ExpenseUpdateInputLike,
} from "./expense-draft-inputs";
import type { Expense, Trip } from "../types";

export interface BuildExpenseUpdateDraftOptions<
  T extends Pick<
    Trip,
    "members" | "itineraryItems" | "mainTripPlanId" | "activePlanVariantId"
  >,
> {
  selectedTripPlanId?: string | null;
  resolveTripPlanId: (
    trip: T,
    recordId: string | null | undefined,
    preferredTripPlanId?: string | null,
  ) => string | null | undefined;
}

export function buildExpenseUpdateDraft<
  T extends Pick<
    Trip,
    "members" | "itineraryItems" | "mainTripPlanId" | "activePlanVariantId"
  >,
>(
  trip: T,
  existing: Expense,
  input: ExpenseUpdateInputLike,
  options: BuildExpenseUpdateDraftOptions<T>,
): ExpenseUpdateDraft {
  const amountMinor = Math.round(input.amount * 100);
  const splits =
    input.splits ??
    buildExpenseSplits({
      amount: input.amount,
      memberIds: trip.members.map((member) => member.id),
      mode: "equal",
    });
  const itineraryItemId =
    input.itemId === undefined
      ? (existing.itineraryItemId ?? null)
      : input.itemId;
  const tripPlanId = options.resolveTripPlanId(
    trip,
    itineraryItemId,
    input.tripPlanId ?? existing.tripPlanId ?? options.selectedTripPlanId,
  );

  return {
    expenseId: input.expenseId,
    title: input.title,
    amount: input.amount,
    amountMinor,
    currency: input.currency ?? existing.currency ?? "HKD",
    exchangeRateToSettlementCurrency:
      input.exchangeRateToSettlementCurrency ??
      existing.exchangeRateToSettlementCurrency ??
      1,
    notes: input.notes ?? existing.notes ?? "",
    receiptUrl: input.receiptUrl ?? existing.receiptUrl ?? null,
    lineItems: input.lineItems ?? existing.lineItems ?? [],
    comments: input.comments ?? existing.comments ?? [],
    tripPlanId,
    paidBy: input.paidBy,
    category: input.category,
    splits,
    itineraryItemId,
  };
}
