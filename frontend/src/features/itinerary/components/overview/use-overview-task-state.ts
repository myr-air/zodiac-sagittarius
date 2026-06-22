import { type FormEvent, useMemo, useState } from "react";
import type { TripTask } from "@/src/trip/types";
import type {
  TaskScopeFilter,
  TaskStatusFilter,
} from "./overview-role-panels.types";
import {
  applyOverviewTaskSubmission,
  closeOverviewTaskDialog,
  initialOverviewTaskUiState,
  openOverviewTaskDialog,
  setOverviewUndoTask,
  updateOverviewTaskUiFilterState,
  updateOverviewTaskUiFormState,
} from "./overview-task-state";
import {
  buildOverviewTaskSubmission,
  countOverviewOpenTasks,
  visibleOverviewTasks,
} from "./overview-task-derivation";

interface UseOverviewTaskStateArgs {
  currentMemberId: string;
  onCreateTask: (input: {
    title: string;
    visibility: TripTask["visibility"];
    assigneeId?: string | null;
  }) => void;
  onToggleTaskStatus: (taskId: string) => void;
  tasks: TripTask[];
}

export function useOverviewTaskState({
  currentMemberId,
  onCreateTask,
  onToggleTaskStatus,
  tasks,
}: UseOverviewTaskStateArgs) {
  const [taskState, setTaskState] = useState(initialOverviewTaskUiState);

  const visibleTasks = useMemo(
    () =>
      visibleOverviewTasks({
        currentMemberId,
        filterState: taskState.filterState,
        tasks,
      }),
    [currentMemberId, taskState.filterState, tasks],
  );
  const { myOpenTasks, sharedOpenTasks } = useMemo(
    () => countOverviewOpenTasks(tasks, currentMemberId),
    [currentMemberId, tasks],
  );

  function updateFilterState<Field extends keyof typeof taskState.filterState>(
    field: Field,
    value: (typeof taskState.filterState)[Field],
  ) {
    setTaskState((current) =>
      updateOverviewTaskUiFilterState(current, field, value),
    );
  }

  function updateNewTaskFormState<
    Field extends keyof typeof taskState.newTaskFormState,
  >(field: Field, value: (typeof taskState.newTaskFormState)[Field]) {
    setTaskState((current) =>
      updateOverviewTaskUiFormState(current, field, value),
    );
  }

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

  function closeTaskDialog() {
    setTaskState((current) => closeOverviewTaskDialog(current));
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
    closeTaskDialog,
    isTaskDialogOpen: taskState.isTaskDialogOpen,
    myOpenTasks,
    newTaskAssigneeId: taskState.newTaskFormState.assigneeId,
    newTaskTitle: taskState.newTaskFormState.title,
    newTaskVisibility: taskState.newTaskFormState.visibility,
    openTaskDialog: () =>
      setTaskState((current) => openOverviewTaskDialog(current)),
    setNewTaskAssigneeId: (assigneeId: string) =>
      updateNewTaskFormState("assigneeId", assigneeId),
    setNewTaskTitle: (title: string) => updateNewTaskFormState("title", title),
    setNewTaskVisibility: (visibility: TripTask["visibility"]) =>
      updateNewTaskFormState("visibility", visibility),
    setTaskScope: (scope: TaskScopeFilter) =>
      updateFilterState("scope", scope),
    setTaskStatusFilter: (status: TaskStatusFilter) =>
      updateFilterState("status", status),
    sharedOpenTasks,
    submitTask,
    taskScope: taskState.filterState.scope,
    taskStatusFilter: taskState.filterState.status,
    toggleTask,
    undoTask: taskState.undoTask,
    undoTaskToggle,
    visibleTasks,
  };
}
