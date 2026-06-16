import type { TripTask } from "./types";

export interface TaskCreateInputLike {
  title: string;
  visibility: TripTask["visibility"];
  assigneeId?: string | null;
  relatedItemId?: string | null;
}

export interface TaskCreateDraft {
  title: string;
  status: TripTask["status"];
  visibility: TripTask["visibility"];
  kind: NonNullable<TripTask["kind"]>;
  tripPlanId?: string | null;
  createdBy: string;
  assigneeId?: string | null;
  relatedItemId?: string | null;
}

export function buildTaskCreateDraft(
  input: TaskCreateInputLike,
  options: {
    title: string;
    tripPlanId?: string | null;
    currentMemberId: string;
  },
): TaskCreateDraft {
  return {
    title: options.title,
    status: "open",
    visibility: input.visibility,
    kind: "prep",
    tripPlanId: options.tripPlanId,
    createdBy: options.currentMemberId,
    assigneeId:
      input.visibility === "shared"
        ? input.assigneeId || null
        : options.currentMemberId,
    relatedItemId: input.relatedItemId ?? null,
  };
}

export function createLocalTask(
  tasks: TripTask[],
  draft: TaskCreateDraft,
  options: {
    nextTaskId: (tasks: TripTask[]) => string;
  },
): TripTask {
  return {
    id: options.nextTaskId(tasks),
    title: draft.title,
    status: draft.status,
    visibility: draft.visibility,
    kind: draft.kind,
    tripPlanId: draft.tripPlanId,
    createdBy: draft.createdBy,
    assigneeId: draft.assigneeId,
    relatedItemId: draft.relatedItemId,
  };
}

export function appendTask(tasks: TripTask[], task: TripTask): TripTask[] {
  return [...tasks, task];
}

export function createLocalTaskInList(
  tasks: TripTask[],
  draft: TaskCreateDraft,
  options: {
    nextTaskId: (tasks: TripTask[]) => string;
  },
): TripTask[] {
  return appendTask(tasks, createLocalTask(tasks, draft, options));
}

export function replaceTask(tasks: TripTask[], task: TripTask): TripTask[] {
  return tasks.map((candidate) =>
    candidate.id === task.id ? task : candidate,
  );
}

export function toggledTaskStatus(task: Pick<TripTask, "status">): TripTask["status"] {
  return task.status === "done" ? "open" : "done";
}

export function toggleLocalTaskStatus(tasks: TripTask[], taskId: string): TripTask[] {
  return tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          status: toggledTaskStatus(task),
        }
      : task,
  );
}
