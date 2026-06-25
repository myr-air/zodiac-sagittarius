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
  const closedCoverageByShare = closedSettlementCoverageByShare(expenses);
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
    let balanceAmount = expense.category === "settlement"
      ? closedSettlementBalanceAmount(expense, settlementAmount)
      : 0;
    for (const [memberId, share] of Object.entries(expense.splits)) {
      const balanceShare = expense.category === "settlement"
        ? closedSettlementShareAmount(expense, memberId, share, exchangeRate)
        : closedCoverageByShare.get(closedCoverageKey(expense.id, memberId)) ??
          convertToSettlementCurrency(share, exchangeRate);
      if (expense.category !== "settlement") {
        balanceAmount = roundMoney(balanceAmount + balanceShare);
      }
      netByMember[memberId] = roundMoney(
        netByMember[memberId] - balanceShare,
      );
    }
    if (expense.category !== "settlement" && !Object.keys(expense.splits).length) {
      balanceAmount = settlementAmount;
    }
    netByMember[expense.paidBy] = roundMoney(
      netByMember[expense.paidBy] + balanceAmount,
    );
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

function closedSettlementBalanceAmount(expense: Expense, fallbackAmount: number): number {
  const closedAmount = closedSettlementAmount(expense);
  return closedAmount > 0 ? closedAmount : fallbackAmount;
}

function closedSettlementShareAmount(
  expense: Expense,
  memberId: string,
  share: number,
  exchangeRate: number,
): number {
  const splitMembers = Object.entries(expense.splits).filter(([, amount]) => amount > 0);
  const closedAmount = closedSettlementAmount(expense);
  if (closedAmount > 0 && splitMembers.length === 1 && splitMembers[0]?.[0] === memberId) {
    return closedAmount;
  }
  return convertToSettlementCurrency(share, exchangeRate);
}

function closedSettlementAmount(expense: Expense): number {
  if (expense.category !== "settlement") return 0;
  return roundMoney((expense.settlementAllocations ?? []).reduce((sum, allocation) => {
    if (allocation.statementStatus !== "closed" || (allocation.closedAmount ?? 0) <= 0) return sum;
    return sum + (allocation.closedAmount ?? 0);
  }, 0));
}

function closedSettlementCoverageByShare(expenses: Expense[]): Map<string, number> {
  const coverage = new Map<string, number>();
  for (const expense of expenses) {
    if (expense.category !== "settlement") continue;
    for (const allocation of expense.settlementAllocations ?? []) {
      if (allocation.statementStatus !== "closed" || (allocation.closedAmount ?? 0) <= 0) continue;
      const key = closedCoverageKey(allocation.expenseId, allocation.memberId);
      coverage.set(key, roundMoney((coverage.get(key) ?? 0) + (allocation.closedAmount ?? 0)));
    }
  }
  return coverage;
}

function closedCoverageKey(expenseId: string, memberId: string): string {
  return `${expenseId}::${memberId}`;
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
