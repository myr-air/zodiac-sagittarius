import type { DisplayDateTimeLocale } from "@/src/shared/date-time-display";
import { displayNameOrFallback } from "@/src/shared/text-parts";
import { formatMoney, formatReminderDate } from "@/src/trip/expenses";
import { findMemberById } from "@/src/trip/members";
import type { Member, SettlementSuggestion } from "@/src/trip/types";
import type { ExpenseBalanceCopy } from "./expense-overview-balance-display";
import {
  formatSettlementAmountForDisplay,
  type ExpenseDisplayCurrencyOptions,
} from "./expense-display-currency";

export interface ExpenseReminderCopy {
  lastSent(input: { date: string }): string;
}

export interface SettlementSuggestionDisplay {
  label: string;
  lastReminderLabel: string | null;
}

export function settlementSuggestionLabel({
  balanceCopy,
  displayCurrency,
  displayExchangeRate,
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
} & Partial<Pick<ExpenseDisplayCurrencyOptions, "displayCurrency" | "displayExchangeRate">>): string {
  return balanceCopy.payback({
    amount: displayCurrency
      ? formatSettlementAmountForDisplay(suggestion.amount, {
        displayCurrency,
        displayExchangeRate,
        settlementCurrency,
      })
      : formatMoney(
        suggestion.amount,
        suggestion.currency ?? settlementCurrency,
      ),
    from: fromName,
    to: toName,
  });
}

export function settlementSuggestionDisplay({
  balanceCopy,
  displayCurrency,
  displayExchangeRate,
  locale,
  members,
  reminderCopy,
  settlementCurrency,
  suggestion,
}: {
  balanceCopy: ExpenseBalanceCopy;
  locale: DisplayDateTimeLocale;
  members: Member[];
  reminderCopy: ExpenseReminderCopy;
  settlementCurrency: string;
  suggestion: SettlementSuggestion;
} & Partial<Pick<ExpenseDisplayCurrencyOptions, "displayCurrency" | "displayExchangeRate">>): SettlementSuggestionDisplay {
  const from = findMemberById(members, suggestion.from);
  const to = findMemberById(members, suggestion.to);

  return {
    label: settlementSuggestionLabel({
      balanceCopy,
      displayCurrency,
      displayExchangeRate,
      fromName: displayNameOrFallback(from, suggestion.from),
      settlementCurrency,
      suggestion,
      toName: displayNameOrFallback(to, suggestion.to),
    }),
    lastReminderLabel: suggestion.lastRemindedAt
      ? settlementReminderLabel({
        locale,
        remindedAt: suggestion.lastRemindedAt,
        reminderCopy,
      })
      : null,
  };
}

export function settlementReminderLabel({
  locale,
  reminderCopy,
  remindedAt,
}: {
  locale: DisplayDateTimeLocale;
  reminderCopy: ExpenseReminderCopy;
  remindedAt: string;
}): string {
  return reminderCopy.lastSent({
    date: formatReminderDate(remindedAt, locale),
  });
}
