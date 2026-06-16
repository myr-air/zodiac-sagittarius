import { useCallback } from "react";
import {
  appendStopNote,
  buildCreateStopNoteRequest,
  buildPatchStopNoteRequest,
  createLocalStopNoteInList,
  deleteLocalStopNote,
  removeStopNote,
  replaceStopNote,
  updateLocalStopNote,
} from "@/src/trip/stop-notes";
import {
  appendTask,
  buildCreateTaskRequest,
  buildTaskCreateDraft,
  buildToggleTaskStatusRequest,
  createLocalTaskInList,
  replaceTask,
  toggleLocalTaskStatus,
} from "@/src/trip/tasks";
import {
  buildCreateEditSuggestionRequest,
  createLocalEditSuggestion,
  rejectSuggestionById,
  replaceSuggestionById,
  approveSuggestion,
} from "@/src/trip/suggestions";
import { nextClientMutationId, nextLocalSuggestionId, nextLocalTaskId, nextLocalStopNoteId } from "@/src/trip/local-ids";
import { tripPlanIdForRecord } from "@/src/trip/workspace/trip-plan-records";
import type { Trip } from "@/src/trip/types";
import type { ItineraryItem } from "@/src/trip/types";
import type { Suggestion, StopNote, TripTask } from "@/src/trip/types";
import type { TripApiClient } from "@/src/trip/api-client";
import type { TripParticipantSession } from "@/src/trip/types";

interface UseWorkspaceRecordActionsParams {
  canCreateSuggestion: boolean;
  canReviewSuggestions: boolean;
  canCreateStopNote: boolean;
  canEdit: boolean;
  isApiMode: boolean;
  resolveApiClient?: TripApiClient;
  participantSession: TripParticipantSession | null;
  trip: Trip;
  currentMemberId: string;
  selectedItem: ItineraryItem | null;
  selectedTripPlanId: string;
  suggestions: Suggestion[];
  tasks: TripTask[];
  stopNotes: StopNote[];
  setSuggestions: (updater: (current: Suggestion[]) => Suggestion[]) => void;
  setTasks: (updater: (current: TripTask[]) => TripTask[]) => void;
  setStopNotes: (updater: (current: StopNote[]) => StopNote[]) => void;
  setSelectedItemId: (itemId: string) => void;
  setContextRailPreferredTab: (tab: "notes" | "booking") => void;
  commitTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceRecordActions({
  canCreateSuggestion,
  canReviewSuggestions,
  canCreateStopNote,
  canEdit,
  isApiMode,
  resolveApiClient,
  participantSession,
  trip,
  currentMemberId,
  selectedItem,
  selectedTripPlanId,
  suggestions,
  tasks,
  stopNotes,
  setSuggestions,
  setTasks,
  setStopNotes,
  setSelectedItemId,
  setContextRailPreferredTab,
  commitTrip,
}: UseWorkspaceRecordActionsParams) {
  const suggestSelectedStop = useCallback(async () => {
    if (!canCreateSuggestion || !selectedItem) return;
    if (isApiMode && resolveApiClient && participantSession) {
      const suggestion = await resolveApiClient.createSuggestion(
        trip.id,
        participantSession.sessionToken,
        buildCreateEditSuggestionRequest(selectedItem, {
          clientMutationId: nextClientMutationId("suggestion-create"),
        }),
      );
      setSuggestions((current) => [...current, suggestion]);
      return;
    }
    setSuggestions((current) => [
      ...current,
      createLocalEditSuggestion(current, {
        tripId: trip.id,
        proposerId: currentMemberId,
        targetItem: selectedItem,
        createdAt: new Date().toISOString(),
        nextSuggestionId: nextLocalSuggestionId,
      }),
    ]);
  }, [
    canCreateSuggestion,
    isApiMode,
    resolveApiClient,
    participantSession,
    selectedItem,
    setSuggestions,
    trip,
    currentMemberId,
  ]);

  const createTask = useCallback(async (input: {
    title: string;
    visibility: TripTask["visibility"];
    assigneeId?: string | null;
    relatedItemId?: string | null;
  }) => {
    const title = input.title.trim();
    if (!title) return;
    const taskDraft = buildTaskCreateDraft(input, {
      title,
      tripPlanId: tripPlanIdForRecord(
        trip,
        input.relatedItemId ?? null,
        selectedTripPlanId,
      ),
      currentMemberId,
    });
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
    isApiMode,
    resolveApiClient,
    selectedTripPlanId,
    trip,
    participantSession,
    setTasks,
    currentMemberId,
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
    trip.itineraryItems,
    setContextRailPreferredTab,
    setSelectedItemId,
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
    resolveApiClient,
    participantSession,
    tasks,
    setTasks,
    trip.id,
  ]);

  const createStopNote = useCallback(async (input: { itemId: string; body: string }) => {
    const body = input.body.trim();
    if (!body || !canCreateStopNote) return;
    if (isApiMode && resolveApiClient && participantSession) {
      const note = await resolveApiClient.createStopNote(
        trip.id,
        participantSession.sessionToken,
        buildCreateStopNoteRequest(
          { itemId: input.itemId, body },
          {
            clientMutationId: nextClientMutationId("stop-note-create"),
            tripPlanId: tripPlanIdForRecord(
              trip,
              input.itemId,
              selectedTripPlanId,
            ),
          },
        ),
      );
      setStopNotes((current) => appendStopNote(current, note));
      return;
    }
    setStopNotes((current) =>
      createLocalStopNoteInList(
        trip,
        current,
        {
          itemId: input.itemId,
          tripPlanId: tripPlanIdForRecord(
            trip,
            input.itemId,
            selectedTripPlanId,
          ),
          body,
        },
        {
          authorId: currentMemberId,
          createdAt: new Date().toISOString(),
          nextStopNoteId: nextLocalStopNoteId,
        },
      ),
    );
  }, [
    canCreateStopNote,
    isApiMode,
    resolveApiClient,
    selectedTripPlanId,
    participantSession,
    setStopNotes,
    trip,
    currentMemberId,
  ]);

  const createItineraryNote = useCallback(async (itemId: string, body: string) => {
    if (!canCreateStopNote) return;
    const item = trip.itineraryItems.find((candidate) => candidate.id === itemId);
    if (!item) return;
    await createStopNote({ itemId: item.id, body });
    setContextRailPreferredTab("notes");
    setSelectedItemId(item.id);
  }, [canCreateStopNote, createStopNote, setContextRailPreferredTab, setSelectedItemId, trip.itineraryItems]);

  const updateStopNote = useCallback(async (input: { noteId: string; body: string }) => {
    const body = input.body.trim();
    if (!body) return;
    if (isApiMode && resolveApiClient && participantSession) {
      const existing = stopNotes.find((note) => note.id === input.noteId);
      if (!existing) return;
      const note = await resolveApiClient.patchStopNote(
        trip.id,
        input.noteId,
        participantSession.sessionToken,
        buildPatchStopNoteRequest(existing, body, {
          clientMutationId: nextClientMutationId("stop-note-patch"),
        }),
      );
      setStopNotes((current) => replaceStopNote(current, note));
      return;
    }
    setStopNotes((current) =>
      updateLocalStopNote(current, input.noteId, body, {
        currentMemberId,
        canEdit,
      }),
    );
  }, [
    canEdit,
    isApiMode,
    resolveApiClient,
    participantSession,
    setStopNotes,
    stopNotes,
    trip.id,
    currentMemberId,
  ]);

  const deleteStopNote = useCallback(async (noteId: string) => {
    if (isApiMode && resolveApiClient && participantSession) {
      await resolveApiClient.deleteStopNote(
        trip.id,
        noteId,
        participantSession.sessionToken,
      );
      setStopNotes((current) => removeStopNote(current, noteId));
      return;
    }
    setStopNotes((current) =>
      deleteLocalStopNote(current, noteId, {
        currentMemberId,
        canEdit,
      }),
    );
  }, [
    canEdit,
    isApiMode,
    resolveApiClient,
    participantSession,
    setStopNotes,
    trip.id,
    currentMemberId,
  ]);

  const reviewSuggestion = useCallback(async (
    suggestionId: string,
    decision: "approved" | "rejected",
  ) => {
    if (!canReviewSuggestions) return;
    if (isApiMode && resolveApiClient && participantSession) {
      let suggestion: Suggestion;
      if (decision === "approved") {
        suggestion = await resolveApiClient.approveSuggestion(
          trip.id,
          suggestionId,
          participantSession.sessionToken,
        );
      } else {
        suggestion = await resolveApiClient.rejectSuggestion(
          trip.id,
          suggestionId,
          participantSession.sessionToken,
        );
      }
      setSuggestions((current) =>
        replaceSuggestionById(current, suggestionId, suggestion),
      );
      return;
    }
    if (decision === "rejected") {
      setSuggestions((current) => rejectSuggestionById(current, suggestionId));
      return;
    }
    const suggestion = suggestions.find(
      (candidate) => candidate.id === suggestionId,
    );
    if (!suggestion) return;
    const result = approveSuggestion(trip.itineraryItems, suggestion);
    if (result.status === "approved") {
      commitTrip((current) => ({ ...current, itineraryItems: result.items }));
    }
    setSuggestions((current) =>
      current.map((candidate) =>
        candidate.id === suggestionId ? result.suggestion : candidate,
      ),
    );
  }, [
    canReviewSuggestions,
    isApiMode,
    resolveApiClient,
    participantSession,
    suggestions,
    setSuggestions,
    trip.id,
    trip.itineraryItems,
    commitTrip,
  ]);

  return {
    createItineraryNote,
    createItineraryTask,
    createStopNote,
    createTask,
    deleteStopNote,
    reviewSuggestion,
    suggestSelectedStop,
    toggleTaskStatus,
    updateStopNote,
  };
}
