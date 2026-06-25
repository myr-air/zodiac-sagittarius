import { findById } from "@/src/shared/collection";
import {
  buildSelectOptions,
  buildSelectOptionsFromItems,
  type SelectOption,
} from "@/src/shared/select-options";
import type { PlanStatus, PlanVariant, Trip } from "../types";

type TripPlanDisplaySource = Pick<
  Trip,
  "activePlanVariantId" | "mainTripPlanId" | "planVariants" | "tripPlans"
>;

export type TripPlanSelectOption = SelectOption;

export const tripPlanStatusSelectValues = [
  "main",
  "draft",
  "backup",
  "proposal",
] as const satisfies readonly PlanStatus[];

export function tripPlanOptions(
  trip: Pick<Trip, "planVariants" | "tripPlans">,
): PlanVariant[] {
  return trip.tripPlans ?? trip.planVariants;
}

export function buildTripPlanSelectOptions(
  tripPlans: readonly Pick<PlanVariant, "id" | "name">[],
): TripPlanSelectOption[] {
  return buildSelectOptionsFromItems(
    tripPlans,
    (plan) => plan.id,
    (plan) => plan.name,
  );
}

export function tripPlanStatus(plan: PlanVariant): PlanStatus {
  return plan.status ?? (plan.kind === "split" ? "proposal" : plan.kind);
}

export function formatTripPlanOptionLabel(
  plan: PlanVariant,
  statusLabels: Readonly<Record<PlanStatus, string>>,
): string {
  const status = tripPlanStatus(plan);
  return `${plan.name} - ${statusLabels[status]}`;
}

export function buildTripPlanStatusLabelSelectOptions(
  tripPlans: readonly PlanVariant[],
  statusLabels: Readonly<Record<PlanStatus, string>>,
): TripPlanSelectOption[] {
  return buildSelectOptionsFromItems(
    tripPlans,
    (plan) => plan.id,
    (plan) => formatTripPlanOptionLabel(plan, statusLabels),
  );
}

export function buildTripPlanStatusSelectOptions(
  statusLabels: Readonly<Record<PlanStatus, string>>,
): Array<SelectOption<PlanStatus>> {
  return buildSelectOptions(
    tripPlanStatusSelectValues,
    (value) => statusLabels[value],
  ).map((option) =>
    option.value === "main" ? { ...option, disabled: true } : option,
  );
}

export function findTripPlanOptionById(
  tripPlans: readonly PlanVariant[],
  tripPlanId: string | null | undefined,
): PlanVariant | null {
  return findById(tripPlans, tripPlanId);
}

export function findTripPlanById(
  trip: Pick<Trip, "planVariants" | "tripPlans">,
  tripPlanId: string | null | undefined,
): PlanVariant | null {
  return findTripPlanOptionById(tripPlanOptions(trip), tripPlanId);
}

export function defaultTripPlanId(trip: TripPlanDisplaySource): string {
  const plans = tripPlanOptions(trip);
  return (
    trip.mainTripPlanId ||
    plans.find((plan) => tripPlanStatus(plan) === "main")?.id ||
    trip.activePlanVariantId ||
    plans[0]?.id ||
    ""
  );
}

export function tripHasPlan(
  trip: Pick<Trip, "planVariants" | "tripPlans">,
  tripPlanId: string,
): boolean {
  return Boolean(findTripPlanById(trip, tripPlanId));
}

export function tripPlanName(
  trip: Trip,
  tripPlanId: string | null | undefined,
  fallback = "Unassigned",
): string {
  return findTripPlanById(trip, tripPlanId)?.name ?? tripPlanId ?? fallback;
}
