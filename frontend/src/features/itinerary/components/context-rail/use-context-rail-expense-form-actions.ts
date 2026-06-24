import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  buildContextRailExpenseSubmission,
  resetContextRailExpenseFormAfterSubmit,
  type ContextRailExpenseFormState,
} from "./context-rail-expense-form-state";
import type {
  ContextRailCreateExpenseInput,
  ContextRailUpdateExpenseInput,
} from "./context-rail.types";

interface UseContextRailExpenseFormActionsOptions {
  onCreateExpense: (input: ContextRailCreateExpenseInput) => void;
  onUpdateExpense: (input: ContextRailUpdateExpenseInput) => void;
  selectedItemId?: string;
  setState: Dispatch<SetStateAction<ContextRailExpenseFormState>>;
  state: ContextRailExpenseFormState;
}

export function useContextRailExpenseFormActions({
  onCreateExpense,
  onUpdateExpense,
  selectedItemId,
  setState,
  state,
}: UseContextRailExpenseFormActionsOptions) {
  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submission = buildContextRailExpenseSubmission(state);
    if (!submission) return;
    if (submission.expenseId) {
      onUpdateExpense({
        expenseId: submission.expenseId,
        title: submission.title,
        amount: submission.amount,
        paidBy: submission.paidBy,
        category: submission.category,
      });
    } else {
      onCreateExpense({
        itemId: selectedItemId ?? null,
        title: submission.title,
        amount: submission.amount,
        paidBy: submission.paidBy,
        category: submission.category,
      });
    }
    setState((current) => resetContextRailExpenseFormAfterSubmit(current));
  }

  return {
    submitExpense,
  };
}
