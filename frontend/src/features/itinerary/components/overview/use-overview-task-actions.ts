import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { TripTask } from "@/src/trip/types";
import { buildOverviewTaskSubmission } from "./overview-task-derivation";
import {
  applyOverviewTaskSubmission,
  setOverviewUndoTask,
  type OverviewTaskUiState,
} from "./overview-task-state";

interface UseOverviewTaskActionsArgs {
  onCreateTask: (input: {
    title: string;
    visibility: TripTask["visibility"];
    assigneeId?: string | null;
  }) => void;
  onToggleTaskStatus: (taskId: string) => void;
  setTaskState: Dispatch<SetStateAction<OverviewTaskUiState>>;
  taskState: OverviewTaskUiState;
}

export function useOverviewTaskActions({
  onCreateTask,
  onToggleTaskStatus,
  setTaskState,
  taskState,
}: UseOverviewTaskActionsArgs) {
  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submission = buildOverviewTaskSubmission(taskState.newTaskFormState);
    if (!submission) return;
    onCreateTask({
      title: submission.title,
      visibility: submission.visibility,
      assigneeId: submission.assigneeId,
    });
    setTaskState((current) => applyOverviewTaskSubmission(current, submission));
  }

  function toggleTask(task: TripTask) {
    onToggleTaskStatus(task.id);
    setTaskState((current) => setOverviewUndoTask(current, task));
  }

  function undoTaskToggle() {
    if (!taskState.undoTask) return;
    onToggleTaskStatus(taskState.undoTask.id);
    setTaskState((current) => setOverviewUndoTask(current, null));
  }

  return {
    submitTask,
    toggleTask,
    undoTaskToggle,
  };
}
