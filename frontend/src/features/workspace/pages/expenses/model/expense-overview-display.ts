import { formatMoney } from "@/src/trip/expenses";
import type { SettlementSuggestion } from "@/src/trip/types";

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
  memberName,
  net,
  settlementCurrency,
}: {
  balanceCopy: ExpenseBalanceCopy;
  memberName: string;
  net: number;
  settlementCurrency: string;
}): ExpenseMemberBalanceDisplay {
  const amountLabel = formatMoney(net, settlementCurrency);
  if (net > 0) {
    return {
      amountLabel,
      description: balanceCopy.owed({
        amount: formatMoney(net, settlementCurrency),
        name: memberName,
      }),
      tone: "positive",
    };
  }
  if (net < 0) {
    return {
      amountLabel,
      description: balanceCopy.owes({
        amount: formatMoney(Math.abs(net), settlementCurrency),
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

export function settlementSuggestionLabel({
  balanceCopy,
  fromName,
  settlementCurrency,
  suggestion,
  toName,
}: {
  balanceCopy: ExpenseBalanceCopy;
  fromName: string;
  settlementCurrency: string;
  suggestion: Pick<SettlementSuggestion, "amount" | "currency">;
  toName: string;
}): string {
  return balanceCopy.payback({
    amount: formatMoney(
      suggestion.amount,
      suggestion.currency ?? settlementCurrency,
    ),
    from: fromName,
    to: toName,
  });
}
