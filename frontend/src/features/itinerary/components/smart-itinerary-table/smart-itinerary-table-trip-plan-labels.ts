import type { SelectOption } from "@/src/shared/select-options";
import {
  buildTripPlanStatusLabelSelectOptions,
  buildTripPlanStatusSelectOptions,
  formatTripPlanOptionLabel,
  tripPlanStatus,
} from "@/src/trip/trip-plans";
import type { PlanStatus, PlanVariant } from "@/src/trip/types";

export type SmartItineraryTripPlanSelectOption<Value extends string = string> =
  SelectOption<Value>;

export { formatTripPlanOptionLabel, tripPlanStatus };

export function selectedTripPlanIdForControl(
  tripPlans: PlanVariant[],
  selectedTripPlanId: string,
): string {
  if (tripPlans.some((plan) => plan.id === selectedTripPlanId)) {
    return selectedTripPlanId;
  }
  return tripPlans[0]?.id ?? "";
}

export function buildSmartItineraryTripPlanSelectOptions(
  tripPlans: PlanVariant[],
  statusLabels: Readonly<Record<PlanStatus, string>>,
): SmartItineraryTripPlanSelectOption[] {
  return buildTripPlanStatusLabelSelectOptions(tripPlans, statusLabels);
}

export function smartItineraryTripPlanStatusSelectOptions(
  statusLabels: Readonly<Record<PlanStatus, string>>,
): SmartItineraryTripPlanSelectOption<PlanStatus>[] {
  return buildTripPlanStatusSelectOptions(statusLabels);
}
