import { type FormEvent, useMemo, useState } from "react";
import type { TripTask } from "@/src/trip/types";
import { isMyTask } from "@/src/features/itinerary/domain/overview";
import type {
  TaskScopeFilter,
  TaskStatusFilter,
} from "./overview-role-panels.types";

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

interface TaskFilterState {
  scope: TaskScopeFilter;
  status: TaskStatusFilter;
}

interface NewTaskFormState {
  assigneeId: string;
  title: string;
  visibility: TripTask["visibility"];
}

export function useOverviewTaskState({
  currentMemberId,
  onCreateTask,
  onToggleTaskStatus,
  tasks,
}: UseOverviewTaskStateArgs) {
  const [filterState, setFilterState] = useState<TaskFilterState>({
    scope: "mine",
    status: "all",
  });
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTaskFormState, setNewTaskFormState] = useState<NewTaskFormState>({
    assigneeId: "",
    title: "",
    visibility: "private",
  });
  const [undoTask, setUndoTask] = useState<TripTask | null>(null);

  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (filterState.scope === "mine" && !isMyTask(task, currentMemberId)) {
          return false;
        }
        if (filterState.scope === "trip" && task.visibility !== "shared") {
          return false;
        }
        if (filterState.status === "open") return task.status === "open";
        if (filterState.status === "done") return task.status === "done";
        return true;
      }),
    [currentMemberId, filterState.scope, filterState.status, tasks],
  );
  const myOpenTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "open" && isMyTask(task, currentMemberId),
      ).length,
    [currentMemberId, tasks],
  );
  const sharedOpenTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "open" && task.visibility === "shared",
      ).length,
    [tasks],
  );

  function updateFilterState<Field extends keyof TaskFilterState>(
    field: Field,
    value: TaskFilterState[Field],
  ) {
    setFilterState((current) => ({ ...current, [field]: value }));
  }

  function updateNewTaskFormState<Field extends keyof NewTaskFormState>(
    field: Field,
    value: NewTaskFormState[Field],
  ) {
    setNewTaskFormState((current) => ({ ...current, [field]: value }));
  }

  function resetNewTaskForm() {
    setNewTaskFormState({
      assigneeId: "",
      title: "",
      visibility: "private",
    });
  }

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTaskFormState.title.trim();
    if (!title) return;
    onCreateTask({
      title,
      visibility: newTaskFormState.visibility,
      assigneeId: newTaskFormState.assigneeId || null,
    });
    resetNewTaskForm();
    setFilterState({
      scope: newTaskFormState.visibility === "shared" ? "trip" : "mine",
      status: "all",
    });
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
