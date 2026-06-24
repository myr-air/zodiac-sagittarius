import { useState } from "react";
import type { ExpenseSplitMode } from "@/src/trip/expenses";
import type { Expense, Member } from "@/src/trip/types";
import {
  appendExpenseSplitEditorLineItem,
  changeExpenseSplitEditorMode,
  initialExpenseSplitEditorState,
  toggleExpenseSplitEditorLineParticipant,
  updateExpenseSplitEditorLineItem,
  updateExpenseSplitEditorValue,
  type EditableExpenseLineItem,
} from "../model/expense-split-editor";

interface UseExpenseSplitEditorInput {
  expense: Expense | null;
  initialSplitMode?: ExpenseSplitMode;
  members: Member[];
}

export function useExpenseSplitEditor({
  expense,
  initialSplitMode,
  members,
}: UseExpenseSplitEditorInput) {
  const [state, setState] = useState(() =>
    initialExpenseSplitEditorState({ expense, initialSplitMode, members }),
  );

  function changeSplitMode(nextMode: ExpenseSplitMode) {
    setState((current) =>
      changeExpenseSplitEditorMode({
        members,
        nextMode,
        state: current,
      }),
    );
  }

  function updateLineItem(
    index: number,
    patch: Partial<EditableExpenseLineItem>,
  ) {
    setState((current) =>
      updateExpenseSplitEditorLineItem(current, index, patch),
    );
  }

  function toggleLineParticipant(index: number, memberId: string) {
    setState((current) =>
      toggleExpenseSplitEditorLineParticipant(current, index, memberId),
    );
  }

  function addLineItem() {
    setState((current) => appendExpenseSplitEditorLineItem(current, members));
  }

  function updateSplitValue(memberId: string, value: string) {
    setState((current) =>
      updateExpenseSplitEditorValue(current, memberId, value),
    );
  }

  return {
    addLineItem,
    changeSplitMode,
    lineItems: state.lineItems,
    splitMode: state.splitMode,
    splitValues: state.splitValues,
    toggleLineParticipant,
    updateLineItem,
    updateSplitValue,
  };
}
