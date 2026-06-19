import { buildExpenseSplits } from "./expense-splits";
import type {
  Expense,
  ExpenseComment,
  ExpenseLineItem,
  Trip,
} from "./types";

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
  lineItems?: ExpenseLineItem[];
  comments?: ExpenseComment[];
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
  lineItems: ExpenseLineItem[];
  comments: ExpenseComment[];
  tripPlanId: string | null | undefined;
  paidBy: string;
  category: Expense["category"];
  splits: Record<string, number>;
  itineraryItemId: string | null;
}

export interface AppendLocalExpensesOptions<
  T extends Pick<
    Trip,
    "id" | "expenses" | "itineraryItems" | "mainTripPlanId" | "activePlanVariantId"
  >,
> {
  selectedTripPlanId?: string | null;
  nextExpenseId: (expenses: Expense[]) => string;
  resolveTripPlanId: (
    trip: T,
    recordId: string | null | undefined,
    preferredTripPlanId?: string | null,
  ) => string | null | undefined;
}

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
  lineItems: ExpenseLineItem[] | undefined,
  repeatIndex: number,
  repeatCount: number,
): ExpenseLineItem[] | undefined {
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

export function appendLocalExpensesToTrip<
  T extends Pick<
    Trip,
    "id" | "expenses" | "itineraryItems" | "mainTripPlanId" | "activePlanVariantId"
  >,
>(
  trip: T,
  drafts: ExpenseCreateDraft[],
  options: AppendLocalExpensesOptions<T>,
): T {
  const expenses = [...trip.expenses];

  for (const draft of drafts) {
    expenses.push({
      id: options.nextExpenseId(expenses),
      tripId: trip.id,
      title: draft.title,
      amount: draft.amount,
      amountMinor: Math.round(draft.amount * 100),
      currency: draft.currency ?? "HKD",
      exchangeRateToSettlementCurrency:
        draft.exchangeRateToSettlementCurrency ?? 1,
      notes: draft.notes ?? "",
      receiptUrl: draft.receiptUrl ?? null,
      lineItems: draft.lineItems ?? [],
      comments: draft.comments ?? [],
      tripPlanId: options.resolveTripPlanId(
        trip,
        draft.itemId,
        draft.tripPlanId ?? options.selectedTripPlanId,
      ),
      paidBy: draft.paidBy,
      category: draft.category,
      splits: draft.splits,
      itineraryItemId: draft.itemId,
      version: 1,
    });
  }

  return { ...trip, expenses };
}

export function appendExpensesToTrip<T extends Pick<Trip, "expenses">>(
  trip: T,
  expenses: Expense[],
): T {
  return {
    ...trip,
    expenses: [...trip.expenses, ...expenses],
  };
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

export function replaceExpenseInTrip<T extends Pick<Trip, "expenses">>(
  trip: T,
  expense: Expense,
): T {
  return {
    ...trip,
    expenses: trip.expenses.map((candidate) =>
      candidate.id === expense.id ? expense : candidate,
    ),
  };
}

export function updateLocalExpenseInTrip<T extends Pick<Trip, "expenses">>(
  trip: T,
  draft: ExpenseUpdateDraft,
): T {
  return {
    ...trip,
    expenses: trip.expenses.map((expense) =>
      expense.id === draft.expenseId
        ? {
            ...expense,
            title: draft.title,
            amount: draft.amount,
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
            splits: draft.splits,
            itineraryItemId: draft.itineraryItemId,
            version: (expense.version ?? 1) + 1,
          }
        : expense,
    ),
  };
}

export function removeExpenseFromTrip<T extends Pick<Trip, "expenses">>(
  trip: T,
  expenseId: string,
): T {
  return {
    ...trip,
    expenses: trip.expenses.filter((expense) => expense.id !== expenseId),
  };
}
