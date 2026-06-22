import { formatMoney, refundAmount, sumShares } from "@/src/trip/expenses";
import type { Expense } from "@/src/trip/types";

export interface ExpenseLedgerRowDisplay {
  amountLabel: string;
  canRecordRefund: boolean;
  splitTotalLabel: string;
}

export function expenseLedgerRowDisplay(
  expense: Expense,
  settlementCurrency: string,
): ExpenseLedgerRowDisplay {
  const currency = expense.currency ?? settlementCurrency;
  return {
    amountLabel: formatMoney(expense.amount, currency),
    canRecordRefund:
      expense.category !== "settlement" && refundAmount(expense) > 0,
    splitTotalLabel: formatMoney(sumShares(expense.splits), currency),
  };
}
