import type { ExpenseDialogCalculatedState } from "./expense-dialog-calculation";

interface ExpenseDialogSubmitGuardInput {
  isSaving: boolean;
  state: ExpenseDialogCalculatedState;
  title: string;
}

export function canSubmitExpenseDialog({ isSaving, state, title }: ExpenseDialogSubmitGuardInput): boolean {
  return (
    !isSaving
    && Boolean(title.trim())
    && !state.amountExpression.error
    && Number.isFinite(state.amountNumber)
    && state.amountNumber > 0
    && !state.splitMismatch
    && state.hasValidExchangeRate
    && !state.invalidItemizedLines
    && state.hasValidRepeatCount
  );
}
