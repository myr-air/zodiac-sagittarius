import { formatMoney } from "@/src/trip/expenses";
import type { ExpenseDialogCalculatedState } from "./expense-dialog-calculation";

export interface ExpenseDialogSummaryCopy {
  exchangeRateRequired: string;
  itemizedRequired: string;
  mismatch: string;
  settleValue: (input: { amount: string }) => string;
  splitTotal: (input: { amount: string; total: string }) => string;
}

interface ExpenseDialogSummaryDisplayInput {
  calculation: ExpenseDialogCalculatedState;
  settlementCurrency: string;
  copy: ExpenseDialogSummaryCopy;
}

export function expenseDialogSummaryDisplay({
  calculation,
  settlementCurrency,
  copy,
}: ExpenseDialogSummaryDisplayInput): string {
  const amount = Number.isFinite(calculation.amountNumber) ? calculation.amountNumber : 0;
  const summary = copy.splitTotal({
    total: formatMoney(calculation.splitTotal, calculation.normalizedCurrency),
    amount: formatMoney(amount, calculation.normalizedCurrency),
  });
  const messages = [
    calculation.splitMismatch ? copy.mismatch : "",
    calculation.invalidItemizedLines ? copy.itemizedRequired : "",
    calculation.needsExchangeRate && calculation.hasValidExchangeRate
      ? copy.settleValue({
        amount: formatMoney(calculation.amountNumber * calculation.exchangeRateNumber, settlementCurrency),
      })
      : "",
    calculation.needsExchangeRate && !calculation.hasValidExchangeRate ? copy.exchangeRateRequired : "",
  ].filter(Boolean);

  return [summary, ...messages].join(" ");
}
