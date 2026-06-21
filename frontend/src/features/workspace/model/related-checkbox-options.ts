import type { Expense, ItineraryItem, Member, StopNote, TripTask } from "@/src/trip/types";

export interface WorkspaceRelatedOption {
  id: string;
  label: string;
}

type MemberOptionSource = Pick<Member, "id" | "displayName">;
type ItineraryItemOptionSource = Pick<ItineraryItem, "id" | "day" | "activity">;
type TaskOptionSource = Pick<TripTask, "id" | "title">;
type ExpenseOptionSource = Pick<Expense, "id" | "title">;
type StopNoteOptionSource = Pick<StopNote, "id" | "body">;

export function buildMemberOptions(members: MemberOptionSource[]): WorkspaceRelatedOption[] {
  return members.map((member) => ({ id: member.id, label: member.displayName }));
}

export function buildItineraryItemOptions(items: ItineraryItemOptionSource[]): WorkspaceRelatedOption[] {
  return items.map((item) => ({ id: item.id, label: `${item.day} · ${item.activity}` }));
}

export function buildTaskOptions(tasks: TaskOptionSource[]): WorkspaceRelatedOption[] {
  return tasks.map((task) => ({ id: task.id, label: task.title }));
}

export function buildExpenseOptions(expenses: ExpenseOptionSource[]): WorkspaceRelatedOption[] {
  return expenses.map((expense) => ({ id: expense.id, label: expense.title }));
}

export function buildStopNoteOptions(stopNotes: StopNoteOptionSource[]): WorkspaceRelatedOption[] {
  return stopNotes.map((note) => ({ id: note.id, label: note.body }));
}
