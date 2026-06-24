import { findItineraryItemById } from "@/src/trip/itinerary-items";
import { findMemberById } from "@/src/trip/members";
import {
  convertToSettlementCurrency,
  expenseExchangeRate,
  formatMoney,
  refundAmount,
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
  return [...trip.expenses]
    .sort((left, right) => {
      const leftDay = findItineraryItemById(trip.itineraryItems, left.itineraryItemId)?.day ?? "9999-99-99";
      const rightDay = findItineraryItemById(trip.itineraryItems, right.itineraryItemId)?.day ?? "9999-99-99";
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
        dateLabel: linkedItem ? `${formatDayLabel(linkedItem.day, trip.startDate, locale)} · ${linkedItem.day}` : copy.dateFallback,
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
