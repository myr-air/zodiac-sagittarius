import { formatMoney } from "@/src/trip/expenses";
import {
  formatSettlementAmountForDisplay,
  type ExpenseDisplayCurrencyOptions,
} from "./expense-display-currency";

export interface ExpenseBalanceCopy {
  owed(input: { name: string; amount: string }): string;
  owes(input: { name: string; amount: string }): string;
  payback(input: { from: string; to: string; amount: string }): string;
  settled(input: { name: string }): string;
}

export interface ExpenseMemberBalanceDisplay {
  amountLabel: string;
  description: string;
  tone: "negative" | "neutral" | "positive";
}

export function expenseMemberBalanceDisplay({
  balanceCopy,
  displayCurrency,
  displayExchangeRate,
  memberName,
  net,
  settlementCurrency,
}: {
  balanceCopy: ExpenseBalanceCopy;
  memberName: string;
  net: number;
  settlementCurrency: string;
} & Partial<Pick<ExpenseDisplayCurrencyOptions, "displayCurrency" | "displayExchangeRate">>): ExpenseMemberBalanceDisplay {
  const amountLabel = displayCurrency
    ? formatSettlementAmountForDisplay(net, {
      displayCurrency,
      displayExchangeRate,
      settlementCurrency,
    })
    : formatMoney(net, settlementCurrency);
  if (net > 0) {
    return {
      amountLabel,
      description: balanceCopy.owed({
        amount: amountLabel,
        name: memberName,
      }),
      tone: "positive",
    };
  }
  if (net < 0) {
    return {
      amountLabel,
      description: balanceCopy.owes({
        amount: displayCurrency
          ? formatSettlementAmountForDisplay(Math.abs(net), {
            displayCurrency,
            displayExchangeRate,
            settlementCurrency,
          })
          : formatMoney(Math.abs(net), settlementCurrency),
        name: memberName,
      }),
      tone: "negative",
    };
  }
  return {
    amountLabel,
    description: balanceCopy.settled({ name: memberName }),
    tone: "neutral",
  };
}
