import { formatMoney, refundAmount, sumShares } from "@/src/trip/expenses";
import { findMemberById, memberInitial } from "@/src/trip/members";
import type { Expense, Member } from "@/src/trip/types";

export interface ExpenseLedgerRowDisplay {
  amountLabel: string;
  canRecordRefund: boolean;
  splitTotalLabel: string;
}

export interface ExpenseLedgerPayerDisplay {
  color: string;
  initial: string;
  name: string;
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

export function expenseLedgerPayerDisplay({
  members,
  paidBy,
}: {
  members: Member[];
  paidBy: string;
}): ExpenseLedgerPayerDisplay | null {
  const payer = findMemberById(members, paidBy);
  if (!payer) return null;
  return {
    color: payer.color,
    initial: memberInitial(payer.displayName),
    name: payer.displayName,
  };
}
