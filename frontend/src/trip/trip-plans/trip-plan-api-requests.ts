import type {
  CreatePlanVariantApiRequest,
  PatchPlanVariantApiRequest,
  PublishPlanVariantApiRequest,
} from "@/src/trip/api-client";
import type { PlanStatus, PlanVariant } from "@/src/trip/types";

export function buildSetMainTripPlanRequest(
  clientMutationId: string,
): PublishPlanVariantApiRequest {
  return { clientMutationId };
}

export function buildPatchTripPlanStatusRequest(
  plan: PlanVariant,
  status: Exclude<PlanStatus, "main">,
  clientMutationId: string,
): PatchPlanVariantApiRequest {
  return {
    clientMutationId,
    expectedVersion: plan.version ?? 1,
    patch: { status },
  };
}

export function buildRenameTripPlanRequest(
  plan: PlanVariant,
  name: string,
  clientMutationId: string,
): PatchPlanVariantApiRequest {
  return {
    clientMutationId,
    expectedVersion: plan.version ?? 1,
    patch: { name },
  };
}

export function buildCreateTripPlanRequest(
  name: string,
  clientMutationId: string,
): CreatePlanVariantApiRequest {
  return {
    clientMutationId,
    name,
    status: "draft",
    creationMode: "blank",
    description: "",
  };
}
