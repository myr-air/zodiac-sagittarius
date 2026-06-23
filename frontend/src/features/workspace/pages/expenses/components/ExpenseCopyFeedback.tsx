import { CopyFeedback } from "@/src/shared/components/copy-feedback";
import * as expenseStyles from "../TripExpensesPage.styles";
import type { ExpenseCopyState, ExpensePageLabels } from "../model/expense-page-types";

export function expenseCopyFeedbackLabel({
  copyState,
  t,
}: {
  copyState: ExpenseCopyState;
  t: ExpensePageLabels;
}): string {
  if (copyState === "copied") return t.common.status.copied;
  if (copyState === "error") return t.common.status.copyFailed;
  return t.expenses.copy.ready;
}

interface ExpenseCopyFeedbackProps {
  copyState: ExpenseCopyState;
  t: ExpensePageLabels;
}

export function ExpenseCopyFeedback({ copyState, t }: ExpenseCopyFeedbackProps) {
  return (
    <CopyFeedback
      className={expenseStyles.copyFeedbackClassName}
      state={copyState}
      aria-label={t.expenses.copy.statusLabel}
      label={expenseCopyFeedbackLabel({ copyState, t })}
    />
  );
}
