import type { ExpenseSplitMode } from "@/src/trip/expenses";
import type { Expense, Member } from "@/src/trip/types";
import { initialExpenseSplitValues } from "./expense-dialog-initial-state";
import {
  appendEmptyExpenseLineItem,
  expenseSplitModeTransitionFields,
  initialExpenseLineItems,
  toggleExpenseLineParticipant,
  updateEditableExpenseLineItem,
  type EditableExpenseLineItem,
} from "./expense-dialog-line-items";

export type { EditableExpenseLineItem } from "./expense-dialog-line-items";

export interface ExpenseSplitEditorState {
  lineItems: EditableExpenseLineItem[];
  splitMode: ExpenseSplitMode;
  splitValues: Record<string, string>;
}

export function initialExpenseSplitEditorState({
  expense,
  initialSplitMode,
  members,
}: {
  expense: Expense | null;
  initialSplitMode?: ExpenseSplitMode;
  members: Member[];
}): ExpenseSplitEditorState {
  return {
    lineItems: initialExpenseLineItems(expense, members),
    splitMode: expense?.lineItems?.length
      ? "itemized"
      : expense
        ? "exact"
        : initialSplitMode ?? "equal",
    splitValues: initialExpenseSplitValues(members, expense),
  };
}

export function changeExpenseSplitEditorMode({
  members,
  nextMode,
  state,
}: {
  members: Member[];
  nextMode: ExpenseSplitMode;
  state: ExpenseSplitEditorState;
}): ExpenseSplitEditorState {
  return {
    ...state,
    ...expenseSplitModeTransitionFields({
      lineItems: state.lineItems,
      members,
      nextMode,
    }),
    splitMode: nextMode,
  };
}

export function updateExpenseSplitEditorLineItem(
  state: ExpenseSplitEditorState,
  index: number,
  patch: Partial<EditableExpenseLineItem>,
): ExpenseSplitEditorState {
  return {
    ...state,
    lineItems: updateEditableExpenseLineItem(state.lineItems, index, patch),
  };
}

export function toggleExpenseSplitEditorLineParticipant(
  state: ExpenseSplitEditorState,
  index: number,
  memberId: string,
): ExpenseSplitEditorState {
  return {
    ...state,
    lineItems: toggleExpenseLineParticipant(state.lineItems, index, memberId),
  };
}

export function appendExpenseSplitEditorLineItem(
  state: ExpenseSplitEditorState,
  members: Member[],
): ExpenseSplitEditorState {
  return {
    ...state,
    lineItems: appendEmptyExpenseLineItem(state.lineItems, members),
  };
}

export function updateExpenseSplitEditorValue(
  state: ExpenseSplitEditorState,
  memberId: string,
  value: string,
): ExpenseSplitEditorState {
  return {
    ...state,
    splitValues: {
      ...state.splitValues,
      [memberId]: value,
    },
  };
}
