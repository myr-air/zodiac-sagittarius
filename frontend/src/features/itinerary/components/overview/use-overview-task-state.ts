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

export function useOverviewTaskState({
  currentMemberId,
  onCreateTask,
  onToggleTaskStatus,
  tasks,
}: UseOverviewTaskStateArgs) {
  const [taskScope, setTaskScope] = useState<TaskScopeFilter>("mine");
  const [taskStatusFilter, setTaskStatusFilter] =
    useState<TaskStatusFilter>("all");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskVisibility, setNewTaskVisibility] =
    useState<TripTask["visibility"]>("private");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState("");
  const [undoTask, setUndoTask] = useState<TripTask | null>(null);

  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (taskScope === "mine" && !isMyTask(task, currentMemberId)) {
          return false;
        }
        if (taskScope === "trip" && task.visibility !== "shared") {
          return false;
        }
        if (taskStatusFilter === "open") return task.status === "open";
        if (taskStatusFilter === "done") return task.status === "done";
        return true;
      }),
    [currentMemberId, taskScope, taskStatusFilter, tasks],
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

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    onCreateTask({
      title,
      visibility: newTaskVisibility,
      assigneeId: newTaskAssigneeId || null,
    });
    setNewTaskTitle("");
    setNewTaskVisibility("private");
    setNewTaskAssigneeId("");
    setTaskScope(newTaskVisibility === "shared" ? "trip" : "mine");
    setTaskStatusFilter("all");
    setIsTaskDialogOpen(false);
  }

  function closeTaskDialog() {
    setIsTaskDialogOpen(false);
    setNewTaskTitle("");
    setNewTaskVisibility("private");
    setNewTaskAssigneeId("");
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
    newTaskAssigneeId,
    newTaskTitle,
    newTaskVisibility,
    openTaskDialog: () => setIsTaskDialogOpen(true),
    setNewTaskAssigneeId,
    setNewTaskTitle,
    setNewTaskVisibility,
    setTaskScope,
    setTaskStatusFilter,
    sharedOpenTasks,
    submitTask,
    taskScope,
    taskStatusFilter,
    toggleTask,
    undoTask,
    undoTaskToggle,
    visibleTasks,
  };
}
