import type { AccountTodoSummary } from "@/src/account/api-client";

export function accountPortalTodoDetail(todo: AccountTodoSummary): string {
  return `${todo.tripName} · ${todo.visibility} · ${todo.kind ?? "prep"}`;
}

export function accountPortalTodoBadgeTone(
  todo: AccountTodoSummary,
): "success" | "warning" {
  return todo.status === "done" ? "success" : "warning";
}
