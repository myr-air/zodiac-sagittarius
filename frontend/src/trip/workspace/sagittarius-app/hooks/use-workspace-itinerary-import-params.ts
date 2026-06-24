import type { TripApiClient } from "@/src/trip/api-client";
import type {
  ExpenseSummary,
  ItineraryItem,
  StopNote,
  Trip,
  TripParticipantSession,
  TripTask,
} from "@/src/trip/types";

export interface UseWorkspaceItineraryImportOptions {
  canEdit: boolean;
  commitTrip: (
    updater: (current: Trip) => Trip,
    nextSelectedItemId?: string,
  ) => void;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  selectedTripPlanId: string;
  setBackendExpenseSummary: (
    summary: { tripPlanId: string; summary: ExpenseSummary } | null,
  ) => void;
  setContextRailVisibility: (open: boolean) => void;
  setSelectedItemId: (itemId: string) => void;
  setStopNotes: (updater: (current: StopNote[]) => StopNote[]) => void;
  setTasks: (updater: (current: TripTask[]) => TripTask[]) => void;
  stopNotes: StopNote[];
  tasks: TripTask[];
  trip: Trip;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
  apiClient?: TripApiClient;
  planItems: ItineraryItem[];
}
