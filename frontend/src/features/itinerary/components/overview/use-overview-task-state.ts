import { type FormEvent, useMemo, useState } from "react";
import type { TripTask } from "@/src/trip/types";
import type {
  TaskScopeFilter,
  TaskStatusFilter,
} from "./overview-role-panels.types";
import {
  buildOverviewTaskSubmission,
  countOverviewOpenTasks,
  initialOverviewNewTaskFormState,
  initialOverviewTaskFilterState,
  updateOverviewNewTaskFormState,
  updateOverviewTaskFilterState,
  visibleOverviewTasks,
} from "./overview-task-state";

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
  const [filterState, setFilterState] = useState(
    initialOverviewTaskFilterState,
  );
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTaskFormState, setNewTaskFormState] = useState(
    initialOverviewNewTaskFormState,
  );
  const [undoTask, setUndoTask] = useState<TripTask | null>(null);

  const visibleTasks = useMemo(
    () => visibleOverviewTasks({ currentMemberId, filterState, tasks }),
    [currentMemberId, filterState, tasks],
  );
  const { myOpenTasks, sharedOpenTasks } = useMemo(
    () => countOverviewOpenTasks(tasks, currentMemberId),
    [currentMemberId, tasks],
  );

  function updateFilterState<Field extends keyof typeof filterState>(
    field: Field,
    value: (typeof filterState)[Field],
  ) {
    setFilterState((current) =>
      updateOverviewTaskFilterState(current, field, value),
    );
  }

  function updateNewTaskFormState<
    Field extends keyof typeof newTaskFormState,
  >(field: Field, value: (typeof newTaskFormState)[Field]) {
    setNewTaskFormState((current) =>
      updateOverviewNewTaskFormState(current, field, value),
    );
  }

  function resetNewTaskForm() {
    setNewTaskFormState(initialOverviewNewTaskFormState);
  }

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submission = buildOverviewTaskSubmission(newTaskFormState);
    if (!submission) return;
    onCreateTask({
      title: submission.title,
      visibility: submission.visibility,
      assigneeId: submission.assigneeId,
    });
    resetNewTaskForm();
    setFilterState(submission.nextFilterState);
    setIsTaskDialogOpen(false);
  }

  function closeTaskDialog() {
    setIsTaskDialogOpen(false);
    resetNewTaskForm();
  }

  function toggleTask(task: TripTask) {
    onToggleTaskStatus(task.id);
    setUndoTask(task);
  }

  function undoTaskToggle() {
    if (!undoTask) return;
    onToggleTaskStatus(undoTask.id);
    setUndoTask(null);
  }

  return {
    closeTaskDialog,
    isTaskDialogOpen,
    myOpenTasks,
    newTaskAssigneeId: newTaskFormState.assigneeId,
    newTaskTitle: newTaskFormState.title,
    newTaskVisibility: newTaskFormState.visibility,
    openTaskDialog: () => setIsTaskDialogOpen(true),
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
    taskScope: filterState.scope,
    taskStatusFilter: filterState.status,
    toggleTask,
    undoTask,
    undoTaskToggle,
    visibleTasks,
  };
}
