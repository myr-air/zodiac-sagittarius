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
    <span
      className={expenseStyles.copyFeedbackClassName}
      data-state={copyState}
      role="status"
      aria-label={t.expenses.copy.statusLabel}
    >
      {expenseCopyFeedbackLabel({ copyState, t })}
    </span>
  );
}
