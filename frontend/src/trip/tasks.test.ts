import { describe, expect, it } from "vitest";
import {
  buildTaskCreateDraft,
  createLocalTask,
  toggledTaskStatus,
  toggleLocalTaskStatus,
} from "./tasks";
import type { TripTask } from "./types";

describe("task helpers", () => {
  it("builds shared task drafts with optional assignees", () => {
    expect(
      buildTaskCreateDraft(
        {
          title: "  Book tram tickets  ",
          visibility: "shared",
          assigneeId: "member-beam",
          relatedItemId: "item-peak",
        },
        {
          title: "Book tram tickets",
          tripPlanId: "plan-main",
          currentMemberId: "member-aom",
        },
      ),
    ).toEqual({
      title: "Book tram tickets",
      status: "open",
      visibility: "shared",
      kind: "prep",
      tripPlanId: "plan-main",
      createdBy: "member-aom",
      assigneeId: "member-beam",
      relatedItemId: "item-peak",
    });
  });

  it("assigns private task drafts to the current member", () => {
    expect(
      buildTaskCreateDraft(
        {
          title: "Passport scan",
          visibility: "private",
          assigneeId: "member-beam",
        },
        {
          title: "Passport scan",
          currentMemberId: "member-aom",
        },
      ),
    ).toMatchObject({
      visibility: "private",
      assigneeId: "member-aom",
      relatedItemId: null,
    });
  });

  it("creates local tasks from drafts using app-provided ids", () => {
    const draft = buildTaskCreateDraft(
      { title: "Book hotel", visibility: "shared" },
      {
        title: "Book hotel",
        tripPlanId: "plan-main",
        currentMemberId: "member-aom",
      },
    );

    expect(
      createLocalTask([task({ id: "task-existing" })], draft, {
        nextTaskId: (tasks) => `task-local-${tasks.length + 1}`,
      }),
    ).toEqual({
      id: "task-local-2",
      title: "Book hotel",
      status: "open",
      visibility: "shared",
      kind: "prep",
      tripPlanId: "plan-main",
      createdBy: "member-aom",
      assigneeId: null,
      relatedItemId: null,
    });
  });

  it("toggles task status for one local task", () => {
    const tasks = [
      task({ id: "task-open", status: "open" }),
      task({ id: "task-done", status: "done" }),
    ];

    expect(toggledTaskStatus({ status: "open" })).toBe("done");
    expect(toggledTaskStatus({ status: "done" })).toBe("open");
    expect(toggleLocalTaskStatus(tasks, "task-open")).toEqual([
      expect.objectContaining({ id: "task-open", status: "done" }),
      expect.objectContaining({ id: "task-done", status: "done" }),
    ]);
  });
});

function task(input: Partial<TripTask> & Pick<TripTask, "id">): TripTask {
  return {
    title: "Task",
    status: "open",
    visibility: "shared",
    kind: "prep",
    createdBy: "member-aom",
    ...input,
  };
}
