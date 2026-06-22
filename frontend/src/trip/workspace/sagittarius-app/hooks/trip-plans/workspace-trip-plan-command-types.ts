import type { TripApiClient } from "@/src/trip/api-client";
import type { PlanStatus, Trip, TripParticipantSession } from "@/src/trip/types";

export interface UseWorkspaceTripPlanPatchCommandsParams {
  canManageTripPlans: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  reloadTripPlanConflict: (preferredTripPlanId?: string | null) => Promise<void>;
  resolvedApiClient?: TripApiClient;
  setIsTripPlanBusy: (busy: boolean) => void;
  setTripPlanError: (error: string | null) => void;
  trip: Trip;
  tripPlanErrorMessage: string;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export interface UseWorkspaceTripPlanMutationCommandsParams
  extends UseWorkspaceTripPlanPatchCommandsParams {
  rememberSelectedTripPlanId: (trip: Trip, tripPlanId: string) => void;
  setSelectedTripPlanId: (tripPlanId: string) => void;
}

export type UseWorkspaceTripPlanCreateCommandParams =
  UseWorkspaceTripPlanMutationCommandsParams;

export type UseWorkspaceTripPlanMainCommandParams =
  UseWorkspaceTripPlanMutationCommandsParams;

export type CreateTripPlanCommand = (name: string) => Promise<boolean>;

export type SetMainTripPlanCommand = (tripPlanId: string) => Promise<boolean>;

export type UpdateTripPlanStatusCommand = (
  tripPlanId: string,
  status: Exclude<PlanStatus, "main">,
) => Promise<boolean>;

export type RenameTripPlanCommand = (
  tripPlanId: string,
  name: string,
) => Promise<boolean>;
