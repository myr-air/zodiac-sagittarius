import type { PlanStatus, PlanVariant } from "@/src/trip/types";

export interface SmartItineraryTripPlanSelectOption<Value extends string = string> {
  value: Value;
  label: string;
  disabled?: boolean;
}

export const tripPlanStatusControlValues = [
  "main",
  "draft",
  "backup",
  "proposal",
] as const satisfies readonly PlanStatus[];

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

export function buildSmartItineraryTripPlanSelectOptions(
  tripPlans: PlanVariant[],
  statusLabels: Readonly<Record<PlanStatus, string>>,
): SmartItineraryTripPlanSelectOption[] {
  return tripPlans.map((plan) => ({
    value: plan.id,
    label: formatTripPlanOptionLabel(plan, statusLabels),
  }));
}

export function smartItineraryTripPlanStatusSelectOptions(
  statusLabels: Readonly<Record<PlanStatus, string>>,
): SmartItineraryTripPlanSelectOption<PlanStatus>[] {
  return tripPlanStatusControlValues.map((value) => ({
    value,
    label: statusLabels[value],
    ...(value === "main" ? { disabled: true } : {}),
  }));
}
