import { useCallback } from "react";
import type { WorkspaceContextRailPrimaryTab } from "@/src/trip/workspace/context-rail-tabs";
import type { TripApiClient } from "@/src/trip/api-client";
import { findItineraryItemById } from "@/src/trip/itinerary-items";
import type {
  Trip,
  TripParticipantSession,
  TripTask,
} from "@/src/trip/types";
import { useCreateWorkspaceTaskCommand } from "./use-create-workspace-task-command";
import { useToggleWorkspaceTaskStatusCommand } from "./use-toggle-workspace-task-status-command";

interface UseWorkspaceTaskActionsParams {
  canEdit: boolean;
  currentMemberId: string;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  resolveApiClient?: TripApiClient;
  selectedTripPlanId: string;
  setContextRailPreferredTab: (tab: WorkspaceContextRailPrimaryTab) => void;
  setSelectedItemId: (itemId: string) => void;
  setTasks: (updater: (current: TripTask[]) => TripTask[]) => void;
  tasks: TripTask[];
  trip: Trip;
}

export function useWorkspaceTaskActions({
  canEdit,
  currentMemberId,
  isApiMode,
  participantSession,
  resolveApiClient,
  selectedTripPlanId,
  setContextRailPreferredTab,
  setSelectedItemId,
  setTasks,
  tasks,
  trip,
}: UseWorkspaceTaskActionsParams) {
  const createTask = useCreateWorkspaceTaskCommand({
    currentMemberId,
    isApiMode,
    participantSession,
    resolveApiClient,
    selectedTripPlanId,
    setTasks,
    trip,
  });

  const createItineraryTask = useCallback(async (itemId: string) => {
    if (!canEdit) return;
    const item = findItineraryItemById(trip.itineraryItems, itemId);
    if (!item) return;
    await createTask({
      title: `Plan: ${item.activity}`,
      visibility: "shared",
      assigneeId: null,
      relatedItemId: item.id,
    });
    setContextRailPreferredTab("booking");
    setSelectedItemId(item.id);
  }, [
    canEdit,
    createTask,
    setContextRailPreferredTab,
    setSelectedItemId,
    trip.itineraryItems,
  ]);

  const toggleTaskStatus = useToggleWorkspaceTaskStatusCommand({
    isApiMode,
    participantSession,
    resolveApiClient,
    setTasks,
    tasks,
    trip,
  });

  return {
    createItineraryTask,
    createTask,
    toggleTaskStatus,
  };
}
