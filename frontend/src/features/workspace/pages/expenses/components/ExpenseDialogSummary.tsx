import * as expenseStyles from "../TripExpensesPage.styles";
import type { ExpenseDialogCalculatedState } from "../model/expense-dialog-calculation";
import {
  expenseDialogSummaryDisplay,
  type ExpenseDialogSummaryCopy,
} from "../model/expense-dialog-summary-display";

interface ExpenseDialogSummaryProps {
  calculation: ExpenseDialogCalculatedState;
  settlementCurrency: string;
  copy: ExpenseDialogSummaryCopy;
}

export function ExpenseDialogSummary({
  calculation,
  settlementCurrency,
  copy,
}: ExpenseDialogSummaryProps) {
  return (
    <p className={calculation.splitMismatch ? expenseStyles.warningClassName : expenseStyles.balanceMetaClassName}>
      {expenseDialogSummaryDisplay({ calculation, settlementCurrency, copy })}
    </p>
  );
}
