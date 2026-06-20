import type { ExpenseSummary } from "@/src/trip/types";
import { formatMoney } from "@/src/trip/expense-money";

export interface ContextRailExpenseTotals {
  groupSpend: string;
  perPerson: string;
}

export function formatContextRailExpenseTotals(
  expenseSummary: ExpenseSummary,
  memberCount: number,
): ContextRailExpenseTotals {
  const payingMemberCount = Math.max(1, memberCount - 1);
  const settlementCurrency = expenseSummary.settlementCurrency ?? "HKD";
  return {
    groupSpend: formatMoney(expenseSummary.groupSpend, settlementCurrency),
    perPerson: formatMoney(
      expenseSummary.groupSpend / payingMemberCount,
      settlementCurrency,
    ),
  };
}
