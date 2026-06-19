import type {
  CreateExpenseApiRequest,
  PatchExpenseApiRequest,
  RecordExpenseReminderApiRequest,
} from "./api-client";
import {
  convertToSettlementCurrency,
  expenseExchangeRate,
  formatMoney,
  normalizeCurrency,
  roundMoney,
} from "./expense-money";
import type { Expense, ExpenseComment, ExpenseLineItem, ExpenseReminder, ExpenseSummary, SettlementSuggestion, Trip } from "./types";

export {
  expenseAmountInSettlementCurrency,
  formatMoney,
} from "./expense-money";
export {
  buildExpenseCsv,
  buildExpenseStatement,
  buildPaybackReminder,
} from "./expense-reports";

export type ExpenseSplitMode = "equal" | "exact" | "shares" | "percentage" | "itemized";

export interface ExpenseInputLike {
  itemId: string | null;
  title: string;
  amount: number;
  tripPlanId?: string | null;
  paidBy: string;
  category: Expense["category"];
  currency?: string;
  exchangeRateToSettlementCurrency?: number;
  notes?: string;
  receiptUrl?: string | null;
  lineItems?: ExpenseLineItem[];
  comments?: ExpenseComment[];
  repeatCount?: number;
  splits?: Record<string, number>;
}

export type ExpenseCreateDraft = Omit<ExpenseInputLike, "repeatCount" | "splits"> & {
  splits: Record<string, number>;
};

export interface ExpenseUpdateInputLike extends Omit<ExpenseInputLike, "repeatCount" | "itemId"> {
  expenseId: string;
  itemId?: string | null;
}

export interface ExpenseUpdateDraft {
  expenseId: string;
  title: string;
  amount: number;
  amountMinor: number;
  currency: string;
  exchangeRateToSettlementCurrency: number;
  notes: string;
  receiptUrl: string | null;
  lineItems: ExpenseLineItem[];
  comments: ExpenseComment[];
  tripPlanId: string | null | undefined;
  paidBy: string;
  category: Expense["category"];
  splits: Record<string, number>;
  itineraryItemId: string | null;
}

export interface AppendLocalExpensesOptions<
  T extends Pick<Trip, "id" | "expenses" | "itineraryItems" | "mainTripPlanId" | "activePlanVariantId">,
> {
  selectedTripPlanId?: string | null;
  nextExpenseId: (expenses: Expense[]) => string;
  resolveTripPlanId: (
    trip: T,
    recordId: string | null | undefined,
    preferredTripPlanId?: string | null,
  ) => string | null | undefined;
}

export interface BuildExpenseUpdateDraftOptions<
  T extends Pick<Trip, "members" | "itineraryItems" | "mainTripPlanId" | "activePlanVariantId">,
> {
  selectedTripPlanId?: string | null;
  resolveTripPlanId: (
    trip: T,
    recordId: string | null | undefined,
    preferredTripPlanId?: string | null,
  ) => string | null | undefined;
}

export interface ExpenseReminderRequest {
  from: string;
  to: string;
  amountMinor: number;
}

export interface BuildExpenseReminderRequestOptions {
  clientMutationId: string;
}

export interface BuildCreateExpenseRequestOptions {
  clientMutationId: string;
  tripPlanId?: string | null;
}

export interface BuildPatchExpenseRequestOptions {
  clientMutationId: string;
  expectedVersion: number;
}

interface BuildExpenseSplitsInput {
  amount: number;
  memberIds: string[];
  mode: ExpenseSplitMode;
  valuesByMember?: Record<string, number>;
}

interface BuildItemizedExpenseSplitsInput {
  lineItems: ExpenseLineItem[];
  memberIds: string[];
}

interface BuildExpenseSummaryOptions {
  exchangeRates?: Record<string, number>;
  settlementCurrency?: string;
}

export function buildExpenseSplits({ amount, memberIds, mode, valuesByMember = {} }: BuildExpenseSplitsInput): Record<string, number> {
  const participantIds = memberIds.length ? memberIds : ["unknown-member"];
  const amountCents = Math.round(amount * 100);

  if (mode === "exact") {
    return Object.fromEntries(participantIds.map((memberId) => [memberId, roundMoney(valuesByMember[memberId] ?? 0)]));
  }

  if (mode === "percentage") {
    const rawCents = participantIds.map((memberId) => (amountCents * Math.max(0, valuesByMember[memberId] ?? 0)) / 100);
    return allocateCentsByRawShares(participantIds, rawCents);
  }

  if (mode === "shares") {
    const weights = participantIds.map((memberId) => Math.max(0, valuesByMember[memberId] ?? 0));
    return allocateCentsByWeight(participantIds, amountCents, weights);
  }

  return allocateCentsByWeight(participantIds, amountCents, participantIds.map(() => 1));
}

export function buildItemizedExpenseSplits({ lineItems, memberIds }: BuildItemizedExpenseSplitsInput): Record<string, number> {
  const memberIdSet = new Set(memberIds);
  const centsByMember = Object.fromEntries(memberIds.map((memberId) => [memberId, 0]));

  for (const lineItem of lineItems) {
    const participantIds = Array.from(new Set(lineItem.participantIds.filter((memberId) => memberIdSet.has(memberId))));
    if (!participantIds.length) continue;
    const lineCents = Math.round(lineItem.amount * 100);
    const lineSplits = allocateCentsByWeight(participantIds, lineCents, participantIds.map(() => 1));
    for (const [memberId, share] of Object.entries(lineSplits)) {
      centsByMember[memberId] = (centsByMember[memberId] ?? 0) + Math.round(share * 100);
    }
  }

  return Object.fromEntries(memberIds.map((memberId) => [memberId, roundMoney((centsByMember[memberId] ?? 0) / 100)]));
}

export function expenseSplitsToMinor(splits: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(splits).map(([memberId, share]) => [memberId, Math.round(share * 100)]));
}

export function normalizeExpenseSplitsFromMinor(splits: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(splits).map(([memberId, shareMinor]) => [memberId, roundMoney(shareMinor / 100)]));
}

export function normalizeExpenseRepeatCount(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return 1;
  return Math.min(31, Math.max(1, Math.floor(value)));
}

export function repeatExpenseLineItems(
  lineItems: ExpenseLineItem[] | undefined,
  repeatIndex: number,
  repeatCount: number,
): ExpenseLineItem[] | undefined {
  if (!lineItems) return undefined;
  if (repeatCount <= 1) return lineItems;
  return lineItems.map((lineItem) => ({
    ...lineItem,
    id: `${lineItem.id}-repeat-${repeatIndex + 1}`,
  }));
}

export function buildExpenseCreateDrafts(input: ExpenseInputLike, memberIds: string[]): ExpenseCreateDraft[] {
  const repeatCount = normalizeExpenseRepeatCount(input.repeatCount);
  const splits =
    input.splits ??
    buildExpenseSplits({
      amount: input.amount,
      memberIds,
      mode: "equal",
    });

  return Array.from({ length: repeatCount }, (_, index) => ({
    ...input,
    title:
      repeatCount > 1
        ? `${input.title} (${index + 1}/${repeatCount})`
        : input.title,
    lineItems: repeatExpenseLineItems(input.lineItems, index, repeatCount),
    splits,
  }));
}

export function appendLocalExpensesToTrip<T extends Pick<Trip, "id" | "expenses" | "itineraryItems" | "mainTripPlanId" | "activePlanVariantId">>(
  trip: T,
  drafts: ExpenseCreateDraft[],
  options: AppendLocalExpensesOptions<T>,
): T {
  const expenses = [...trip.expenses];

  for (const draft of drafts) {
    expenses.push({
      id: options.nextExpenseId(expenses),
      tripId: trip.id,
      title: draft.title,
      amount: draft.amount,
      amountMinor: Math.round(draft.amount * 100),
      currency: draft.currency ?? "HKD",
      exchangeRateToSettlementCurrency:
        draft.exchangeRateToSettlementCurrency ?? 1,
      notes: draft.notes ?? "",
      receiptUrl: draft.receiptUrl ?? null,
      lineItems: draft.lineItems ?? [],
      comments: draft.comments ?? [],
      tripPlanId: options.resolveTripPlanId(
        trip,
        draft.itemId,
        draft.tripPlanId ?? options.selectedTripPlanId,
      ),
      paidBy: draft.paidBy,
      category: draft.category,
      splits: draft.splits,
      itineraryItemId: draft.itemId,
      version: 1,
    });
  }

  return { ...trip, expenses };
}

export function appendExpensesToTrip<T extends Pick<Trip, "expenses">>(
  trip: T,
  expenses: Expense[],
): T {
  return {
    ...trip,
    expenses: [...trip.expenses, ...expenses],
  };
}

export function buildCreateExpenseRequest(
  draft: ExpenseCreateDraft,
  options: BuildCreateExpenseRequestOptions,
): CreateExpenseApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    title: draft.title,
    amountMinor: Math.round(draft.amount * 100),
    currency: draft.currency ?? "HKD",
    exchangeRateToSettlementCurrency:
      draft.exchangeRateToSettlementCurrency ?? 1,
    notes: draft.notes ?? "",
    receiptUrl: draft.receiptUrl ?? null,
    lineItems: draft.lineItems,
    comments: draft.comments ?? [],
    tripPlanId: options.tripPlanId,
    paidBy: draft.paidBy,
    category: draft.category,
    splits: expenseSplitsToMinor(draft.splits),
    itineraryItemId: draft.itemId,
  };
}

export function buildPatchExpenseRequest(
  draft: ExpenseUpdateDraft,
  options: BuildPatchExpenseRequestOptions,
): PatchExpenseApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    expectedVersion: options.expectedVersion,
    title: draft.title,
    amountMinor: draft.amountMinor,
    currency: draft.currency,
    exchangeRateToSettlementCurrency:
      draft.exchangeRateToSettlementCurrency,
    notes: draft.notes,
    receiptUrl: draft.receiptUrl,
    lineItems: draft.lineItems,
    comments: draft.comments,
    tripPlanId: draft.tripPlanId,
    paidBy: draft.paidBy,
    category: draft.category,
    splits: expenseSplitsToMinor(draft.splits),
    itineraryItemId: draft.itineraryItemId,
  };
}

export function buildExpenseUpdateDraft<
  T extends Pick<Trip, "members" | "itineraryItems" | "mainTripPlanId" | "activePlanVariantId">,
>(
  trip: T,
  existing: Expense,
  input: ExpenseUpdateInputLike,
  options: BuildExpenseUpdateDraftOptions<T>,
): ExpenseUpdateDraft {
  const amountMinor = Math.round(input.amount * 100);
  const splits =
    input.splits ??
    buildExpenseSplits({
      amount: input.amount,
      memberIds: trip.members.map((member) => member.id),
      mode: "equal",
    });
  const itineraryItemId =
    input.itemId === undefined
      ? (existing.itineraryItemId ?? null)
      : input.itemId;
  const tripPlanId = options.resolveTripPlanId(
    trip,
    itineraryItemId,
    input.tripPlanId ?? existing.tripPlanId ?? options.selectedTripPlanId,
  );

  return {
    expenseId: input.expenseId,
    title: input.title,
    amount: input.amount,
    amountMinor,
    currency: input.currency ?? existing.currency ?? "HKD",
    exchangeRateToSettlementCurrency:
      input.exchangeRateToSettlementCurrency ??
      existing.exchangeRateToSettlementCurrency ??
      1,
    notes: input.notes ?? existing.notes ?? "",
    receiptUrl: input.receiptUrl ?? existing.receiptUrl ?? null,
    lineItems: input.lineItems ?? existing.lineItems ?? [],
    comments: input.comments ?? existing.comments ?? [],
    tripPlanId,
    paidBy: input.paidBy,
    category: input.category,
    splits,
    itineraryItemId,
  };
}

export function replaceExpenseInTrip<T extends Pick<Trip, "expenses">>(
  trip: T,
  expense: Expense,
): T {
  return {
    ...trip,
    expenses: trip.expenses.map((candidate) =>
      candidate.id === expense.id ? expense : candidate,
    ),
  };
}

export function updateLocalExpenseInTrip<T extends Pick<Trip, "expenses">>(
  trip: T,
  draft: ExpenseUpdateDraft,
): T {
  return {
    ...trip,
    expenses: trip.expenses.map((expense) =>
      expense.id === draft.expenseId
        ? {
            ...expense,
            title: draft.title,
            amount: draft.amount,
            amountMinor: draft.amountMinor,
            currency: draft.currency,
            exchangeRateToSettlementCurrency:
              draft.exchangeRateToSettlementCurrency,
            notes: draft.notes,
            receiptUrl: draft.receiptUrl,
            lineItems: draft.lineItems,
            comments: draft.comments,
            tripPlanId: draft.tripPlanId,
            paidBy: draft.paidBy,
            category: draft.category,
            splits: draft.splits,
            itineraryItemId: draft.itineraryItemId,
            version: (expense.version ?? 1) + 1,
          }
        : expense,
    ),
  };
}

export function removeExpenseFromTrip<T extends Pick<Trip, "expenses">>(
  trip: T,
  expenseId: string,
): T {
  return {
    ...trip,
    expenses: trip.expenses.filter((expense) => expense.id !== expenseId),
  };
}

export function buildExpenseSummary(
  expenses: Expense[],
  currentMemberId: string,
  reminders: ExpenseReminder[] = [],
  options: BuildExpenseSummaryOptions = {},
): ExpenseSummary {
  const settlementCurrency = normalizeCurrency(options.settlementCurrency ?? "HKD");
  const memberIds = Array.from(new Set(expenses.flatMap((expense) => [expense.paidBy, ...Object.keys(expense.splits)])));
  const netByMember = Object.fromEntries(memberIds.map((id) => [id, 0]));
  let groupSpend = 0;

  for (const expense of expenses) {
    const exchangeRate = expenseExchangeRate(expense, settlementCurrency, options.exchangeRates);
    const settlementAmount = convertToSettlementCurrency(expense.amount, exchangeRate);
    if (expense.category !== "settlement") groupSpend += settlementAmount;
    netByMember[expense.paidBy] = roundMoney(netByMember[expense.paidBy] + settlementAmount);
    for (const [memberId, share] of Object.entries(expense.splits)) {
      netByMember[memberId] = roundMoney(netByMember[memberId] - convertToSettlementCurrency(share, exchangeRate));
    }
  }

  const currentNet = roundMoney(netByMember[currentMemberId] ?? 0);
  return {
    groupSpend: roundMoney(groupSpend),
    settlementCurrency,
    netByMember,
    currentUserNetLabel:
      currentNet > 0 ? `You are owed ${formatMoney(currentNet, settlementCurrency)}` : currentNet < 0 ? `You owe ${formatMoney(Math.abs(currentNet), settlementCurrency)}` : "You are settled",
    settlementSuggestions: attachReminderHistory(buildSettlementSuggestions(netByMember, settlementCurrency), reminders),
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

export function recordLocalExpenseReminderInTrip<T extends Pick<Trip, "expenseReminders">>(
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

export function upsertExpenseReminder(reminders: ExpenseReminder[], reminder: ExpenseReminder): ExpenseReminder[] {
  const reminderKey = expenseReminderKey(reminder);
  const nextReminders = reminders.filter((candidate) => expenseReminderKey(candidate) !== reminderKey);
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

function buildSettlementSuggestions(netByMember: Record<string, number>, settlementCurrency: string): SettlementSuggestion[] {
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
    const cents = Math.min(debtors[debtorIndex].cents, creditors[creditorIndex].cents);
    suggestions.push({ from: debtors[debtorIndex].id, to: creditors[creditorIndex].id, amount: cents / 100, currency: settlementCurrency });
    debtors[debtorIndex].cents -= cents;
    creditors[creditorIndex].cents -= cents;
    if (debtors[debtorIndex].cents === 0) debtorIndex += 1;
    if (creditors[creditorIndex].cents === 0) creditorIndex += 1;
  }

  return suggestions;
}

function attachReminderHistory(suggestions: SettlementSuggestion[], reminders: ExpenseReminder[]): SettlementSuggestion[] {
  const remindersByKey = new Map(reminders.map((reminder) => [expenseReminderKey(reminder), reminder]));
  return suggestions.map((suggestion) => {
    const reminder = remindersByKey.get(expenseReminderKey(suggestion));
    return reminder ? { ...suggestion, lastRemindedAt: reminder.lastRemindedAt } : suggestion;
  });
}

function expenseReminderKey(input: Pick<ExpenseReminder, "tripPlanId" | "from" | "to" | "amount">): string {
  return `${input.tripPlanId ?? ""}|${input.from}|${input.to}|${Math.round(input.amount * 100)}`;
}

function allocateCentsByWeight(memberIds: string[], totalCents: number, weights: number[]): Record<string, number> {
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  if (weightTotal <= 0 || totalCents <= 0) return Object.fromEntries(memberIds.map((memberId) => [memberId, 0]));

  const rawShares = memberIds.map((memberId, index) => {
    const raw = totalCents * (weights[index] / weightTotal);
    const cents = Math.floor(raw);
    return { memberId, cents, remainder: raw - cents };
  });
  let remaining = totalCents - rawShares.reduce((sum, share) => sum + share.cents, 0);
  const byRemainder = [...rawShares].sort((a, b) => b.remainder - a.remainder);
  for (const share of byRemainder) {
    if (remaining <= 0) break;
    share.cents += 1;
    remaining -= 1;
  }

  return Object.fromEntries(rawShares.map((share) => [share.memberId, roundMoney(share.cents / 100)]));
}

function allocateCentsByRawShares(memberIds: string[], rawCentsByMember: number[]): Record<string, number> {
  const rawShares = memberIds.map((memberId, index) => {
    const rawCents = Math.max(0, rawCentsByMember[index] ?? 0);
    const cents = Math.floor(rawCents);
    return { memberId, cents, remainder: rawCents - cents };
  });
  let remaining = Math.round(rawCentsByMember.reduce((sum, rawCents) => sum + Math.max(0, rawCents), 0)) - rawShares.reduce((sum, share) => sum + share.cents, 0);
  const byRemainder = [...rawShares].sort((a, b) => b.remainder - a.remainder);
  for (const share of byRemainder) {
    if (remaining <= 0) break;
    share.cents += 1;
    remaining -= 1;
  }

  return Object.fromEntries(rawShares.map((share) => [share.memberId, roundMoney(share.cents / 100)]));
}
