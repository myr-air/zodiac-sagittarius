import { seedTrip } from "@/src/trip/seed";
import type {
  PlanVariant,
  Trip,
} from "@/src/trip/types";

export function apiSeedTrip(): Trip {
  return {
    ...seedTrip,
    members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
  };
}

export function tripWithPlans(): Trip {
  const mainPlan = seedTrip.planVariants.find(
    (variant) => variant.id === seedTrip.activePlanVariantId,
  )!;
  const backupPlan: PlanVariant = {
    id: "plan-variant-backup",
    tripId: seedTrip.id,
    name: "Rain Plan",
    kind: "draft",
    description: "",
    version: 1,
  };
  const mainItem = seedTrip.itineraryItems.find(
    (item) => item.id === "item-dimdim",
  )!;
  return {
    ...seedTrip,
    activePlanVariantId: mainPlan.id,
    mainTripPlanId: mainPlan.id,
    planVariants: [
      { ...mainPlan, kind: "main", status: "main" },
      { ...backupPlan, kind: "draft", status: "draft" },
    ],
    tripPlans: [
      { ...mainPlan, kind: "main", status: "main" },
      { ...backupPlan, kind: "draft", status: "draft" },
    ],
    itineraryItems: [
      { ...mainItem, planVariantId: mainPlan.id },
      {
        ...mainItem,
        id: "item-rain-gallery",
        planVariantId: backupPlan.id,
        activity: "Rain plan gallery",
        place: "M+ Museum",
        sortOrder: mainItem.sortOrder + 100,
      },
    ],
  };
}

export function apiTripWithPlans(): Trip {
  return {
    ...tripWithPlans(),
    members: apiSeedTrip().members,
  };
}

export {
  tripWithPlansAndPlanScopedRecords,
} from "./sagittarius-app-plan-record-fixtures";
