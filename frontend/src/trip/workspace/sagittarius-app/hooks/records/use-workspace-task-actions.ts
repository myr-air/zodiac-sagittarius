import { useCallback } from "react";
import { nextClientMutationId, nextLocalTaskId } from "@/src/trip/identity";
import type { WorkspaceContextRailPrimaryTab } from "@/src/trip/workspace/context-rail-tabs";
import {
  appendTask,
  buildCreateTaskRequest,
  buildToggleTaskStatusRequest,
  createLocalTaskInList,
  replaceTask,
  toggleLocalTaskStatus,
} from "@/src/trip/records";
import type { TripApiClient } from "@/src/trip/api-client";
import type {
  Trip,
  TripParticipantSession,
  TripTask,
} from "@/src/trip/types";
import { buildWorkspaceTaskCreateDraft } from "../../support/workspace-record-command-inputs";

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
  const createTask = useCallback(async (input: {
    title: string;
    visibility: TripTask["visibility"];
    assigneeId?: string | null;
    relatedItemId?: string | null;
  }) => {
    const taskDraft = buildWorkspaceTaskCreateDraft(input, {
      currentMemberId,
      selectedTripPlanId,
      trip,
    });
    if (!taskDraft) return;
    if (isApiMode && resolveApiClient && participantSession) {
      const task = await resolveApiClient.createTask(
        trip.id,
        participantSession.sessionToken,
        buildCreateTaskRequest(taskDraft, {
          clientMutationId: nextClientMutationId("task-create"),
        }),
      );
      setTasks((current) => appendTask(current, task));
      return;
    }
    setTasks((current) =>
      createLocalTaskInList(current, taskDraft, {
        nextTaskId: nextLocalTaskId,
      }),
    );
  }, [
    currentMemberId,
    isApiMode,
    participantSession,
    resolveApiClient,
    selectedTripPlanId,
    setTasks,
    trip,
  ]);

  const createItineraryTask = useCallback(async (itemId: string) => {
    if (!canEdit) return;
    const item = trip.itineraryItems.find((candidate) => candidate.id === itemId);
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

  const toggleTaskStatus = useCallback(async (taskId: string) => {
    if (isApiMode && resolveApiClient && participantSession) {
      const task = tasks.find((candidate) => candidate.id === taskId);
      if (!task) return;
      const nextTask = await resolveApiClient.patchTask(
        trip.id,
        taskId,
        participantSession.sessionToken,
        buildToggleTaskStatusRequest(task, {
          clientMutationId: nextClientMutationId("task-patch"),
        }),
      );
      setTasks((current) => replaceTask(current, nextTask));
      return;
    }
    setTasks((current) => toggleLocalTaskStatus(current, taskId));
  }, [
    isApiMode,
    participantSession,
    resolveApiClient,
    setTasks,
    tasks,
    trip.id,
  ]);

  return {
    createItineraryTask,
    createTask,
    toggleTaskStatus,
  };
}
