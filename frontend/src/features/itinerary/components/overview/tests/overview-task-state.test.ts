import { describe, expect, it } from "vitest";
import type { TripTask } from "@/src/trip/types";

import {
  applyOverviewTaskSubmission,
  buildOverviewTaskSubmission,
  closeOverviewTaskDialog,
  countOverviewOpenTasks,
  initialOverviewNewTaskFormState,
  initialOverviewTaskFilterState,
  initialOverviewTaskUiState,
  openOverviewTaskDialog,
  setOverviewUndoTask,
  updateOverviewNewTaskFormState,
  updateOverviewTaskFilterState,
  updateOverviewTaskUiFilterState,
  updateOverviewTaskUiFormState,
  visibleOverviewTasks,
} from "../overview-task-state";

function task({
  id,
  title,
  ...task
}: Partial<TripTask> & Pick<TripTask, "id" | "title">): TripTask {
  return {
    assigneeId: null,
    createdBy: "member-a",
    id,
    kind: "prep",
    status: "open",
    title,
    visibility: "private",
    ...task,
  };
}

const tasks = [
  task({ id: "mine-open", title: "Pack cable", assigneeId: "member-me" }),
  task({
    id: "shared-done",
    title: "Book ferry",
    assigneeId: "member-me",
    createdBy: "member-other",
    status: "done",
    visibility: "shared",
  }),
  task({
    id: "shared-open",
    title: "Confirm dinner",
    createdBy: "member-other",
    status: "open",
    visibility: "shared",
  }),
  task({
    id: "other-private",
    title: "Bring charger",
    createdBy: "member-other",
    status: "open",
    visibility: "private",
  }),
];

describe("overview task state", () => {
  it("filters visible tasks by scope and status", () => {
    expect(
      visibleOverviewTasks({
        currentMemberId: "member-me",
        filterState: initialOverviewTaskFilterState,
        tasks,
      }).map((item) => item.id),
    ).toEqual(["mine-open", "shared-done"]);

    expect(
      visibleOverviewTasks({
        currentMemberId: "member-me",
        filterState: { scope: "trip", status: "open" },
        tasks,
      }).map((item) => item.id),
    ).toEqual(["shared-open"]);

    expect(
      visibleOverviewTasks({
        currentMemberId: "member-me",
        filterState: { scope: "all", status: "done" },
        tasks,
      }).map((item) => item.id),
    ).toEqual(["shared-done"]);
  });

  it("counts open personal and shared tasks from the same task rules", () => {
    expect(countOverviewOpenTasks(tasks, "member-me")).toEqual({
      myOpenTasks: 1,
      sharedOpenTasks: 1,
    });
  });

  it("updates task filter and form state immutably", () => {
    expect(
      updateOverviewTaskFilterState(
        initialOverviewTaskFilterState,
        "scope",
        "trip",
      ),
    ).toEqual({ scope: "trip", status: "all" });
    expect(
      updateOverviewNewTaskFormState(
        initialOverviewNewTaskFormState,
        "title",
        "Check passport",
      ),
    ).toEqual({
      assigneeId: "",
      title: "Check passport",
      visibility: "private",
    });
  });

  it("updates composed task ui state immutably", () => {
    expect(
      updateOverviewTaskUiFilterState(
        initialOverviewTaskUiState,
        "scope",
        "trip",
      ),
    ).toEqual({
      ...initialOverviewTaskUiState,
      filterState: { scope: "trip", status: "all" },
    });

    expect(
      updateOverviewTaskUiFormState(
        initialOverviewTaskUiState,
        "title",
        "Check passport",
      ),
    ).toEqual({
      ...initialOverviewTaskUiState,
      newTaskFormState: {
        assigneeId: "",
        title: "Check passport",
        visibility: "private",
      },
    });
  });

  it("opens, closes, submits, and tracks undo task from one ui state", () => {
    const openState = openOverviewTaskDialog({
      ...initialOverviewTaskUiState,
      newTaskFormState: {
        assigneeId: "member-nam",
        title: "Confirm ferry",
        visibility: "shared",
      },
    });

    expect(openState.isTaskDialogOpen).toBe(true);
    expect(closeOverviewTaskDialog(openState)).toEqual(
      initialOverviewTaskUiState,
    );

    const submission = buildOverviewTaskSubmission(openState.newTaskFormState);
    expect(submission).not.toBeNull();
    expect(applyOverviewTaskSubmission(openState, submission!)).toEqual({
      ...initialOverviewTaskUiState,
      filterState: { scope: "trip", status: "all" },
    });

    expect(setOverviewUndoTask(initialOverviewTaskUiState, tasks[0])).toEqual({
      ...initialOverviewTaskUiState,
      undoTask: tasks[0],
    });
  });

  it("builds submit payloads and next filters from task visibility", () => {
    expect(
      buildOverviewTaskSubmission({
        assigneeId: "member-nam",
        title: "  Confirm ferry  ",
        visibility: "shared",
      }),
    ).toEqual({
      assigneeId: "member-nam",
      nextFilterState: { scope: "trip", status: "all" },
      title: "Confirm ferry",
      visibility: "shared",
    });
    expect(
      buildOverviewTaskSubmission({
        assigneeId: "",
        title: "Bring umbrella",
        visibility: "private",
      }),
    ).toEqual({
      assigneeId: null,
      nextFilterState: { scope: "mine", status: "all" },
      title: "Bring umbrella",
      visibility: "private",
    });
  });

  it("ignores blank task submissions", () => {
    expect(
      buildOverviewTaskSubmission({
        assigneeId: "member-nam",
        title: "   ",
        visibility: "shared",
      }),
    ).toBeNull();
  });
});
