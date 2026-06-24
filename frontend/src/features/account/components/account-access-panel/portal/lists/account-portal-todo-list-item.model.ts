import type { AccountTodoSummary } from "@/src/account/api-client";

export interface AccountPortalTodoListRow {
  badgeLabel: string;
  badgeTone: ReturnType<typeof accountPortalTodoBadgeTone>;
  detail: string;
  id: string;
  title: string;
}

export function accountPortalTodoDetail(todo: AccountTodoSummary): string {
  return `${todo.tripName} · ${todo.visibility} · ${todo.kind ?? "prep"}`;
}

export function accountPortalTodoBadgeTone(
  todo: AccountTodoSummary,
): "success" | "warning" {
  return todo.status === "done" ? "success" : "warning";
}

export function buildAccountPortalTodoListRows(
  todos: readonly AccountTodoSummary[],
): AccountPortalTodoListRow[] {
  return todos.map((todo) => ({
    badgeLabel: todo.status,
    badgeTone: accountPortalTodoBadgeTone(todo),
    detail: accountPortalTodoDetail(todo),
    id: todo.id,
    title: todo.title,
  }));
}
