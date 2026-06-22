import { formatMoney, formatReminderDate } from "@/src/trip/expenses";
import type { DisplayDateTimeLocale } from "@/src/shared/date-time-display";
import { findMemberById } from "@/src/trip/members";
import { tripPlanName } from "@/src/trip/trip-plans";
import type { Expense, Member, SettlementSuggestion, Trip } from "@/src/trip/types";
import { categoryTone, type CategoryTone } from "./expense-page-options";

export interface ExpenseBalanceCopy {
  owed(input: { name: string; amount: string }): string;
  owes(input: { name: string; amount: string }): string;
  payback(input: { from: string; to: string; amount: string }): string;
  settled(input: { name: string }): string;
}

export interface ExpenseReminderCopy {
  lastSent(input: { date: string }): string;
}

export interface ExpenseMemberBalanceDisplay {
  amountLabel: string;
  description: string;
  tone: "negative" | "neutral" | "positive";
}

export interface SettlementSuggestionDisplay {
  label: string;
  lastReminderLabel: string | null;
}

export interface CategorySpendDisplay {
  amountLabel: string;
  category: Expense["category"];
  tone: CategoryTone;
}

export interface ScopeAuditExpenseDisplay {
  id: string;
  title: string;
  tripPlanName: string;
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

export function categorySpendAmountLabel({
  amount,
  settlementCurrency,
}: {
  amount: number;
  settlementCurrency: string;
}): string {
  return formatMoney(amount, settlementCurrency);
}

export function categorySpendDisplay({
  amount,
  category,
  settlementCurrency,
}: {
  amount: number;
  category: Expense["category"];
  settlementCurrency: string;
}): CategorySpendDisplay {
  return {
    amountLabel: categorySpendAmountLabel({ amount, settlementCurrency }),
    category,
    tone: categoryTone(category),
  };
}

export function scopeAuditExpenseDisplay({
  expense,
  trip,
}: {
  expense: Expense;
  trip: Trip;
}): ScopeAuditExpenseDisplay {
  return {
    id: expense.id,
    title: expense.title,
    tripPlanName: tripPlanName(trip, expense.tripPlanId),
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
