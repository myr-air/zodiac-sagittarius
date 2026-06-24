import { formatMoney } from "@/src/trip/expenses";
import type { ExpenseSummary } from "@/src/trip/types";
import {
  formatSettlementAmountForDisplay,
  type ExpenseDisplayCurrencyOptions,
} from "./expense-display-currency";

export type ExpenseSummaryTone = "negative" | "neutral" | "positive";

export interface ExpenseSummaryDisplay {
  currentNetLabel: string;
  groupSpendLabel: string;
  owedToYouLabel: string;
  currentNetTone: ExpenseSummaryTone;
  youOweLabel: string;
}

export function expenseSummaryDisplay({
  currentNet,
  displayCurrency,
  displayExchangeRate,
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
} & Partial<Pick<ExpenseDisplayCurrencyOptions, "displayCurrency" | "displayExchangeRate">>): ExpenseSummaryDisplay {
  const money = (amount: number) => displayCurrency
    ? formatSettlementAmountForDisplay(amount, {
      displayCurrency,
      displayExchangeRate,
      settlementCurrency,
    })
    : formatMoney(amount, settlementCurrency);
  return {
    currentNetTone:
      currentNet < 0 ? "negative" : currentNet > 0 ? "positive" : "neutral",
    currentNetLabel:
      currentNet > 0
        ? `+${money(currentNet)}`
        : currentNet < 0
          ? `-${money(Math.abs(currentNet))}`
          : money(0),
    groupSpendLabel: money(expenseSummary.groupSpend),
    owedToYouLabel: money(owedToYou),
    youOweLabel: money(youOwe),
  };
}
