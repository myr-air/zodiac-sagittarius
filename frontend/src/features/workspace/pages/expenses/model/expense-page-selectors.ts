import { expenseSummarySettlementCurrency } from "@/src/trip/expenses";
import type { ExpenseSummary } from "@/src/trip/types";

export interface CurrentMemberExpenseBalance {
  currentNet: number;
  owedToYou: number;
  youOwe: number;
}

export function expensePageSettlementCurrency(
  expenseSummary: Pick<ExpenseSummary, "settlementCurrency">,
): string {
  return expenseSummarySettlementCurrency(expenseSummary);
}

export function currentMemberExpenseBalance(
  expenseSummary: Pick<ExpenseSummary, "netByMember">,
  currentMemberId: string,
): CurrentMemberExpenseBalance {
  const currentNet = expenseSummary.netByMember[currentMemberId] ?? 0;
  return {
    currentNet,
    owedToYou: Math.max(0, currentNet),
    youOwe: Math.max(0, -currentNet),
  };
}
