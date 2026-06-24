import type { ExpenseSummary } from "../types";
import {
  expenseSummarySettlementCurrency,
} from "./expense-summary";
import { formatMoney } from "./expense-money";

export interface ExpenseSummaryTotals {
  groupSpend: string;
  perPerson: string;
}

export function formatExpenseSummaryTotals(
  expenseSummary: ExpenseSummary,
  memberCount: number,
): ExpenseSummaryTotals {
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
