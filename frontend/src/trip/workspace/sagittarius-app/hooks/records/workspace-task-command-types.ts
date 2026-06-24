import type { TripApiClient } from "@/src/trip/api-client";
import type { Trip, TripParticipantSession, TripTask } from "@/src/trip/types";

export interface WorkspaceTaskCommandBaseParams {
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  resolveApiClient?: TripApiClient;
  setTasks: (updater: (current: TripTask[]) => TripTask[]) => void;
  trip: Trip;
}

export interface UseCreateWorkspaceTaskCommandParams
  extends WorkspaceTaskCommandBaseParams {
  currentMemberId: string;
  selectedTripPlanId: string;
}

export interface UseToggleWorkspaceTaskStatusCommandParams
  extends WorkspaceTaskCommandBaseParams {
  tasks: TripTask[];
}

export type CreateTaskCommand = (input: {
  title: string;
  visibility: TripTask["visibility"];
  assigneeId?: string | null;
  relatedItemId?: string | null;
}) => Promise<void>;

export type ToggleTaskStatusCommand = (taskId: string) => Promise<void>;
