import type { ExpenseSummary } from "@/src/trip/types";
import {
  expenseSummarySettlementCurrency,
  formatMoney,
} from "@/src/trip/expenses";

export interface ContextRailExpenseTotals {
  groupSpend: string;
  perPerson: string;
}

export function formatContextRailExpenseTotals(
  expenseSummary: ExpenseSummary,
  memberCount: number,
): ContextRailExpenseTotals {
  const payingMemberCount = Math.max(1, memberCount - 1);
  const settlementCurrency = expenseSummarySettlementCurrency(expenseSummary);
  return {
    groupSpend: formatMoney(expenseSummary.groupSpend, settlementCurrency),
    perPerson: formatMoney(
      expenseSummary.groupSpend / payingMemberCount,
      settlementCurrency,
    ),
  };
}
