import type { PlanStatus, PlanVariant } from "@/src/trip/types";

export function formatTripPlanOptionLabel(
  plan: PlanVariant,
  statusLabels: Readonly<Record<PlanStatus, string>>,
): string {
  const status = tripPlanStatus(plan);
  return `${plan.name} - ${statusLabels[status]}`;
}

export function selectedTripPlanIdForControl(
  tripPlans: PlanVariant[],
  selectedTripPlanId: string,
): string {
  if (tripPlans.some((plan) => plan.id === selectedTripPlanId)) {
    return selectedTripPlanId;
  }
  return tripPlans[0]?.id ?? "";
}

export function tripPlanStatus(plan: PlanVariant): PlanStatus {
  return plan.status ?? (plan.kind === "split" ? "proposal" : plan.kind);
}
