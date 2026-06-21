import { useState } from "react";
import type { ExpenseSplitMode } from "@/src/trip/expenses";
import type { Expense, Member } from "@/src/trip/types";
import {
  expenseSplitValuesForMode,
  initialExpenseSplitValues,
} from "../model/expense-dialog-initial-state";
import {
  emptyExpenseLineItem,
  initialExpenseLineItems,
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
    if (nextMode === "exact") {
      setSplitValues(expenseSplitValuesForMode(members, "0"));
    } else if (nextMode === "shares") {
      setSplitValues(expenseSplitValuesForMode(members, "1"));
    } else if (nextMode === "percentage") {
      setSplitValues(expenseSplitValuesForMode(members, "0"));
    } else if (nextMode === "itemized" && !lineItems.length) {
      setLineItems([emptyExpenseLineItem(members)]);
    }
  }

  function updateLineItem(index: number, patch: Partial<EditableExpenseLineItem>) {
    setLineItems((current) => current.map((lineItem, candidateIndex) => (candidateIndex === index ? { ...lineItem, ...patch } : lineItem)));
  }

  function toggleLineParticipant(index: number, memberId: string) {
    setLineItems((current) => current.map((lineItem, candidateIndex) => {
      if (candidateIndex !== index) return lineItem;
      const participantIds = lineItem.participantIds.includes(memberId)
        ? lineItem.participantIds.filter((participantId) => participantId !== memberId)
        : [...lineItem.participantIds, memberId];
      return { ...lineItem, participantIds };
    }));
  }

  function addLineItem() {
    setLineItems((current) => [...current, emptyExpenseLineItem(members, current)]);
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
