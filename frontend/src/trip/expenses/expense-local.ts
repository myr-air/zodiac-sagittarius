import type {
  ExpenseCreateDraft,
  ExpenseUpdateDraft,
} from "./expense-draft-inputs";
import type { Expense, Trip } from "../types";

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
      spentOn: draft.spentOn ?? null,
      lineItems: draft.lineItems ?? [],
      comments: draft.comments ?? [],
      settlementAllocations: draft.settlementAllocations ?? [],
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
            spentOn: draft.spentOn,
            lineItems: draft.lineItems,
            comments: draft.comments,
            settlementAllocations: draft.settlementAllocations ?? expense.settlementAllocations ?? [],
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
