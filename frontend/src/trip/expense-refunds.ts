import type { Expense } from "./types";

export function sumShares(splits: Record<string, number>): number {
  return Math.round(Object.values(splits).reduce((sum, share) => sum + share, 0) * 100) / 100;
}

export function refundSplits(expense: Expense): Record<string, number> {
  return Object.fromEntries(
    Object.entries(expense.splits).filter(
      ([memberId, amount]) => memberId !== expense.paidBy && amount > 0,
    ),
  );
}

export function refundAmount(expense: Expense): number {
  return sumShares(refundSplits(expense));
}
