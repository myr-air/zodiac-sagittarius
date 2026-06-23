import { useMemo, useState } from "react";
import type { TripTask } from "@/src/trip/types";
import type {
  TaskScopeFilter,
  TaskStatusFilter,
} from "./overview-role-panels.types";
import {
  closeOverviewTaskDialog,
  initialOverviewTaskUiState,
  openOverviewTaskDialog,
  updateOverviewTaskUiFilterState,
  updateOverviewTaskUiFormState,
} from "./overview-task-state";
import {
  countOverviewOpenTasks,
  visibleOverviewTasks,
} from "./overview-task-derivation";
import { useOverviewTaskActions } from "./use-overview-task-actions";

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

  const { submitTask, toggleTask, undoTaskToggle } = useOverviewTaskActions({
    onCreateTask,
    onToggleTaskStatus,
    setTaskState,
    taskState,
  });

  function closeTaskDialog() {
    setTaskState((current) => closeOverviewTaskDialog(current));
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
