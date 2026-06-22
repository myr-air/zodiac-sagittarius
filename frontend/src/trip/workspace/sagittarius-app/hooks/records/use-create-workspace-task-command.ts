import { useCallback } from "react";
import { nextClientMutationId, nextLocalTaskId } from "@/src/trip/identity";
import {
  appendTask,
  buildCreateTaskRequest,
  createLocalTaskInList,
} from "@/src/trip/records";
import { buildWorkspaceTaskCreateDraft } from "../../support/workspace-record-command-inputs";
import type {
  CreateTaskCommand,
  UseCreateWorkspaceTaskCommandParams,
} from "./workspace-task-command-types";

export function useCreateWorkspaceTaskCommand({
  currentMemberId,
  isApiMode,
  participantSession,
  resolveApiClient,
  selectedTripPlanId,
  setTasks,
  trip,
}: UseCreateWorkspaceTaskCommandParams): CreateTaskCommand {
  return useCallback(
    async (input) => {
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
    },
    [
      currentMemberId,
      isApiMode,
      participantSession,
      resolveApiClient,
      selectedTripPlanId,
      setTasks,
      trip,
    ],
  );
}
