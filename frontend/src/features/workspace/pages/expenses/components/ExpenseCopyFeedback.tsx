import {
  CopyFeedback,
  copyFeedbackLabel,
} from "@/src/shared/components/copy-feedback";
import * as expenseStyles from "../TripExpensesPage.styles";
import type { ExpenseCopyState, ExpensePageLabels } from "../model/expense-page-types";

export function expenseCopyFeedbackLabel({
  copyState,
  t,
}: {
  copyState: ExpenseCopyState;
  t: ExpensePageLabels;
}): string {
  return copyFeedbackLabel({
    labels: {
      copied: t.common.status.copied,
      error: t.common.status.copyFailed,
      ready: t.expenses.copy.ready,
    },
    state: copyState,
  });
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
