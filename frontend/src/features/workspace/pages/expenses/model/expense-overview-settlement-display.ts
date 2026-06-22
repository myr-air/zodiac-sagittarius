import type { DisplayDateTimeLocale } from "@/src/shared/date-time-display";
import { formatMoney, formatReminderDate } from "@/src/trip/expenses";
import { findMemberById } from "@/src/trip/members";
import type { Member, SettlementSuggestion } from "@/src/trip/types";
import type { ExpenseBalanceCopy } from "./expense-overview-balance-display";

export interface ExpenseReminderCopy {
  lastSent(input: { date: string }): string;
}

export interface SettlementSuggestionDisplay {
  label: string;
  lastReminderLabel: string | null;
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

export function settlementSuggestionDisplay({
  balanceCopy,
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
}): SettlementSuggestionDisplay {
  const from = findMemberById(members, suggestion.from);
  const to = findMemberById(members, suggestion.to);

  return {
    label: settlementSuggestionLabel({
      balanceCopy,
      fromName: from?.displayName ?? suggestion.from,
      settlementCurrency,
      suggestion,
      toName: to?.displayName ?? suggestion.to,
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
