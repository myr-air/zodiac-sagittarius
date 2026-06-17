import type { Expense, ExpenseLineItem, Member, Trip } from "@/src/trip/types";

export interface EditableExpenseLineItem {
  id: string;
  title: string;
  amount: string;
  participantIds: string[];
}

export function emptyExpenseLineItem(members: Member[], index: number): EditableExpenseLineItem {
  return {
    id: `line-${Date.now().toString(36)}-${index}`,
    title: "",
    amount: "",
    participantIds: members.map((member) => member.id),
  };
}

export function initialExpenseLineItems(expense: Expense | null, members: Member[]): EditableExpenseLineItem[] {
  if (!expense?.lineItems?.length) {
    return [emptyExpenseLineItem(members, 1)];
  }

  return expense.lineItems.map((lineItem) => ({
    ...lineItem,
    amount: String(lineItem.amount),
    participantIds: lineItem.participantIds.filter((memberId) => members.some((member) => member.id === memberId)),
  }));
}

export function initialExpenseSplitValues(members: Member[], expense: Expense | null): Record<string, string> {
  return Object.fromEntries(members.map((member) => [member.id, expense ? String(expense.splits[member.id] ?? 0) : "0"]));
}

export function expenseSplitValuesForMode(members: Member[], value: "0" | "1"): Record<string, string> {
  return Object.fromEntries(members.map((member) => [member.id, value]));
}

export function initialExpenseTripPlanId({
  expense,
  selectedTripPlanId,
  trip,
}: {
  expense: Expense | null;
  selectedTripPlanId?: string | null;
  trip: Trip;
}): string {
  return (
    expense?.tripPlanId ??
    selectedTripPlanId ??
    trip.mainTripPlanId ??
    trip.activePlanVariantId ??
    trip.tripPlans?.[0]?.id ??
    trip.planVariants[0]?.id ??
    ""
  );
}

export function parseExpenseLineItems(lineItems: EditableExpenseLineItem[]): ExpenseLineItem[] {
  return lineItems.map((lineItem, index) => ({
    id: lineItem.id || `line-${index + 1}`,
    title: lineItem.title.trim(),
    amount: Number(lineItem.amount || 0),
    participantIds: lineItem.participantIds,
  }));
}

export function validExpenseLineItems(lineItems: ExpenseLineItem[]): ExpenseLineItem[] {
  return lineItems.filter((lineItem) => lineItem.title && Number.isFinite(lineItem.amount) && lineItem.amount > 0 && lineItem.participantIds.length > 0);
}
