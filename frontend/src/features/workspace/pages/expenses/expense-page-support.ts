import type { Member, Trip } from "@/src/trip/types";
export { memberInitial } from "@/src/trip/member-labels";

export {
  categoryTone,
  expenseCategories,
  expenseCategoryFilterValues,
  expenseSplitModes,
  type CategoryTone,
  type ExpenseCategoryFilter,
} from "./expense-page-options";

export function memberById(members: Member[], memberId: string): Member | undefined {
  return members.find((member) => member.id === memberId);
}

export function tripPlanName(trip: Trip, tripPlanId: string | null | undefined): string {
  const plans = trip.tripPlans ?? trip.planVariants;
  return plans.find((plan) => plan.id === tripPlanId)?.name ?? tripPlanId ?? "Unassigned";
}

export function formatReminderDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale === "th" ? "th-TH-u-ca-gregory" : "en-US", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatExchangeRateInput(rate: number): string {
  return Number.isInteger(rate) ? String(rate) : Number(rate.toFixed(6)).toString();
}
