import { describe, expect, it } from "vitest";
import {
  appendTask,
  buildCreateTaskRequest,
  buildTaskCreateDraft,
  buildToggleTaskStatusRequest,
  createLocalTask,
  createLocalTaskInList,
  replaceTask,
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

  it("builds API create task requests from task drafts", () => {
    const draft = buildTaskCreateDraft(
      {
        title: "Book hotel",
        visibility: "shared",
        assigneeId: "member-beam",
        relatedItemId: "item-hotel",
      },
      {
        title: "Book hotel",
        tripPlanId: "plan-main",
        currentMemberId: "member-aom",
      },
    );

    expect(
      buildCreateTaskRequest(draft, {
        clientMutationId: "mutation-task-create",
      }),
    ).toEqual({
      clientMutationId: "mutation-task-create",
      title: "Book hotel",
      visibility: "shared",
      kind: "prep",
      tripPlanId: "plan-main",
      assigneeId: "member-beam",
      relatedItemId: "item-hotel",
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

  it("builds API patch requests for toggled task status", () => {
    expect(
      buildToggleTaskStatusRequest(
        task({ id: "task-open", status: "open", version: 7 }),
        { clientMutationId: "mutation-task-patch" },
      ),
    ).toEqual({
      clientMutationId: "mutation-task-patch",
      expectedVersion: 7,
      patch: { status: "done" },
    });

    expect(
      buildToggleTaskStatusRequest(
        task({ id: "task-unversioned", status: "done" }),
        { clientMutationId: "mutation-task-patch-fallback" },
      ),
    ).toEqual({
      clientMutationId: "mutation-task-patch-fallback",
      expectedVersion: 1,
      patch: { status: "open" },
    });
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
