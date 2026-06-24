import type { TripTask } from "@/src/trip/types";
import { isMyTask } from "@/src/features/itinerary/domain/overview";
import type {
  OverviewNewTaskFormState,
  OverviewTaskFilterState,
  OverviewTaskSubmission,
} from "./overview-task-state";

export function visibleOverviewTasks({
  currentMemberId,
  filterState,
  tasks,
}: {
  currentMemberId: string;
  filterState: OverviewTaskFilterState;
  tasks: TripTask[];
}): TripTask[] {
  return tasks.filter((task) => {
    if (filterState.scope === "mine" && !isMyTask(task, currentMemberId)) {
      return false;
    }
    if (filterState.scope === "trip" && task.visibility !== "shared") {
      return false;
    }
    if (filterState.status === "open") return task.status === "open";
    if (filterState.status === "done") return task.status === "done";
    return true;
  });
}

export function countOverviewOpenTasks(
  tasks: TripTask[],
  currentMemberId: string,
) {
  return {
    myOpenTasks: tasks.filter(
      (task) => task.status === "open" && isMyTask(task, currentMemberId),
    ).length,
    sharedOpenTasks: tasks.filter(
      (task) => task.status === "open" && task.visibility === "shared",
    ).length,
  };
}

export function buildOverviewTaskSubmission(
  formState: OverviewNewTaskFormState,
): OverviewTaskSubmission | null {
  const title = formState.title.trim();
  if (!title) return null;
  return {
    assigneeId: formState.assigneeId || null,
    nextFilterState: {
      scope: formState.visibility === "shared" ? "trip" : "mine",
      status: "all",
    },
    title,
    visibility: formState.visibility,
  };
}
