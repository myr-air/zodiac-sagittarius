import {
  convertToSettlementCurrency,
  expenseExchangeRate,
  formatMoney,
  refundAmount,
  roundMoney,
  sumShares,
} from "@/src/trip/expenses";
import { findMemberById } from "@/src/trip/members";
import type { Expense, Member } from "@/src/trip/types";
import {
  displayCurrencyCode,
  formatSettlementAmountForDisplay,
  type ExpenseDisplayCurrencyOptions,
} from "./expense-display-currency";

export interface ExpenseLedgerRowDisplay {
  amountLabel: string;
  canRecordRefund: boolean;
  calculationLabel?: string;
  displayAmountLabel?: string;
  memberBreakdown?: string[];
  settlementAmountLabel?: string;
  sourceLabel?: string;
  splitTotalLabel: string;
}

export interface ExpenseLedgerPayerDisplay {
  color: string;
  name: string;
}

export function expenseLedgerRowDisplay(
  expense: Expense,
  settlementCurrency: string,
  options: Partial<ExpenseDisplayCurrencyOptions> & {
    members?: Member[];
  } = {},
): ExpenseLedgerRowDisplay {
  const currency = expense.currency ?? settlementCurrency;
  const exchangeRate = expenseExchangeRate(expense, settlementCurrency);
  const settlementAmount = convertToSettlementCurrency(
    expense.amount,
    exchangeRate,
  );
  const baseDisplay: ExpenseLedgerRowDisplay = {
    amountLabel: formatMoney(expense.amount, currency),
    canRecordRefund:
      expense.category !== "settlement" && refundAmount(expense) > 0,
    splitTotalLabel: formatMoney(sumShares(expense.splits), currency),
  };
  if (!options.members) return baseDisplay;

  const displayOptions = {
    displayCurrency: options.displayCurrency ?? settlementCurrency,
    displayExchangeRate: options.displayExchangeRate ?? 1,
    settlementCurrency,
  };
  const targetCurrency = displayCurrencyCode(displayOptions);
  const normalizedSettlementCurrency = displayCurrencyCode({
    settlementCurrency,
  });
  const settlementAmountLabel = formatMoney(settlementAmount, settlementCurrency);
  const displayAmountLabel = formatSettlementAmountForDisplay(
    settlementAmount,
    displayOptions,
  );
  const sameSettlementCurrency = currency === normalizedSettlementCurrency;
  const conversionLabel = sameSettlementCurrency
    ? `Paid in ${currency}. No currency conversion needed.`
    : `Paid in ${currency}. Trip amount is ${settlementAmountLabel}.`;
  const displayMath = targetCurrency === normalizedSettlementCurrency
    ? ""
    : ` Shown as ${displayAmountLabel}.`;

  return {
    ...baseDisplay,
    calculationLabel: `${conversionLabel}${displayMath}`,
    displayAmountLabel,
    memberBreakdown: options.members.map((member) => {
      const share = convertToSettlementCurrency(
        expense.splits[member.id] ?? 0,
        exchangeRate,
      );
      const net = roundMoney(
        (expense.paidBy === member.id ? settlementAmount : 0) - share,
      );
      if (net > 0) {
        return `${member.displayName} gets back ${formatMoney(net, settlementCurrency)}`;
      }
      if (net < 0) {
        return `${member.displayName} pays ${formatMoney(Math.abs(net), settlementCurrency)}`;
      }
      return `${member.displayName} is settled`;
    }),
    settlementAmountLabel,
    sourceLabel: expense.lineItems?.length
      ? `Built from receipt items: ${expense.lineItems.map((item) => item.title).join(", ")}`
      : "Split saved by member shares",
  };
}

export function expenseLedgerPayerDisplay({
  members,
  paidBy,
}: {
  members: Member[];
  paidBy: string;
}): ExpenseLedgerPayerDisplay | null {
  const payer = findMemberById(members, paidBy);
  if (!payer) return null;
  return {
    color: payer.color,
    name: payer.displayName,
  };
}
