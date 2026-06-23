import { describe, expect, it } from "vitest";
import { accountTodo } from "../../../fixtures/account-access-panel-api-fixtures";
import {
  accountPortalTodoBadgeTone,
  accountPortalTodoDetail,
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
});
