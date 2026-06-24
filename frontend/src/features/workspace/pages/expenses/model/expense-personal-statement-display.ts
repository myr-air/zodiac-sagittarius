import { findItineraryItemById } from "@/src/trip/itinerary-items";
import { findMemberById } from "@/src/trip/members";
import {
  convertToSettlementCurrency,
  expenseExchangeRate,
  formatMoney,
  roundMoney,
} from "@/src/trip/expenses";
import { formatDayLabel } from "@/src/trip/itinerary-core/itinerary-view";
import type { Expense, Member, Trip } from "@/src/trip/types";
import {
  displayCurrencyCode,
  formatSettlementAmountForDisplay,
} from "./expense-display-currency";

export type PersonalStatementFlow =
  | "ownShare"
  | "paidForGroup"
  | "friendPaid"
  | "paybackSent"
  | "paybackReceived";

export type PersonalStatementSettlementState =
  | "paidAtSource"
  | "covered"
  | "partial"
  | "unpaid"
  | "recorded";

export interface PersonalStatementCopy {
  dateFallback: string;
  flow: Record<PersonalStatementFlow, string>;
  includedLineItems: ({ count }: { count: number }) => string;
  noDirectAllocation: string;
  paymentMethod: Record<PersonalStatementSettlementState, string>;
  relatedMember: {
    paidByYou: string;
    paidForYou: ({ name }: { name: string }) => string;
    sentTo: ({ name }: { name: string }) => string;
    receivedFrom: ({ name }: { name: string }) => string;
  };
}

export interface PersonalStatementRow {
  id: string;
  amountLabel: string;
  dateLabel: string;
  displayAmountLabel?: string;
  flow: PersonalStatementFlow;
  flowLabel: string;
  includedLabel: string;
  paidWithLabel: string;
  relatedMemberLabel: string;
  settlementState: PersonalStatementSettlementState;
  title: string;
}

interface PersonalStatementRowsInput {
  copy: PersonalStatementCopy;
  currentMemberId: string;
  displayCurrency: string;
  displayExchangeRate: number;
  locale: "en" | "th";
  settlementCurrency: string;
  trip: Trip;
}

interface DebtCoverage {
  coveredAmount: number;
  settlementTitles: string[];
}

export function personalStatementRows({
  copy,
  currentMemberId,
  displayCurrency,
  displayExchangeRate,
  locale,
  settlementCurrency,
  trip,
}: PersonalStatementRowsInput): PersonalStatementRow[] {
  const coverageByExpenseId = settlementCoverageByDebtExpense({
    currentMemberId,
    trip,
  });

  return [...trip.expenses]
    .sort((left, right) => expenseSortKey(trip, left).localeCompare(expenseSortKey(trip, right)))
    .flatMap((expense) => {
      if (expense.category === "settlement") {
        return settlementRowsForMember({
          copy,
          currentMemberId,
          displayCurrency,
          displayExchangeRate,
          expense,
          locale,
          settlementCurrency,
          trip,
        });
      }
      return spendRowForMember({
        copy,
        coverage: coverageByExpenseId.get(expense.id),
        currentMemberId,
        displayCurrency,
        displayExchangeRate,
        expense,
        locale,
        settlementCurrency,
        trip,
      });
    });
}

function spendRowForMember({
  copy,
  coverage,
  currentMemberId,
  displayCurrency,
  displayExchangeRate,
  expense,
  locale,
  settlementCurrency,
  trip,
}: {
  copy: PersonalStatementCopy;
  coverage?: DebtCoverage;
  currentMemberId: string;
  displayCurrency: string;
  displayExchangeRate: number;
  expense: Expense;
  locale: "en" | "th";
  settlementCurrency: string;
  trip: Trip;
}): PersonalStatementRow[] {
  const share = expense.splits[currentMemberId] ?? 0;
  if (share <= 0) return [];

  const payer = findMemberById(trip.members, expense.paidBy);
  const shareInSettlementCurrency = amountInSettlementCurrency(share, expense, settlementCurrency);
  const isPaidByCurrentMember = expense.paidBy === currentMemberId;
  const splitParticipants = Object.values(expense.splits).filter((amount) => amount > 0).length;
  const flow: PersonalStatementFlow = isPaidByCurrentMember
    ? splitParticipants > 1
      ? "paidForGroup"
      : "ownShare"
    : "friendPaid";
  const settlementState = isPaidByCurrentMember
    ? "paidAtSource"
    : settlementStateForCoverage(shareInSettlementCurrency, coverage?.coveredAmount ?? 0);
  const paidWithLabel = isPaidByCurrentMember
    ? copy.paymentMethod.paidAtSource
    : coverage?.settlementTitles.length
      ? `${copy.paymentMethod[settlementState]} · ${coverage.settlementTitles.join(", ")}`
      : copy.paymentMethod[settlementState];

  return [{
    id: `spend-${expense.id}-${currentMemberId}`,
    amountLabel: formatMoney(share, expense.currency ?? settlementCurrency),
    dateLabel: statementDateLabel(expense, trip, locale, copy.dateFallback),
    displayAmountLabel: displayAmountLabel({
      amount: shareInSettlementCurrency,
      displayCurrency,
      displayExchangeRate,
      settlementCurrency,
    }),
    flow,
    flowLabel: copy.flow[flow],
    includedLabel: includedLabelForMember(expense, currentMemberId, copy),
    paidWithLabel,
    relatedMemberLabel: isPaidByCurrentMember
      ? copy.relatedMember.paidByYou
      : copy.relatedMember.paidForYou({ name: payer?.displayName ?? expense.paidBy }),
    settlementState,
    title: expense.title,
  }];
}

function settlementRowsForMember({
  copy,
  currentMemberId,
  displayCurrency,
  displayExchangeRate,
  expense,
  locale,
  settlementCurrency,
  trip,
}: {
  copy: PersonalStatementCopy;
  currentMemberId: string;
  displayCurrency: string;
  displayExchangeRate: number;
  expense: Expense;
  locale: "en" | "th";
  settlementCurrency: string;
  trip: Trip;
}): PersonalStatementRow[] {
  const rows: PersonalStatementRow[] = [];
  const settlementAmount = amountInSettlementCurrency(expense.amount, expense, settlementCurrency);

  if (expense.paidBy === currentMemberId) {
    const recipients = settlementRecipients(expense, trip.members);
    const allocatedItems = settlementAllocationLabel(expense, currentMemberId, trip, copy.noDirectAllocation);
    rows.push({
      id: `settlement-sent-${expense.id}`,
      amountLabel: formatMoney(expense.amount, expense.currency ?? settlementCurrency),
      dateLabel: statementDateLabel(expense, trip, locale, copy.dateFallback),
      displayAmountLabel: displayAmountLabel({
        amount: settlementAmount,
        displayCurrency,
        displayExchangeRate,
        settlementCurrency,
      }),
      flow: "paybackSent",
      flowLabel: copy.flow.paybackSent,
      includedLabel: allocatedItems,
      paidWithLabel: copy.paymentMethod.recorded,
      relatedMemberLabel: copy.relatedMember.sentTo({ name: recipients || "-" }),
      settlementState: "recorded",
      title: expense.title,
    });
  }

  const receivedAmount = expense.splits[currentMemberId] ?? 0;
  if (receivedAmount > 0) {
    const sender = findMemberById(trip.members, expense.paidBy);
    const receivedSettlementAmount = amountInSettlementCurrency(receivedAmount, expense, settlementCurrency);
    const allocatedItems = settlementAllocationLabel(expense, expense.paidBy, trip, copy.noDirectAllocation);
    rows.push({
      id: `settlement-received-${expense.id}-${currentMemberId}`,
      amountLabel: formatMoney(receivedAmount, expense.currency ?? settlementCurrency),
      dateLabel: statementDateLabel(expense, trip, locale, copy.dateFallback),
      displayAmountLabel: displayAmountLabel({
        amount: receivedSettlementAmount,
        displayCurrency,
        displayExchangeRate,
        settlementCurrency,
      }),
      flow: "paybackReceived",
      flowLabel: copy.flow.paybackReceived,
      includedLabel: allocatedItems,
      paidWithLabel: copy.paymentMethod.recorded,
      relatedMemberLabel: copy.relatedMember.receivedFrom({ name: sender?.displayName ?? expense.paidBy }),
      settlementState: "recorded",
      title: expense.title,
    });
  }

  return rows;
}

function settlementCoverageByDebtExpense({
  currentMemberId,
  trip,
}: {
  currentMemberId: string;
  trip: Trip;
}): Map<string, DebtCoverage> {
  const coverageByExpenseId = new Map<string, DebtCoverage>();
  for (const settlement of trip.expenses.filter((expense) => expense.category === "settlement" && expense.paidBy === currentMemberId)) {
    for (const allocation of settlement.settlementAllocations ?? []) {
      if (allocation.memberId !== currentMemberId || allocation.amount <= 0) continue;
      const current = coverageByExpenseId.get(allocation.expenseId) ?? {
        coveredAmount: 0,
        settlementTitles: [],
      };
      coverageByExpenseId.set(allocation.expenseId, {
        coveredAmount: roundMoney(current.coveredAmount + allocation.amount),
        settlementTitles: [...current.settlementTitles, settlement.title],
      });
    }
  }

  return coverageByExpenseId;
}

function settlementStateForCoverage(
  debtAmount: number,
  coveredAmount: number,
): PersonalStatementSettlementState {
  if (coveredAmount <= 0) return "unpaid";
  return coveredAmount + 0.01 >= debtAmount ? "covered" : "partial";
}

function includedLabelForMember(
  expense: Expense,
  currentMemberId: string,
  copy: PersonalStatementCopy,
): string {
  const matchingItems = expense.lineItems?.filter((item) => item.participantIds.includes(currentMemberId)) ?? [];
  if (!matchingItems.length) return expense.title;
  return `${copy.includedLineItems({ count: matchingItems.length })}: ${matchingItems.map((item) => item.title).join(", ")}`;
}

function settlementRecipients(expense: Expense, members: Member[]): string {
  return Object.entries(expense.splits)
    .filter(([, amount]) => amount > 0)
    .map(([memberId]) => findMemberById(members, memberId)?.displayName ?? memberId)
    .join(", ");
}

function settlementAllocationLabel(
  settlement: Expense,
  memberId: string,
  trip: Trip,
  fallback: string,
): string {
  const labels = (settlement.settlementAllocations ?? [])
    .filter((allocation) => allocation.memberId === memberId && allocation.amount > 0)
    .map((allocation) => {
      const expense = trip.expenses.find((candidate) => candidate.id === allocation.expenseId);
      return expense?.title ?? allocation.expenseId;
    });
  if (!labels.length) return fallback;
  return labels.join(", ");
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

function displayAmountLabel({
  amount,
  displayCurrency,
  displayExchangeRate,
  settlementCurrency,
}: {
  amount: number;
  displayCurrency: string;
  displayExchangeRate: number;
  settlementCurrency: string;
}): string | undefined {
  const normalizedDisplayCurrency = displayCurrencyCode({ displayCurrency, settlementCurrency });
  const normalizedSettlementCurrency = displayCurrencyCode({ settlementCurrency });
  if (normalizedDisplayCurrency === normalizedSettlementCurrency) return undefined;
  return formatSettlementAmountForDisplay(amount, {
    displayCurrency,
    displayExchangeRate,
    settlementCurrency,
  });
}

function statementDateLabel(
  expense: Expense,
  trip: Trip,
  locale: "en" | "th",
  dateFallback: string,
): string {
  const linkedItem = findItineraryItemById(trip.itineraryItems, expense.itineraryItemId);
  return linkedItem ? `${formatDayLabel(linkedItem.day, trip.startDate, locale)} · ${linkedItem.day}` : dateFallback;
}

function expenseSortKey(trip: Trip, expense: Expense): string {
  const day = findItineraryItemById(trip.itineraryItems, expense.itineraryItemId)?.day ?? "9999-99-99";
  return `${day}-${expense.title}`;
}
