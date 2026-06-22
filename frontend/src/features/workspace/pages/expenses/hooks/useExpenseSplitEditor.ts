import { useState } from "react";
import type { ExpenseSplitMode } from "@/src/trip/expenses";
import type { Expense, Member } from "@/src/trip/types";
import {
  initialExpenseSplitValues,
} from "../model/expense-dialog-initial-state";
import {
  appendEmptyExpenseLineItem,
  expenseSplitModeTransitionFields,
  initialExpenseLineItems,
  toggleExpenseLineParticipant,
  updateEditableExpenseLineItem,
  type EditableExpenseLineItem,
} from "../model/expense-dialog-line-items";

interface UseExpenseSplitEditorInput {
  expense: Expense | null;
  members: Member[];
}

export function useExpenseSplitEditor({ expense, members }: UseExpenseSplitEditorInput) {
  const [splitMode, setSplitMode] = useState<ExpenseSplitMode>(expense?.lineItems?.length ? "itemized" : expense ? "exact" : "equal");
  const [splitValues, setSplitValues] = useState<Record<string, string>>(initialExpenseSplitValues(members, expense));
  const [lineItems, setLineItems] = useState<EditableExpenseLineItem[]>(initialExpenseLineItems(expense, members));

  function changeSplitMode(nextMode: ExpenseSplitMode) {
    setSplitMode(nextMode);
    const nextFields = expenseSplitModeTransitionFields({
      lineItems,
      members,
      nextMode,
    });
    if (nextFields.splitValues) setSplitValues(nextFields.splitValues);
    if (nextFields.lineItems) setLineItems(nextFields.lineItems);
  }

  function updateLineItem(index: number, patch: Partial<EditableExpenseLineItem>) {
    setLineItems((current) => updateEditableExpenseLineItem(current, index, patch));
  }

  function toggleLineParticipant(index: number, memberId: string) {
    setLineItems((current) => toggleExpenseLineParticipant(current, index, memberId));
  }

  function addLineItem() {
    setLineItems((current) => appendEmptyExpenseLineItem(current, members));
  }

  function updateSplitValue(memberId: string, value: string) {
    setSplitValues((current) => ({ ...current, [memberId]: value }));
  }

  return {
    addLineItem,
    changeSplitMode,
    lineItems,
    splitMode,
    splitValues,
    toggleLineParticipant,
    updateLineItem,
    updateSplitValue,
  };
}
