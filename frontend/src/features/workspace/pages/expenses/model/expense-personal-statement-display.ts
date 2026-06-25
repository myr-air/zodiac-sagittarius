import { findItineraryItemById } from "@/src/trip/itinerary-items";
import { findMemberById } from "@/src/trip/members";
import {
  buildExpenseSummary,
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
  | "closed"
  | "covered"
  | "netClearedUnallocated"
  | "partial"
  | "unpaid"
  | "recorded";

export type PersonalStatementAmountTone = "outflow" | "inflow" | "neutral";

export interface PersonalStatementCopy {
  accountContext: {
    advanceForGroup: ({ total }: { total: string }) => string;
    groupBill: ({ share, total }: { share: string; total: string }) => string;
  };
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
  amountTone: PersonalStatementAmountTone;
  contextLabel?: string;
  dateKey: string;
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

export interface PersonalStatementDayGroup {
  dateLabel: string;
  rows: PersonalStatementRow[];
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
  hasClosedStatement: boolean;
  indirectCoveredAmount: number;
  settlementTitles: string[];
}

interface SettlementAllocationPlan {
  coverageByExpenseId: Map<string, DebtCoverage>;
  inferredAllocationsBySettlementId: Map<string, { expenseId: string }[]>;
  labelsBySettlementId: Map<string, string>;
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
  const settlementPlansByMemberId = new Map<string, SettlementAllocationPlan>();
  const currentMemberNet = buildExpenseSummary(trip.expenses, currentMemberId, [], {
    settlementCurrency,
  }).netByMember[currentMemberId] ?? 0;
  const isCurrentMemberNetCleared = currentMemberNet >= -0.01;
  const settlementPlanForMember = (memberId: string) => {
    const existingPlan = settlementPlansByMemberId.get(memberId);
    if (existingPlan) return existingPlan;
    const nextPlan = settlementAllocationPlanForMember({
      memberId,
      settlementCurrency,
      trip,
    });
    settlementPlansByMemberId.set(memberId, nextPlan);
    return nextPlan;
  };
  const coverageByExpenseId = settlementPlanForMember(currentMemberId).coverageByExpenseId;

  return [...trip.expenses]
    .flatMap((expense) => {
      if (expense.category === "settlement") {
        return settlementRowsForMember({
          copy,
          currentMemberId,
          displayCurrency,
          displayExchangeRate,
          expense,
          settlementPlanForMember,
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
        isCurrentMemberNetCleared,
        locale,
        settlementCurrency,
        trip,
      });
      })
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey) || left.title.localeCompare(right.title));
}

export function personalStatementDayGroups(rows: PersonalStatementRow[]): PersonalStatementDayGroup[] {
  const groups: PersonalStatementDayGroup[] = [];
  for (const row of rows) {
    const current = groups.at(-1);
    if (current?.dateLabel === row.dateLabel) {
      current.rows.push(row);
      continue;
    }
    groups.push({ dateLabel: row.dateLabel, rows: [row] });
  }
  return groups;
}

function spendRowForMember({
  copy,
  coverage,
  currentMemberId,
  displayCurrency,
  displayExchangeRate,
  expense,
  isCurrentMemberNetCleared,
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
  isCurrentMemberNetCleared: boolean;
  locale: "en" | "th";
  settlementCurrency: string;
  trip: Trip;
}): PersonalStatementRow[] {
  const share = expense.splits[currentMemberId] ?? 0;
  const isPaidByCurrentMember = expense.paidBy === currentMemberId;
  if (!isPaidByCurrentMember && share <= 0) return [];
  if (isPaidByCurrentMember && expense.amount <= 0) return [];

  const payer = findMemberById(trip.members, expense.paidBy);
  const rowAmount = personalAccountAmount({ currentMemberId, expense });
  const rowAmountInSettlementCurrency = amountInSettlementCurrency(rowAmount, expense, settlementCurrency);
  const shareInSettlementCurrency = amountInSettlementCurrency(share, expense, settlementCurrency);
  const splitParticipants = Object.values(expense.splits).filter((amount) => amount > 0).length;
  const flow: PersonalStatementFlow = isPaidByCurrentMember
    ? splitParticipants > 1 || share < expense.amount
      ? "paidForGroup"
      : "ownShare"
    : "friendPaid";
  const settlementState = isPaidByCurrentMember
    ? "paidAtSource"
    : settlementStateForCoverage(shareInSettlementCurrency, coverage, isCurrentMemberNetCleared);
  const paidWithLabel = isPaidByCurrentMember
    ? copy.paymentMethod.paidAtSource
      : coverage?.settlementTitles.length
      ? `${copy.paymentMethod[settlementState]} · ${coverage.settlementTitles.join(", ")}`
      : copy.paymentMethod[settlementState];
  const amountTone = amountToneForFlow(flow);
  const date = statementDateParts(expense, trip, locale, copy.dateFallback);

  return [{
    id: `spend-${expense.id}-${currentMemberId}`,
    amountLabel: signedMoneyLabel(rowAmount, expense.currency ?? settlementCurrency, amountTone),
    amountTone,
    contextLabel: isPaidByCurrentMember ? groupBillContextLabel({ copy, currentMemberId, expense, settlementCurrency }) : undefined,
    dateKey: date.key,
    dateLabel: date.label,
    displayAmountLabel: displayAmountLabel({
      amount: rowAmountInSettlementCurrency,
      displayCurrency,
      displayExchangeRate,
      settlementCurrency,
      tone: amountTone,
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
  settlementPlanForMember,
  locale,
  settlementCurrency,
  trip,
}: {
  copy: PersonalStatementCopy;
  currentMemberId: string;
  displayCurrency: string;
  displayExchangeRate: number;
  expense: Expense;
  settlementPlanForMember: (memberId: string) => SettlementAllocationPlan;
  locale: "en" | "th";
  settlementCurrency: string;
  trip: Trip;
}): PersonalStatementRow[] {
  const rows: PersonalStatementRow[] = [];
  const settlementAmount = amountInSettlementCurrency(expense.amount, expense, settlementCurrency);

  if (expense.paidBy === currentMemberId) {
    const allocationPlan = settlementPlanForMember(currentMemberId);
    const date = settlementDateParts(expense, trip, locale, copy.dateFallback, allocationPlan);
    const recipients = settlementRecipients(expense, trip.members);
    const allocatedItems = settlementAllocationLabel(expense, currentMemberId, trip, allocationPlan, copy.noDirectAllocation);
    rows.push({
      id: `settlement-sent-${expense.id}`,
      amountLabel: signedMoneyLabel(expense.amount, expense.currency ?? settlementCurrency, "outflow"),
      amountTone: "outflow",
      dateKey: date.key,
      dateLabel: date.label,
      displayAmountLabel: displayAmountLabel({
        amount: settlementAmount,
        displayCurrency,
        displayExchangeRate,
        settlementCurrency,
        tone: "outflow",
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
    const allocationPlan = settlementPlanForMember(expense.paidBy);
    const date = settlementDateParts(expense, trip, locale, copy.dateFallback, allocationPlan);
    const allocatedItems = settlementAllocationLabel(expense, expense.paidBy, trip, allocationPlan, copy.noDirectAllocation);
    rows.push({
      id: `settlement-received-${expense.id}-${currentMemberId}`,
      amountLabel: signedMoneyLabel(receivedAmount, expense.currency ?? settlementCurrency, "inflow"),
      amountTone: "inflow",
      dateKey: date.key,
      dateLabel: date.label,
      displayAmountLabel: displayAmountLabel({
        amount: receivedSettlementAmount,
        displayCurrency,
        displayExchangeRate,
        settlementCurrency,
        tone: "inflow",
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

function settlementAllocationPlanForMember({
  memberId,
  settlementCurrency,
  trip,
}: {
  memberId: string;
  settlementCurrency: string;
  trip: Trip;
}): SettlementAllocationPlan {
  const coverageByExpenseId = new Map<string, DebtCoverage>();
  const inferredAllocationsBySettlementId = new Map<string, { expenseId: string }[]>();
  const labelsBySettlementId = new Map<string, string>();
  for (const settlement of trip.expenses.filter((expense) => expense.category === "settlement" && expense.paidBy === memberId)) {
    const explicitAllocations = settlement.settlementAllocations ?? [];
    if (!explicitAllocations.length) {
      const inferredAllocations = inferredSettlementAllocationsForMember({
        coverageByExpenseId,
        memberId,
        settlement,
        settlementCurrency,
        trip,
      });
      for (const allocation of inferredAllocations) {
        addDebtCoverage(coverageByExpenseId, allocation.expenseId, allocation.amount, settlement.title, false, false);
      }
      const indirectAllocations = inferredIndirectSettlementAllocationsForMember({
        coverageByExpenseId,
        directAllocations: inferredAllocations,
        memberId,
        settlement,
        settlementCurrency,
        trip,
      });
      for (const allocation of indirectAllocations) {
        addDebtCoverage(coverageByExpenseId, allocation.expenseId, allocation.amount, settlement.title, false, true);
      }
      const allInferredAllocations = [...inferredAllocations, ...indirectAllocations];
      if (allInferredAllocations.length) {
        inferredAllocationsBySettlementId.set(settlement.id, allInferredAllocations);
        labelsBySettlementId.set(settlement.id, allocationLabels(allInferredAllocations, trip).join(", "));
      }
      continue;
    }

    for (const allocation of explicitAllocations) {
      if (allocation.memberId !== memberId || allocation.amount <= 0) continue;
      addDebtCoverage(
        coverageByExpenseId,
        allocation.expenseId,
        settlementAllocationCoverageAmount(allocation),
        settlement.title,
        isClosedSettlementAllocation(allocation),
        false,
      );
    }
  }

  return { coverageByExpenseId, inferredAllocationsBySettlementId, labelsBySettlementId };
}

function addDebtCoverage(
  coverageByExpenseId: Map<string, DebtCoverage>,
  expenseId: string,
  amount: number,
  settlementTitle: string,
  hasClosedStatement: boolean,
  isIndirect: boolean,
) {
  const current = coverageByExpenseId.get(expenseId) ?? {
    coveredAmount: 0,
    hasClosedStatement: false,
    indirectCoveredAmount: 0,
    settlementTitles: [],
  };
  coverageByExpenseId.set(expenseId, {
    coveredAmount: roundMoney(current.coveredAmount + amount),
    hasClosedStatement: current.hasClosedStatement || hasClosedStatement,
    indirectCoveredAmount: isIndirect ? roundMoney(current.indirectCoveredAmount + amount) : current.indirectCoveredAmount,
    settlementTitles: current.settlementTitles.includes(settlementTitle)
      ? current.settlementTitles
      : [...current.settlementTitles, settlementTitle],
  });
}

function isClosedSettlementAllocation(allocation: { closedAmount?: number; statementStatus?: string }): boolean {
  return allocation.statementStatus === "closed" && (allocation.closedAmount ?? 0) > 0;
}

function settlementAllocationCoverageAmount(allocation: { amount: number; closedAmount?: number; statementStatus?: string }): number {
  return isClosedSettlementAllocation(allocation) ? allocation.closedAmount ?? allocation.amount : allocation.amount;
}

function inferredSettlementAllocationsForMember({
  coverageByExpenseId,
  memberId,
  settlement,
  settlementCurrency,
  trip,
}: {
  coverageByExpenseId?: Map<string, DebtCoverage>;
  memberId: string;
  settlement: Expense;
  settlementCurrency: string;
  trip: Trip;
}): { amount: number; expenseId: string }[] {
  if (settlement.category !== "settlement" || settlement.paidBy !== memberId) return [];
  const allocations: { amount: number; expenseId: string }[] = [];
  for (const [recipientId, recipientAmount] of Object.entries(settlement.splits)) {
    let remaining = amountInSettlementCurrency(recipientAmount, settlement, settlementCurrency);
    if (remaining <= 0) continue;
    const recipientDebtExpenses = trip.expenses
      .filter((expense) =>
        expense.category !== "settlement" &&
        expense.paidBy === recipientId &&
        expense.id !== settlement.id &&
        (expense.splits[memberId] ?? 0) > 0
      )
      .sort((left, right) => expenseSourceSortKey(trip, left).localeCompare(expenseSourceSortKey(trip, right)));

    for (const expense of recipientDebtExpenses) {
      const debtAmount = amountInSettlementCurrency(expense.splits[memberId] ?? 0, expense, settlementCurrency);
      const alreadyCovered = coverageByExpenseId?.get(expense.id)?.coveredAmount ?? 0;
      const outstandingAmount = roundMoney(debtAmount - alreadyCovered);
      if (outstandingAmount <= 0) continue;
      const amount = roundMoney(Math.min(remaining, outstandingAmount));
      if (amount <= 0) continue;
      allocations.push({ amount, expenseId: expense.id });
      remaining = roundMoney(remaining - amount);
      if (remaining <= 0) break;
    }
  }
  return allocations;
}

function inferredIndirectSettlementAllocationsForMember({
  coverageByExpenseId,
  directAllocations,
  memberId,
  settlement,
  settlementCurrency,
  trip,
}: {
  coverageByExpenseId: Map<string, DebtCoverage>;
  directAllocations: { amount: number; expenseId: string }[];
  memberId: string;
  settlement: Expense;
  settlementCurrency: string;
  trip: Trip;
}): { amount: number; expenseId: string }[] {
  if (settlement.category !== "settlement" || settlement.paidBy !== memberId) return [];
  const allocations: { amount: number; expenseId: string }[] = [];
  for (const [recipientId, recipientAmount] of Object.entries(settlement.splits)) {
    let remaining = roundMoney(
      amountInSettlementCurrency(recipientAmount, settlement, settlementCurrency)
        - directAllocatedAmountForRecipient({ allocations: directAllocations, recipientId, trip }),
    );
    if (remaining <= 0) continue;
    const intermediaryCapacities = indirectSettlementCapacitiesByIntermediary({
      memberId,
      recipientId,
      settlementCurrency,
      trip,
    });
    for (const [intermediaryId, capacity] of intermediaryCapacities) {
      let intermediaryRemaining = capacity;
      if (intermediaryRemaining <= 0) continue;
      const memberDebtExpenses = trip.expenses
        .filter((expense) =>
          expense.category !== "settlement" &&
          expense.paidBy === intermediaryId &&
          expense.id !== settlement.id &&
          (expense.splits[memberId] ?? 0) > 0
        )
        .sort((left, right) => expenseSourceSortKey(trip, left).localeCompare(expenseSourceSortKey(trip, right)));

      for (const expense of memberDebtExpenses) {
        const debtAmount = amountInSettlementCurrency(expense.splits[memberId] ?? 0, expense, settlementCurrency);
        const alreadyCovered = coverageByExpenseId.get(expense.id)?.coveredAmount ?? 0;
        const outstandingAmount = roundMoney(debtAmount - alreadyCovered);
        if (outstandingAmount <= 0) continue;
        const amount = roundMoney(Math.min(remaining, intermediaryRemaining, outstandingAmount));
        if (amount <= 0) continue;
        allocations.push({ amount, expenseId: expense.id });
        remaining = roundMoney(remaining - amount);
        intermediaryRemaining = roundMoney(intermediaryRemaining - amount);
        if (remaining <= 0) break;
      }
      if (remaining <= 0) break;
    }
  }
  return allocations;
}

function directAllocatedAmountForRecipient({
  allocations,
  recipientId,
  trip,
}: {
  allocations: { amount: number; expenseId: string }[];
  recipientId: string;
  trip: Trip;
}): number {
  return roundMoney(allocations.reduce((total, allocation) => {
    const expense = trip.expenses.find((candidate) => candidate.id === allocation.expenseId);
    return expense?.paidBy === recipientId ? total + allocation.amount : total;
  }, 0));
}

function indirectSettlementCapacitiesByIntermediary({
  memberId,
  recipientId,
  settlementCurrency,
  trip,
}: {
  memberId: string;
  recipientId: string;
  settlementCurrency: string;
  trip: Trip;
}): Map<string, number> {
  const capacities = new Map<string, number>();
  const chainDebtExpenses = trip.expenses
    .filter((expense) => expense.category !== "settlement" && expense.paidBy === recipientId)
    .sort((left, right) => expenseSourceSortKey(trip, left).localeCompare(expenseSourceSortKey(trip, right)));
  for (const expense of chainDebtExpenses) {
    for (const [intermediaryId, share] of Object.entries(expense.splits)) {
      if (intermediaryId === memberId || share <= 0) continue;
      capacities.set(
        intermediaryId,
        roundMoney((capacities.get(intermediaryId) ?? 0) + amountInSettlementCurrency(share, expense, settlementCurrency)),
      );
    }
  }
  for (const settlement of trip.expenses.filter((expense) => expense.category === "settlement")) {
    const currentCapacity = capacities.get(settlement.paidBy);
    if (!currentCapacity) continue;
    const paidToRecipient = settlement.splits[recipientId] ?? 0;
    if (paidToRecipient <= 0) continue;
    capacities.set(
      settlement.paidBy,
      Math.max(0, roundMoney(currentCapacity - amountInSettlementCurrency(paidToRecipient, settlement, settlementCurrency))),
    );
  }
  return capacities;
}

function settlementStateForCoverage(
  debtAmount: number,
  coverage?: DebtCoverage,
  isAccountNetCleared = false,
): PersonalStatementSettlementState {
  const coveredAmount = coverage?.coveredAmount ?? 0;
  if (coveredAmount <= 0) return isAccountNetCleared ? "netClearedUnallocated" : "unpaid";
  if (coverage?.hasClosedStatement) return "closed";
  const directCoveredAmount = roundMoney(coveredAmount - (coverage?.indirectCoveredAmount ?? 0));
  if (coveredAmount + 0.01 >= debtAmount && directCoveredAmount + 0.01 < debtAmount) {
    return "netClearedUnallocated";
  }
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

function personalAccountAmount({
  currentMemberId,
  expense,
}: {
  currentMemberId: string;
  expense: Expense;
}): number {
  if (expense.paidBy !== currentMemberId) return expense.splits[currentMemberId] ?? 0;
  const ownShare = expense.splits[currentMemberId] ?? 0;
  return ownShare > 0 ? ownShare : expense.amount;
}

function groupBillContextLabel({
  copy,
  currentMemberId,
  expense,
  settlementCurrency,
}: {
  copy: PersonalStatementCopy;
  currentMemberId: string;
  expense: Expense;
  settlementCurrency: string;
}): string | undefined {
  const ownShare = expense.splits[currentMemberId] ?? 0;
  const currency = expense.currency ?? settlementCurrency;
  if (ownShare > 0 && ownShare + 0.01 < expense.amount) {
    return copy.accountContext.groupBill({
      share: formatMoney(ownShare, currency),
      total: formatMoney(expense.amount, currency),
    });
  }
  if (ownShare <= 0 && expense.amount > 0) {
    return copy.accountContext.advanceForGroup({
      total: formatMoney(expense.amount, currency),
    });
  }
  return undefined;
}

function amountToneForFlow(flow: PersonalStatementFlow): PersonalStatementAmountTone {
  return flow === "paybackReceived" ? "inflow" : "outflow";
}

function signedMoneyLabel(
  amount: number,
  currency: string,
  tone: PersonalStatementAmountTone,
): string {
  const value = formatMoney(Math.abs(amount), currency);
  if (tone === "inflow") return `+${value}`;
  if (tone === "outflow") return `-${value}`;
  return value;
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
  allocationPlan: SettlementAllocationPlan,
  fallback: string,
): string {
  const explicitAllocations = settlement.settlementAllocations ?? [];
  const labels = allocationLabels(
    explicitAllocations
    .filter((allocation) => allocation.memberId === memberId && allocation.amount > 0)
    .map((allocation) => ({ amount: allocation.amount, expenseId: allocation.expenseId })),
    trip,
  );
  if (!labels.length && !explicitAllocations.length) {
    return allocationPlan.labelsBySettlementId.get(settlement.id) ?? fallback;
  }
  if (!labels.length) return fallback;
  return labels.join(", ");
}

function allocationLabels(
  allocations: { expenseId: string }[],
  trip: Trip,
): string[] {
  return allocations.map((allocation) => {
    const expense = trip.expenses.find((candidate) => candidate.id === allocation.expenseId);
    return expense?.title ?? allocation.expenseId;
  });
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
  tone,
}: {
  amount: number;
  displayCurrency: string;
  displayExchangeRate: number;
  settlementCurrency: string;
  tone: PersonalStatementAmountTone;
}): string | undefined {
  const normalizedDisplayCurrency = displayCurrencyCode({ displayCurrency, settlementCurrency });
  const normalizedSettlementCurrency = displayCurrencyCode({ settlementCurrency });
  if (normalizedDisplayCurrency === normalizedSettlementCurrency) return undefined;
  const label = formatSettlementAmountForDisplay(Math.abs(amount), {
    displayCurrency,
    displayExchangeRate,
    settlementCurrency,
  });
  if (tone === "inflow") return `+${label}`;
  if (tone === "outflow") return `-${label}`;
  return label;
}

function statementDateParts(
  expense: Expense,
  trip: Trip,
  locale: "en" | "th",
  dateFallback: string,
): { key: string; label: string } {
  const linkedItem = findItineraryItemById(trip.itineraryItems, expense.itineraryItemId);
  const day = linkedItem?.day ?? expense.spentOn ?? null;
  return {
    key: day ?? "9999-99-99",
    label: day ? `${formatDayLabel(day, trip.startDate, locale)} · ${day}` : dateFallback,
  };
}

function settlementDateParts(
  expense: Expense,
  trip: Trip,
  locale: "en" | "th",
  dateFallback: string,
  allocationPlan: SettlementAllocationPlan,
): { key: string; label: string } {
  const directDate = statementDateParts(expense, trip, locale, "");
  if (directDate.label) return directDate;
  const allocations = expense.settlementAllocations?.length
    ? expense.settlementAllocations
    : allocationPlan.inferredAllocationsBySettlementId.get(expense.id) ?? [];
  const allocationDate = allocations
    .map((allocation) => trip.expenses.find((candidate) => candidate.id === allocation.expenseId))
    .map((allocatedExpense) => allocatedExpense ? statementDateParts(allocatedExpense, trip, locale, "") : null)
    .find((date) => date?.label);
  return allocationDate ?? { key: "9999-99-99", label: dateFallback };
}

function expenseSourceSortKey(trip: Trip, expense: Expense): string {
  const day = findItineraryItemById(trip.itineraryItems, expense.itineraryItemId)?.day ?? expense.spentOn ?? "9999-99-99";
  return `${day}-${expense.title}`;
}
