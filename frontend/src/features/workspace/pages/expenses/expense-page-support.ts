import type { Expense, Member, Trip } from "@/src/trip/types";

export {
  categoryTone,
  expenseCategories,
  expenseSplitModes,
  type CategoryTone,
} from "./expense-page-options";

export function memberById(members: Member[], memberId: string): Member | undefined {
  return members.find((member) => member.id === memberId);
}

export function memberInitial(name: string): string {
  return name.trim().slice(0, 1).toLocaleUpperCase() || "?";
}

export function tripPlanName(trip: Trip, tripPlanId: string | null | undefined): string {
  const plans = trip.tripPlans ?? trip.planVariants;
  return plans.find((plan) => plan.id === tripPlanId)?.name ?? tripPlanId ?? "Unassigned";
}

export function sumShares(splits: Record<string, number>): number {
  return Math.round(Object.values(splits).reduce((sum, share) => sum + share, 0) * 100) / 100;
}

export function refundSplits(expense: Expense): Record<string, number> {
  return Object.fromEntries(
    Object.entries(expense.splits).filter(
      ([memberId, amount]) => memberId !== expense.paidBy && amount > 0,
    ),
  );
}

export function refundAmount(expense: Expense): number {
  return sumShares(refundSplits(expense));
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
