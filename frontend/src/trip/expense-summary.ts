import type { RecordExpenseReminderApiRequest } from "./api-client";
import {
  convertToSettlementCurrency,
  expenseExchangeRate,
  formatMoney,
  normalizeCurrency,
  roundMoney,
} from "./expense-money";
import type {
  Expense,
  ExpenseReminder,
  ExpenseSummary,
  SettlementSuggestion,
  Trip,
} from "./types";

interface BuildExpenseSummaryOptions {
  exchangeRates?: Record<string, number>;
  settlementCurrency?: string;
}

export interface ExpenseReminderRequest {
  from: string;
  to: string;
  amountMinor: number;
}

export interface BuildExpenseReminderRequestOptions {
  clientMutationId: string;
}

export function buildExpenseSummary(
  expenses: Expense[],
  currentMemberId: string,
  reminders: ExpenseReminder[] = [],
  options: BuildExpenseSummaryOptions = {},
): ExpenseSummary {
  const settlementCurrency = normalizeCurrency(
    options.settlementCurrency ?? "HKD",
  );
  const memberIds = Array.from(
    new Set(
      expenses.flatMap((expense) => [
        expense.paidBy,
        ...Object.keys(expense.splits),
      ]),
    ),
  );
  const netByMember = Object.fromEntries(memberIds.map((id) => [id, 0]));
  let groupSpend = 0;

  for (const expense of expenses) {
    const exchangeRate = expenseExchangeRate(
      expense,
      settlementCurrency,
      options.exchangeRates,
    );
    const settlementAmount = convertToSettlementCurrency(
      expense.amount,
      exchangeRate,
    );
    if (expense.category !== "settlement") groupSpend += settlementAmount;
    netByMember[expense.paidBy] = roundMoney(
      netByMember[expense.paidBy] + settlementAmount,
    );
    for (const [memberId, share] of Object.entries(expense.splits)) {
      netByMember[memberId] = roundMoney(
        netByMember[memberId] -
          convertToSettlementCurrency(share, exchangeRate),
      );
    }
  }

  const currentNet = roundMoney(netByMember[currentMemberId] ?? 0);
  return {
    groupSpend: roundMoney(groupSpend),
    settlementCurrency,
    netByMember,
    currentUserNetLabel:
      currentNet > 0
        ? `You are owed ${formatMoney(currentNet, settlementCurrency)}`
        : currentNet < 0
          ? `You owe ${formatMoney(Math.abs(currentNet), settlementCurrency)}`
          : "You are settled",
    settlementSuggestions: attachReminderHistory(
      buildSettlementSuggestions(netByMember, settlementCurrency),
      reminders,
    ),
  };
}

export function expenseReminderRequestForSuggestion(
  suggestion: SettlementSuggestion,
): ExpenseReminderRequest {
  return {
    from: suggestion.from,
    to: suggestion.to,
    amountMinor: Math.round(suggestion.amount * 100),
  };
}

export function buildExpenseReminderRequest(
  suggestion: SettlementSuggestion,
  options: BuildExpenseReminderRequestOptions,
): RecordExpenseReminderApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    ...expenseReminderRequestForSuggestion(suggestion),
  };
}

export function recordLocalExpenseReminderInTrip<
  T extends Pick<Trip, "expenseReminders">,
>(
  trip: T,
  suggestion: SettlementSuggestion,
  options: {
    tripPlanId?: string | null;
    remindedAt: string;
  },
): T {
  return {
    ...trip,
    expenseReminders: upsertExpenseReminder(trip.expenseReminders ?? [], {
      tripPlanId: options.tripPlanId,
      from: suggestion.from,
      to: suggestion.to,
      amount: suggestion.amount,
      lastRemindedAt: options.remindedAt,
    }),
  };
}

export function upsertExpenseReminder(
  reminders: ExpenseReminder[],
  reminder: ExpenseReminder,
): ExpenseReminder[] {
  const reminderKey = expenseReminderKey(reminder);
  const nextReminders = reminders.filter(
    (candidate) => expenseReminderKey(candidate) !== reminderKey,
  );
  return [...nextReminders, reminder];
}

export function filterExpenseRemindersForTripPlan(
  reminders: ExpenseReminder[],
  tripPlanId: string | null | undefined,
  mainTripPlanId: string | null | undefined,
): ExpenseReminder[] {
  if (!tripPlanId) return reminders;
  return reminders.filter((reminder) => {
    const reminderTripPlanId = reminder.tripPlanId ?? mainTripPlanId ?? null;
    return reminderTripPlanId === tripPlanId;
  });
}

function buildSettlementSuggestions(
  netByMember: Record<string, number>,
  settlementCurrency: string,
): SettlementSuggestion[] {
  const creditors = Object.entries(netByMember)
    .map(([id, net]) => ({ id, cents: Math.round(net * 100) }))
    .filter((entry) => entry.cents > 0)
    .sort((a, b) => b.cents - a.cents);
  const debtors = Object.entries(netByMember)
    .map(([id, net]) => ({ id, cents: Math.round(-net * 100) }))
    .filter((entry) => entry.cents > 0)
    .sort((a, b) => b.cents - a.cents);
  const suggestions: SettlementSuggestion[] = [];

  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const cents = Math.min(
      debtors[debtorIndex].cents,
      creditors[creditorIndex].cents,
    );
    suggestions.push({
      from: debtors[debtorIndex].id,
      to: creditors[creditorIndex].id,
      amount: cents / 100,
      currency: settlementCurrency,
    });
    debtors[debtorIndex].cents -= cents;
    creditors[creditorIndex].cents -= cents;
    if (debtors[debtorIndex].cents === 0) debtorIndex += 1;
    if (creditors[creditorIndex].cents === 0) creditorIndex += 1;
  }

  return suggestions;
}

function attachReminderHistory(
  suggestions: SettlementSuggestion[],
  reminders: ExpenseReminder[],
): SettlementSuggestion[] {
  const remindersByKey = new Map(
    reminders.map((reminder) => [expenseReminderKey(reminder), reminder]),
  );
  return suggestions.map((suggestion) => {
    const reminder = remindersByKey.get(expenseReminderKey(suggestion));
    return reminder
      ? { ...suggestion, lastRemindedAt: reminder.lastRemindedAt }
      : suggestion;
  });
}

function expenseReminderKey(
  input: Pick<ExpenseReminder, "tripPlanId" | "from" | "to" | "amount">,
): string {
  return `${input.tripPlanId ?? ""}|${input.from}|${input.to}|${Math.round(input.amount * 100)}`;
}
