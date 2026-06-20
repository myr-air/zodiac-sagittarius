import { formatMoney } from "@/src/trip/expenses";
import * as expenseStyles from "../TripExpensesPage.styles";
import type { ExpenseDialogCalculatedState } from "../expense-dialog-calculation";

interface ExpenseDialogSummaryProps {
  calculation: ExpenseDialogCalculatedState;
  settlementCurrency: string;
  copy: {
    exchangeRateRequired: string;
    itemizedRequired: string;
    mismatch: string;
    settleValue: (input: { amount: string }) => string;
    splitTotal: (input: { amount: string; total: string }) => string;
  };
}

export function ExpenseDialogSummary({
  calculation,
  settlementCurrency,
  copy,
}: ExpenseDialogSummaryProps) {
  return (
    <p className={calculation.splitMismatch ? expenseStyles.warningClassName : expenseStyles.balanceMetaClassName}>
      {copy.splitTotal({
        total: formatMoney(calculation.splitTotal, calculation.normalizedCurrency),
        amount: formatMoney(Number.isFinite(calculation.amountNumber) ? calculation.amountNumber : 0, calculation.normalizedCurrency),
      })}
      {calculation.splitMismatch ? ` ${copy.mismatch}` : ""}
      {calculation.invalidItemizedLines ? ` ${copy.itemizedRequired}` : ""}
      {calculation.needsExchangeRate && calculation.hasValidExchangeRate ? ` ${copy.settleValue({ amount: formatMoney(calculation.amountNumber * calculation.exchangeRateNumber, settlementCurrency) })}` : ""}
      {calculation.needsExchangeRate && !calculation.hasValidExchangeRate ? ` ${copy.exchangeRateRequired}` : ""}
    </p>
  );
}
