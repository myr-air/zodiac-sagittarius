import { describe, expect, it } from "vitest";
import {
  appendTask,
  buildTaskCreateDraft,
  createLocalTask,
  createLocalTaskInList,
  replaceTask,
  toggledTaskStatus,
  toggleLocalTaskStatus,
} from "../../records";
import { task } from "./tasks.test-support";

describe("task local mutations", () => {
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

  it("appends, creates, and replaces tasks in app state lists", () => {
    const tasks = [task({ id: "task-existing", title: "Book hotel" })];
    const draft = buildTaskCreateDraft(
      { title: "Book ferry", visibility: "shared" },
      {
        title: "Book ferry",
        tripPlanId: "plan-main",
        currentMemberId: "member-aom",
      },
    );
    const created = createLocalTaskInList(tasks, draft, {
      nextTaskId: (currentTasks) => `task-local-${currentTasks.length + 1}`,
    });

    expect(created).toEqual([
      expect.objectContaining({ id: "task-existing", title: "Book hotel" }),
      expect.objectContaining({ id: "task-local-2", title: "Book ferry" }),
    ]);
    expect(tasks).toEqual([
      expect.objectContaining({ id: "task-existing", title: "Book hotel" }),
    ]);

    expect(appendTask(tasks, task({ id: "task-manual", title: "Manual task" }))).toEqual([
      expect.objectContaining({ id: "task-existing" }),
      expect.objectContaining({ id: "task-manual", title: "Manual task" }),
    ]);

    expect(
      replaceTask(created, task({ id: "task-existing", title: "Updated hotel" })),
    ).toEqual([
      expect.objectContaining({ id: "task-existing", title: "Updated hotel" }),
      expect.objectContaining({ id: "task-local-2", title: "Book ferry" }),
    ]);
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
