import type { Member, Trip, Expense } from "@/src/trip/types";

export function initialExpenseSplitValues(
  members: Member[],
  expense: Expense | null,
): Record<string, string> {
  return Object.fromEntries(
    members.map((member) => [
      member.id,
      expense ? String(expense.splits[member.id] ?? 0) : "0",
    ]),
  );
}

export function expenseSplitValuesForMode(
  members: Member[],
  value: "0" | "1",
): Record<string, string> {
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
