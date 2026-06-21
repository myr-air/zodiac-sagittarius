import { describe, expect, it } from "vitest";
import {
  buildCreateTaskRequest,
  buildTaskCreateDraft,
  buildToggleTaskStatusRequest,
} from "../../tasks";
import { task } from "./tasks.test-support";

describe("task API requests", () => {
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
