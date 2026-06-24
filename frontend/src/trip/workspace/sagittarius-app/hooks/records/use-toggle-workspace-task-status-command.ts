import { useCallback } from "react";
import { nextClientMutationId } from "@/src/trip/identity";
import {
  buildToggleTaskStatusRequest,
  findTaskById,
  replaceTask,
  toggleLocalTaskStatus,
} from "@/src/trip/records";
import type {
  ToggleTaskStatusCommand,
  UseToggleWorkspaceTaskStatusCommandParams,
} from "./workspace-task-command-types";

export function useToggleWorkspaceTaskStatusCommand({
  isApiMode,
  participantSession,
  resolveApiClient,
  setTasks,
  tasks,
  trip,
}: UseToggleWorkspaceTaskStatusCommandParams): ToggleTaskStatusCommand {
  return useCallback(
    async (taskId) => {
      if (isApiMode && resolveApiClient && participantSession) {
        const task = findTaskById(tasks, taskId);
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
    },
    [
      isApiMode,
      participantSession,
      resolveApiClient,
      setTasks,
      tasks,
      trip.id,
    ],
  );
}
