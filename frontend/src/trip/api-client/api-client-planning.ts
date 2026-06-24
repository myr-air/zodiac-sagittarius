import type {
  PlanCheck,
  PlanSuggestion,
  PlanVariant,
  Trip,
} from "../types";
import { tripApiRoutes } from "./api-routes";
import type { TripApiRequester } from "./api-client-transport";
import type {
  CreatePlanVariantApiRequest,
  PatchPlanVariantApiRequest,
  PublishPlanVariantApiRequest,
  TripApiClient,
} from "./api-client-types";
import {
  mapTask,
  mapTripPlanResponse,
  mapTripSummary,
} from "./api-response-planning-mappers";
import type {
  TripPlanResponse,
  TripSummaryResponse,
  TripTaskResponse,
} from "./api-response-types";

type TripPlanningApiClient = Pick<
  TripApiClient,
  | "createTripPlan"
  | "patchTripPlan"
  | "setMainTripPlan"
  | "createPlanVariant"
  | "patchPlanVariant"
  | "publishPlanVariant"
  | "createTask"
  | "patchTask"
  | "runPlanCheck"
  | "latestPlanCheck"
  | "patchPlanSuggestion"
>;

export function createTripPlanningApiClient(request: TripApiRequester): TripPlanningApiClient {
  async function createTripPlan(
    tripId: string,
    sessionToken: string,
    planRequest: CreatePlanVariantApiRequest,
  ): Promise<PlanVariant> {
    const variant = await request<TripPlanResponse>(tripApiRoutes.tripPlans(tripId), {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(planRequest),
    });
    return mapTripPlanResponse(variant);
  }

  async function patchTripPlan(
    tripId: string,
    tripPlanId: string,
    sessionToken: string,
    planRequest: PatchPlanVariantApiRequest,
  ): Promise<PlanVariant> {
    const variant = await request<TripPlanResponse>(tripApiRoutes.tripPlan(tripId, tripPlanId), {
      method: "PATCH",
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(planRequest),
    });
    return mapTripPlanResponse(variant);
  }

  async function setMainTripPlan(
    tripId: string,
    tripPlanId: string,
    sessionToken: string,
    publishRequest: PublishPlanVariantApiRequest,
  ): Promise<Trip> {
    const trip = await request<TripSummaryResponse>(tripApiRoutes.setMainTripPlan(tripId, tripPlanId), {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(publishRequest),
    });
    return mapTripSummary(trip);
  }

  return {
    createTripPlan,
    patchTripPlan,
    setMainTripPlan,
    createPlanVariant: createTripPlan,
    patchPlanVariant: patchTripPlan,
    publishPlanVariant: setMainTripPlan,
    async createTask(tripId, sessionToken, taskRequest) {
      const task = await request<TripTaskResponse>(tripApiRoutes.tasks(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(taskRequest),
      });
      return mapTask(task);
    },
    async patchTask(tripId, taskId, sessionToken, taskRequest) {
      const task = await request<TripTaskResponse>(tripApiRoutes.task(tripId, taskId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(taskRequest),
      });
      return mapTask(task);
    },
    runPlanCheck(tripId, sessionToken, tripPlanId) {
      return request<PlanCheck>(tripApiRoutes.planChecks(tripId, tripPlanId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    latestPlanCheck(tripId, sessionToken, tripPlanId) {
      return request<PlanCheck | null>(tripApiRoutes.latestPlanCheck(tripId, tripPlanId), {
        method: "GET",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    patchPlanSuggestion(tripId, suggestionId, sessionToken, suggestionRequest) {
      return request<PlanSuggestion>(tripApiRoutes.planSuggestion(tripId, suggestionId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(suggestionRequest),
      });
    },
  };
}
