import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import type { TripWorkspaceState } from "@/src/trip/workspace/use-trip-workspace-state";
import type {
  ItineraryItem,
  Member,
  Trip,
  TripDailyBriefing,
  TripParticipantSession,
} from "@/src/trip/types";
import type { WorkspacePlanningBackendExpenseSummary } from "./use-workspace-planning-records-context";

export interface UseWorkspacePlanningContextParams {
  activePlanItems: ItineraryItem[];
  backendExpenseSummary: WorkspacePlanningBackendExpenseSummary;
  canCreateStopNote: boolean;
  canCreateSuggestion: boolean;
  canEdit: boolean;
  canManageTripPlans: boolean;
  canReviewSuggestions: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  currentMember: Member;
  initialTrip: Trip;
  isApiMode: boolean;
  latestTripRef: MutableRefObject<Trip>;
  mainPlanItems: ItineraryItem[];
  participantSession: TripParticipantSession | null;
  planItems: ItineraryItem[];
  replaceDailyBriefings: (briefings: TripDailyBriefing[]) => void;
  resetBackendExpenseSummary: () => void;
  resetDailyBriefings: () => void;
  resolvedApiClient?: TripApiClient;
  selectedItemId: string;
  selectedTripPlanId: string;
  sessionRestored: boolean;
  setAccessError: (error: string | null) => void;
  setContextRailPreferredTab: (tab: "notes" | "booking") => void;
  setIsCockpitLoaded: (loaded: boolean) => void;
  setIsTripPlanBusy: Dispatch<SetStateAction<boolean>>;
  setParticipantSession: (session: TripParticipantSession | null) => void;
  setSelectedItemId: Dispatch<SetStateAction<string>>;
  setSelectedTripPlanId: Dispatch<SetStateAction<string>>;
  setTripPlanError: Dispatch<SetStateAction<string | null>>;
  setTripState: Dispatch<SetStateAction<TripWorkspaceState>>;
  trip: Trip;
  tripPlanErrorMessage: string;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}
