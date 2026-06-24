import type { RecordExpenseReminderApiRequest } from "../api-client";
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
} from "../types";
import {
  attachReminderHistory,
  buildSettlementSuggestions,
  filterExpenseRemindersForTripPlan,
  upsertExpenseReminder,
} from "./expense-settlements";
import { isStoredValueFundingExpense } from "./expense-stored-value";

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

export function expenseSummarySettlementCurrency(
  expenseSummary: Pick<ExpenseSummary, "settlementCurrency">,
): string {
  return expenseSummary.settlementCurrency ?? "HKD";
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
    if (isStoredValueFundingExpense(expense)) continue;
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

export { filterExpenseRemindersForTripPlan, upsertExpenseReminder };
