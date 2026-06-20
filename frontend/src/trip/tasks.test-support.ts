import type { TripTask } from "./types";

export function task(input: Partial<TripTask> & Pick<TripTask, "id">): TripTask {
  return {
    title: "Task",
    status: "open",
    visibility: "shared",
    kind: "prep",
    createdBy: "member-aom",
    ...input,
  };
}
