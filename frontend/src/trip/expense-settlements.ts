import type { ExpenseReminder, SettlementSuggestion } from "./types";

export function buildSettlementSuggestions(
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

export function attachReminderHistory(
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

function expenseReminderKey(
  input: Pick<ExpenseReminder, "tripPlanId" | "from" | "to" | "amount">,
): string {
  return `${input.tripPlanId ?? ""}|${input.from}|${input.to}|${Math.round(input.amount * 100)}`;
}
