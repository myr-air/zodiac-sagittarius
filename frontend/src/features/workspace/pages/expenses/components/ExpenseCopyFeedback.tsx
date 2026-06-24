import {
  WorkspaceCopyFeedback,
  workspaceCopyFeedbackLabel,
  type CopyFeedbackLabels,
} from "@/src/shared/components/copy-feedback";
import * as expenseStyles from "../TripExpensesPage.styles";
import type { ExpenseCopyState, ExpensePageLabels } from "../model/expense-page-types";

function expenseCopyFeedbackLabels(t: ExpensePageLabels): CopyFeedbackLabels {
  return {
    copied: t.common.status.copied,
    error: t.common.status.copyFailed,
    ready: t.expenses.copy.ready,
  };
}

export function expenseCopyFeedbackLabel({
  copyState,
  t,
}: {
  copyState: ExpenseCopyState;
  t: ExpensePageLabels;
}): string {
  return workspaceCopyFeedbackLabel({
    labels: expenseCopyFeedbackLabels(t),
    state: copyState,
  });
}

interface ExpenseCopyFeedbackProps {
  copyState: ExpenseCopyState;
  t: ExpensePageLabels;
}

export function ExpenseCopyFeedback({ copyState, t }: ExpenseCopyFeedbackProps) {
  return (
    <WorkspaceCopyFeedback
      className={expenseStyles.copyFeedbackClassName}
      state={copyState}
      aria-label={t.expenses.copy.statusLabel}
      labels={expenseCopyFeedbackLabels(t)}
    />
  );
}
