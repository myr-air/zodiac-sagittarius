import type { Expense, Member, Trip } from "@/src/trip/types";

type CategoryTone = { background: string; border: string; dot: string; text: string };

const categoryTones: Record<Expense["category"], CategoryTone> = {
  food: { background: "#fff7ed", border: "#fed7aa", dot: "#f97316", text: "#9a3412" },
  transport: { background: "#eff6ff", border: "#bfdbfe", dot: "#2563eb", text: "#1d4ed8" },
  tickets: { background: "#fdf2f8", border: "#fbcfe8", dot: "#db2777", text: "#9d174d" },
  stay: { background: "#fff8e6", border: "#f8d78f", dot: "#b45309", text: "#92400e" },
  shopping: { background: "#fefce8", border: "#fde68a", dot: "#ca8a04", text: "#854d0e" },
  settlement: { background: "#f0fdf4", border: "#bbf7d0", dot: "#16a34a", text: "#166534" },
};

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

export function categoryTone(category: Expense["category"]): CategoryTone {
  return categoryTones[category];
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
