import { formatMoney } from "@/src/trip/expenses";
import type { ExpenseSummary } from "@/src/trip/types";

export type ExpenseSummaryTone = "negative" | "neutral" | "positive";

export interface ExpenseSummaryDisplay {
  groupSpendLabel: string;
  owedToYouLabel: string;
  currentNetTone: ExpenseSummaryTone;
  youOweLabel: string;
}

export function expenseSummaryDisplay({
  currentNet,
  expenseSummary,
  owedToYou,
  settlementCurrency,
  youOwe,
}: {
  currentNet: number;
  expenseSummary: Pick<ExpenseSummary, "groupSpend">;
  owedToYou: number;
  settlementCurrency: string;
  youOwe: number;
}): ExpenseSummaryDisplay {
  return {
    currentNetTone:
      currentNet < 0 ? "negative" : currentNet > 0 ? "positive" : "neutral",
    groupSpendLabel: formatMoney(expenseSummary.groupSpend, settlementCurrency),
    owedToYouLabel: formatMoney(owedToYou, settlementCurrency),
    youOweLabel: formatMoney(youOwe, settlementCurrency),
  };
}
