import { buildExpenseSplits } from "./expense-splits";
import type {
  ExpenseCreateDraft,
  ExpenseInputLike,
} from "./expense-draft-inputs";
import type { Trip } from "./types";

export interface ResolveExpenseCreateDraftTripPlanIdOptions<
  T extends Pick<
    Trip,
    "itineraryItems" | "mainTripPlanId" | "activePlanVariantId"
  >,
> {
  selectedTripPlanId?: string | null;
  resolveTripPlanId: (
    trip: T,
    recordId: string | null | undefined,
    preferredTripPlanId?: string | null,
  ) => string | null | undefined;
}

export function normalizeExpenseRepeatCount(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return 1;
  return Math.min(31, Math.max(1, Math.floor(value)));
}

export function repeatExpenseLineItems(
  lineItems: ExpenseInputLike["lineItems"],
  repeatIndex: number,
  repeatCount: number,
): ExpenseInputLike["lineItems"] {
  if (!lineItems) return undefined;
  if (repeatCount <= 1) return lineItems;
  return lineItems.map((lineItem) => ({
    ...lineItem,
    id: `${lineItem.id}-repeat-${repeatIndex + 1}`,
  }));
}

export function buildExpenseCreateDrafts(
  input: ExpenseInputLike,
  memberIds: string[],
): ExpenseCreateDraft[] {
  const repeatCount = normalizeExpenseRepeatCount(input.repeatCount);
  const splits =
    input.splits ??
    buildExpenseSplits({
      amount: input.amount,
      memberIds,
      mode: "equal",
    });

  return Array.from({ length: repeatCount }, (_, index) => ({
    ...input,
    title:
      repeatCount > 1
        ? `${input.title} (${index + 1}/${repeatCount})`
        : input.title,
    lineItems: repeatExpenseLineItems(input.lineItems, index, repeatCount),
    splits,
  }));
}

export function resolveExpenseCreateDraftTripPlanId<
  T extends Pick<
    Trip,
    "itineraryItems" | "mainTripPlanId" | "activePlanVariantId"
  >,
>(
  trip: T,
  draft: Pick<ExpenseCreateDraft, "itemId" | "tripPlanId">,
  options: ResolveExpenseCreateDraftTripPlanIdOptions<T>,
): string | null | undefined {
  return options.resolveTripPlanId(
    trip,
    draft.itemId,
    draft.tripPlanId ?? options.selectedTripPlanId,
  );
}
