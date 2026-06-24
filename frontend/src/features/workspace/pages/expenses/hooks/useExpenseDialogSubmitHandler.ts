import { useRef, type FormEvent } from "react";
import type { Expense } from "@/src/trip/types";
import type { ExpenseSplitEditorState } from "../model/expense-split-editor";
import type { ExpenseDialogCalculatedState } from "../model/expense-dialog-calculation";
import { submitExpenseDialog } from "../model/expense-dialog-submit-action";
import { buildExpenseDialogSubmitInput } from "../model/expense-dialog-submit-input";
import type { ExpenseDialogInitialFields } from "../model/expense-dialog-initial-state";
import type {
  CreateExpenseHandler,
  ExpenseInput,
  UpdateExpenseHandler,
} from "../model/expense-page-types";

interface UseExpenseDialogSubmitHandlerInput {
  calculatedState: ExpenseDialogCalculatedState;
  canSubmitExpense: boolean;
  comments: ExpenseInput["comments"];
  effectiveTripPlanId: string;
  expense: Expense | null;
  formValues: ExpenseDialogInitialFields;
  onCreateExpense: CreateExpenseHandler;
  onUpdateExpense: UpdateExpenseHandler;
  setSaving: (isSaving: boolean) => void;
  splitEditor: Pick<ExpenseSplitEditorState, "lineItems" | "splitMode">;
}

export function useExpenseDialogSubmitHandler({
  calculatedState,
  canSubmitExpense,
  comments,
  effectiveTripPlanId,
  expense,
  formValues,
  onCreateExpense,
  onUpdateExpense,
  setSaving,
  splitEditor,
}: UseExpenseDialogSubmitHandlerInput) {
  const submittingRef = useRef(false);
  return async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmitExpense || submittingRef.current) return;
    submittingRef.current = true;
    const input = buildExpenseDialogSubmitInput({
      calculatedState,
      category: formValues.category,
      comments,
      effectiveTripPlanId,
      expense,
      itemId: formValues.itemId,
      notes: formValues.notes,
      paidBy: formValues.paidBy,
      receiptUrl: formValues.receiptUrl,
      splitMode: splitEditor.splitMode,
      title: formValues.title,
    });
    try {
      await submitExpenseDialog({
        canSubmitExpense,
        expense,
        input,
        onCreateExpense,
        onUpdateExpense,
        setSaving,
      });
    } finally {
      submittingRef.current = false;
    }
  };
}
