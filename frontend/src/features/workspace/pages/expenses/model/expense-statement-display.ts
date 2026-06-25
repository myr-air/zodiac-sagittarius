import { findItineraryItemById } from "@/src/trip/itinerary-items";
import { findMemberById } from "@/src/trip/members";
import {
  convertToSettlementCurrency,
  expenseExchangeRate,
  formatMoney,
  refundAmount,
  roundMoney,
  sumShares,
} from "@/src/trip/expenses";
import { formatDayLabel } from "@/src/trip/itinerary-core/itinerary-view";
import type { Expense, Member, Trip } from "@/src/trip/types";
import {
  displayCurrencyCode,
  formatSettlementAmountForDisplay,
} from "./expense-display-currency";

export type ExpenseStatementStatus =
  | "recorded"
  | "needsReview"
  | "settlementRecorded"
  | "noPaybackNeeded";

export interface ExpenseStatementCopy {
  categories: Record<Expense["category"], string>;
  dateFallback: string;
  linkedStopFallback: string;
  recordSourceLedger: string;
  recordSourceSettlement: string;
  splitSingle: ({ name }: { name: string }) => string;
  splitMembers: ({ count }: { count: number }) => string;
  status: Record<ExpenseStatementStatus, string>;
  statusReason: Record<ExpenseStatementStatus, string>;
  statusShortReason: Record<ExpenseStatementStatus, string>;
  type: {
    settlement: string;
    spend: string;
  };
}

export interface ExpenseStatementRow {
  id: string;
  amountLabel: string;
  categoryLabel: string;
  dateLabel: string;
  displayAmountLabel?: string;
  linkedStopLabel: string;
  paidByLabel: string;
  recordSourceLabel: string;
  splitLabel: string;
  status: ExpenseStatementStatus;
  statusLabel: string;
  statusReason: string;
  statusShortReason: string;
  title: string;
  typeLabel: string;
}

interface ExpenseStatementRowsInput {
  copy: ExpenseStatementCopy;
  displayCurrency: string;
  displayExchangeRate: number;
  locale: "en" | "th";
  settlementCurrency: string;
  trip: Trip;
}

export function expenseStatementRows({
  copy,
  displayCurrency,
  displayExchangeRate,
  locale,
  settlementCurrency,
  trip,
}: ExpenseStatementRowsInput): ExpenseStatementRow[] {
  const inferredAllocationsBySettlementId = inferredSettlementAllocationsBySettlementId(trip, settlementCurrency);
  return [...trip.expenses]
    .sort((left, right) => {
      const leftDay = statementDay(trip, left, inferredAllocationsBySettlementId) ?? "9999-99-99";
      const rightDay = statementDay(trip, right, inferredAllocationsBySettlementId) ?? "9999-99-99";
      return leftDay.localeCompare(rightDay) || left.title.localeCompare(right.title);
    })
    .map((expense) => {
      const linkedItem = findItineraryItemById(trip.itineraryItems, expense.itineraryItemId);
      const payer = findMemberById(trip.members, expense.paidBy);
      const status = expenseStatementStatus(expense);
      const currency = expense.currency ?? settlementCurrency;
      const exchangeRate = expenseExchangeRate(expense, settlementCurrency);
      const settlementAmount = convertToSettlementCurrency(expense.amount, exchangeRate);
      const displayAmountLabel = formatSettlementAmountForDisplay(settlementAmount, {
        displayCurrency,
        displayExchangeRate,
        settlementCurrency,
      });
      const normalizedDisplayCurrency = displayCurrencyCode({ displayCurrency, settlementCurrency });
      const normalizedSettlementCurrency = displayCurrencyCode({ settlementCurrency });

      return {
        id: expense.id,
        amountLabel: formatMoney(expense.amount, currency),
        categoryLabel: copy.categories[expense.category],
        dateLabel: statementDateLabel(expense, trip, locale, copy.dateFallback, inferredAllocationsBySettlementId),
        displayAmountLabel: normalizedDisplayCurrency === normalizedSettlementCurrency ? undefined : displayAmountLabel,
        linkedStopLabel: linkedItem?.activity ?? copy.linkedStopFallback,
        paidByLabel: payer?.displayName ?? expense.paidBy,
        recordSourceLabel: expense.category === "settlement" ? copy.recordSourceSettlement : copy.recordSourceLedger,
        splitLabel: expenseStatementSplitLabel(expense, trip.members, copy),
        status,
        statusLabel: copy.status[status],
        statusReason: copy.statusReason[status],
        statusShortReason: copy.statusShortReason[status],
        title: expense.title,
        typeLabel: expense.category === "settlement" ? copy.type.settlement : copy.type.spend,
      };
    });
}

function statementDateLabel(
  expense: Expense,
  trip: Trip,
  locale: "en" | "th",
  fallback: string,
  inferredAllocationsBySettlementId: Map<string, { expenseId: string }[]>,
): string {
  const day = statementDay(trip, expense, inferredAllocationsBySettlementId);
  return day ? `${formatDayLabel(day, trip.startDate, locale)} · ${day}` : fallback;
}

function statementDay(
  trip: Trip,
  expense: Expense,
  inferredAllocationsBySettlementId: Map<string, { expenseId: string }[]>,
  seen = new Set<string>(),
): string | null {
  if (seen.has(expense.id)) return null;
  seen.add(expense.id);
  const directDay = findItineraryItemById(trip.itineraryItems, expense.itineraryItemId)?.day ?? expense.spentOn ?? null;
  if (directDay || expense.category !== "settlement") return directDay;
  const explicitAllocations = expense.settlementAllocations ?? [];
  const allocatedExpenses = explicitAllocations.length
    ? explicitAllocations
      .map((allocation) => trip.expenses.find((candidate) => candidate.id === allocation.expenseId))
    : (inferredAllocationsBySettlementId.get(expense.id) ?? [])
      .map((allocation) => trip.expenses.find((candidate) => candidate.id === allocation.expenseId));
  return allocatedExpenses
    .filter((allocatedExpense): allocatedExpense is Expense => Boolean(allocatedExpense))
    .map((allocatedExpense) => statementDay(trip, allocatedExpense, inferredAllocationsBySettlementId, seen))
    .find(Boolean) ?? null;
}

function inferredSettlementAllocationsBySettlementId(
  trip: Trip,
  settlementCurrency: string,
): Map<string, { expenseId: string }[]> {
  const allocationsBySettlementId = new Map<string, { expenseId: string }[]>();
  const coverageByPayerExpense = new Map<string, number>();
  const settlements = trip.expenses.filter((expense) => expense.category === "settlement");
  for (const settlement of settlements) {
    const explicitAllocations = settlement.settlementAllocations ?? [];
    if (explicitAllocations.length) {
      for (const allocation of explicitAllocations) {
        const coverageKey = `${allocation.memberId}::${allocation.expenseId}`;
        const coverageAmount = allocation.statementStatus === "closed" && (allocation.closedAmount ?? 0) > 0
          ? allocation.closedAmount ?? allocation.amount
          : allocation.amount;
        coverageByPayerExpense.set(
          coverageKey,
          roundMoney((coverageByPayerExpense.get(coverageKey) ?? 0) + coverageAmount),
        );
      }
      continue;
    }
    const allocations: { expenseId: string }[] = [];
    for (const [recipientId, recipientAmount] of Object.entries(settlement.splits)) {
      let remaining = amountInSettlementCurrency(recipientAmount, settlement, settlementCurrency);
      if (remaining <= 0) continue;
      const recipientDebtExpenses = trip.expenses
        .filter((expense) =>
          expense.category !== "settlement" &&
          expense.paidBy === recipientId &&
          (expense.splits[settlement.paidBy] ?? 0) > 0
        )
        .sort((left, right) => expenseSourceSortKey(trip, left).localeCompare(expenseSourceSortKey(trip, right)));
      for (const expense of recipientDebtExpenses) {
        const coverageKey = `${settlement.paidBy}::${expense.id}`;
        const debtAmount = amountInSettlementCurrency(expense.splits[settlement.paidBy] ?? 0, expense, settlementCurrency);
        const alreadyCovered = coverageByPayerExpense.get(coverageKey) ?? 0;
        const outstandingAmount = roundMoney(debtAmount - alreadyCovered);
        if (outstandingAmount <= 0) continue;
        const amount = roundMoney(Math.min(remaining, outstandingAmount));
        if (amount <= 0) continue;
        allocations.push({ expenseId: expense.id });
        coverageByPayerExpense.set(coverageKey, roundMoney(alreadyCovered + amount));
        remaining = roundMoney(remaining - amount);
        if (remaining <= 0) break;
      }
    }
    if (allocations.length) allocationsBySettlementId.set(settlement.id, allocations);
  }
  return allocationsBySettlementId;
}

function expenseSourceSortKey(trip: Trip, expense: Expense): string {
  const day = findItineraryItemById(trip.itineraryItems, expense.itineraryItemId)?.day ?? expense.spentOn ?? "9999-99-99";
  return `${day}-${expense.title}`;
}

function amountInSettlementCurrency(
  amount: number,
  expense: Expense,
  settlementCurrency: string,
): number {
  return convertToSettlementCurrency(
    amount,
    expenseExchangeRate(expense, settlementCurrency),
  );
}

export function expenseStatementStatus(expense: Expense): ExpenseStatementStatus {
  if (expense.category === "settlement") return "settlementRecorded";
  const positiveParticipants = Object.entries(expense.splits).filter(([, amount]) => amount > 0);
  if (
    positiveParticipants.length === 1 &&
    positiveParticipants[0]?.[0] === expense.paidBy &&
    Math.abs(sumShares(expense.splits) - expense.amount) < 0.01
  ) {
    return "noPaybackNeeded";
  }
  return refundAmount(expense) > 0 ? "needsReview" : "recorded";
}

function expenseStatementSplitLabel(
  expense: Expense,
  members: Member[],
  copy: ExpenseStatementCopy,
): string {
  const participantIds = Object.entries(expense.splits)
    .filter(([, amount]) => amount > 0)
    .map(([memberId]) => memberId);
  if (participantIds.length === 1) {
    const member = findMemberById(members, participantIds[0] ?? "");
    return copy.splitSingle({ name: member?.displayName ?? participantIds[0] ?? "" });
  }
  return copy.splitMembers({ count: participantIds.length });
}
