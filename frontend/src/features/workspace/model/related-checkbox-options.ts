import {
  buildSelectOptionsFromItems,
  type SelectOption,
} from "@/src/shared/select-options";
import type { Expense, ItineraryItem, Member, StopNote, TripTask } from "@/src/trip/types";

export interface WorkspaceRelatedOption {
  id: string;
  label: string;
}

export type WorkspaceRelatedSelectOption = SelectOption;

interface WorkspaceRelatedSelectOptionsConfig {
  leadingOption?: WorkspaceRelatedSelectOption;
}

type MemberOptionSource = Pick<Member, "id" | "displayName">;
type ItineraryItemOptionSource = Pick<ItineraryItem, "id" | "day" | "activity">;
type TaskOptionSource = Pick<TripTask, "id" | "title">;
type ExpenseOptionSource = Pick<Expense, "id" | "title">;
type StopNoteOptionSource = Pick<StopNote, "id" | "body">;

export function buildMemberOptions(members: MemberOptionSource[]): WorkspaceRelatedOption[] {
  return members.map((member) => ({ id: member.id, label: member.displayName }));
}

function buildWorkspaceRelatedSelectOptions(
  options: WorkspaceRelatedOption[],
  config: WorkspaceRelatedSelectOptionsConfig = {},
): WorkspaceRelatedSelectOption[] {
  const selectOptions = buildSelectOptionsFromItems(
    options,
    (option) => option.id,
    (option) => option.label,
  );
  return config.leadingOption
    ? [config.leadingOption, ...selectOptions]
    : selectOptions;
}

export function buildMemberSelectOptions(
  members: MemberOptionSource[],
  config?: WorkspaceRelatedSelectOptionsConfig,
): WorkspaceRelatedSelectOption[] {
  return buildWorkspaceRelatedSelectOptions(buildMemberOptions(members), config);
}

export function buildItineraryItemOptions(items: ItineraryItemOptionSource[]): WorkspaceRelatedOption[] {
  return items.map((item) => ({ id: item.id, label: `${item.day} · ${item.activity}` }));
}

export function buildItineraryItemSelectOptions(
  items: ItineraryItemOptionSource[],
  config?: WorkspaceRelatedSelectOptionsConfig,
): WorkspaceRelatedSelectOption[] {
  return buildWorkspaceRelatedSelectOptions(
    buildItineraryItemOptions(items),
    config,
  );
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
