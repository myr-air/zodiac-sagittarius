import { describe, expect, it } from "vitest";
import { accountTodo } from "../../../fixtures/account-access-panel-api-fixtures";
import {
  accountPortalTodoBadgeTone,
  accountPortalTodoDetail,
  buildAccountPortalTodoListRows,
} from "../account-portal-todo-list-item.model";

describe("account portal todo list item model", () => {
  it("formats todo row detail with the todo kind", () => {
    expect(accountPortalTodoDetail(accountTodo)).toBe(
      "Seoul Spring · shared · booking",
    );
  });

  it("falls back to prep when a todo kind is missing", () => {
    expect(accountPortalTodoDetail({ ...accountTodo, kind: null })).toBe(
      "Seoul Spring · shared · prep",
    );
  });

  it("maps done and open todos to badge tones", () => {
    expect(accountPortalTodoBadgeTone(accountTodo)).toBe("warning");
    expect(accountPortalTodoBadgeTone({ ...accountTodo, status: "done" })).toBe(
      "success",
    );
  });

  it("builds todo list rows from the shared detail and badge rules", () => {
    expect(
      buildAccountPortalTodoListRows([
        accountTodo,
        { ...accountTodo, id: "done-todo", status: "done", kind: null },
      ]),
    ).toEqual([
      {
        badgeLabel: "open",
        badgeTone: "warning",
        detail: "Seoul Spring · shared · booking",
        id: "todo-1",
        title: "Book train",
      },
      {
        badgeLabel: "done",
        badgeTone: "success",
        detail: "Seoul Spring · shared · prep",
        id: "done-todo",
        title: "Book train",
      },
    ]);
  });
});
