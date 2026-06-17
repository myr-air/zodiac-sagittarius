import { formatMoney } from "@/src/trip/expenses";
import * as expenseStyles from "../TripExpensesPage.styles";

interface ExpenseDialogSummaryProps {
  amount: number;
  currency: string;
  exchangeRate: number;
  hasValidExchangeRate: boolean;
  invalidItemizedLines: boolean;
  needsExchangeRate: boolean;
  settlementCurrency: string;
  splitMismatch: boolean;
  splitTotal: number;
  copy: {
    exchangeRateRequired: string;
    itemizedRequired: string;
    mismatch: string;
    settleValue: (input: { amount: string }) => string;
    splitTotal: (input: { amount: string; total: string }) => string;
  };
}

export function ExpenseDialogSummary({
  amount,
  currency,
  exchangeRate,
  hasValidExchangeRate,
  invalidItemizedLines,
  needsExchangeRate,
  settlementCurrency,
  splitMismatch,
  splitTotal,
  copy,
}: ExpenseDialogSummaryProps) {
  return (
    <p className={splitMismatch ? expenseStyles.warningClassName : expenseStyles.balanceMetaClassName}>
      {copy.splitTotal({ total: formatMoney(splitTotal, currency), amount: formatMoney(Number.isFinite(amount) ? amount : 0, currency) })}
      {splitMismatch ? ` ${copy.mismatch}` : ""}
      {invalidItemizedLines ? ` ${copy.itemizedRequired}` : ""}
      {needsExchangeRate && hasValidExchangeRate ? ` ${copy.settleValue({ amount: formatMoney(amount * exchangeRate, settlementCurrency) })}` : ""}
      {needsExchangeRate && !hasValidExchangeRate ? ` ${copy.exchangeRateRequired}` : ""}
    </p>
  );
}
