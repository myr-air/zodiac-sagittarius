import type { PlanStatus, PlanVariant, Trip } from "@/src/trip/types";

export function normalizeTripPlanAliases(trip: Trip): Trip {
  const plansById = new Map<string, PlanVariant>();
  for (const plan of trip.tripPlans ?? []) plansById.set(plan.id, plan);
  for (const variant of trip.planVariants) plansById.set(variant.id, variant);

  const plans = Array.from(plansById.values());
  const mainTripPlanId =
    trip.mainTripPlanId || trip.activePlanVariantId || plans[0]?.id || "";
  const normalizedPlans = plans.map((plan) =>
    normalizeTripPlanSummary(plan, mainTripPlanId),
  );

  return {
    ...trip,
    activePlanVariantId: mainTripPlanId,
    mainTripPlanId,
    planVariants: normalizedPlans,
    tripPlans: normalizedPlans,
  };
}

export function updateTripPlanInTrip(
  trip: Trip,
  updatedPlan: PlanVariant,
): Trip {
  const existingPlans = trip.tripPlans ?? trip.planVariants;
  const hasPlan = trip.planVariants.some((plan) => plan.id === updatedPlan.id);
  const mergePlan = (plan: PlanVariant) =>
    plan.id === updatedPlan.id ? { ...plan, ...updatedPlan } : plan;
  return normalizeTripPlanAliases({
    ...trip,
    planVariants: hasPlan
      ? trip.planVariants.map(mergePlan)
      : [...trip.planVariants, updatedPlan],
    tripPlans: existingPlans.some((plan) => plan.id === updatedPlan.id)
      ? existingPlans.map(mergePlan)
      : [...existingPlans, updatedPlan],
  });
}

export function mergePublishedTripPlan(
  currentTrip: Trip,
  publishedTrip: Trip,
  fallbackActivePlanVariantId: string,
  createdVariant?: PlanVariant,
): Trip {
  const variantsById = new Map(
    currentTrip.planVariants.map((variant) => [variant.id, variant]),
  );
  for (const variant of publishedTrip.planVariants) {
    variantsById.set(variant.id, variant);
  }
  if (createdVariant) variantsById.set(createdVariant.id, createdVariant);
  return normalizeTripPlanAliases({
    ...currentTrip,
    activePlanVariantId:
      publishedTrip.activePlanVariantId || fallbackActivePlanVariantId,
    mainTripPlanId:
      publishedTrip.mainTripPlanId ||
      publishedTrip.activePlanVariantId ||
      fallbackActivePlanVariantId,
    planVariants: Array.from(variantsById.values()),
    tripPlans: publishedTrip.tripPlans ?? Array.from(variantsById.values()),
    version: publishedTrip.version ?? currentTrip.version,
  });
}

export function setLocalMainTripPlan(trip: Trip, tripPlanId: string): Trip {
  return normalizeTripPlanAliases({
    ...trip,
    activePlanVariantId: tripPlanId,
    mainTripPlanId: tripPlanId,
  });
}

export function normalizeTripPlanSummary(
  plan: PlanVariant,
  mainTripPlanId: string,
): PlanVariant {
  const status =
    plan.id === mainTripPlanId
      ? "main"
      : plan.status === "main" || plan.kind === "main"
        ? "backup"
        : plan.status ?? planStatusForLegacyKind(plan.kind);
  return {
    ...plan,
    kind: legacyKindForPlanStatus(status),
    status,
  };
}

export function planStatusForLegacyKind(
  kind: PlanVariant["kind"],
): NonNullable<PlanVariant["status"]> {
  return kind === "split" ? "proposal" : kind;
}

export function legacyKindForPlanStatus(
  status: Exclude<PlanStatus, "main"> | PlanStatus,
): PlanVariant["kind"] {
  return status === "proposal" ? "split" : status;
}
