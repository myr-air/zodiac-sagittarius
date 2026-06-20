import type { ExpenseSummary } from "@/src/trip/types";

export interface ContextRailExpenseTotals {
  groupSpend: string;
  perPerson: string;
}

export function formatContextRailExpenseTotals(
  expenseSummary: ExpenseSummary,
  memberCount: number,
): ContextRailExpenseTotals {
  const payingMemberCount = Math.max(1, memberCount - 1);
  return {
    groupSpend: expenseSummary.groupSpend.toLocaleString("en-HK"),
    perPerson: Math.round(
      expenseSummary.groupSpend / payingMemberCount,
    ).toLocaleString("en-HK"),
  };
}
