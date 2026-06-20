import {
  buildExpenseSplits,
  buildItemizedExpenseSplits,
  type ExpenseSplitMode,
} from "@/src/trip/expenses";
import { normalizeCurrencyCode, type MajorCurrencyCode } from "@/src/trip/currencies";
import type { Expense, ExpenseLineItem, Member, Trip } from "@/src/trip/types";
import { sumShares } from "./expense-page-support";

export interface EditableExpenseLineItem {
  id: string;
  title: string;
  amount: string;
  participantIds: string[];
}

interface ExpenseDialogStateInput {
  amount: string;
  currency: string;
  exchangeRate: string;
  expense: Expense | null;
  lineItems: EditableExpenseLineItem[];
  members: Member[];
  repeatCount: string;
  settlementCurrency: string;
  splitMode: ExpenseSplitMode;
  splitValues: Record<string, string>;
}

export interface ExpenseDialogCalculatedState {
  amountNumber: number;
  exchangeRateNumber: number;
  hasValidExchangeRate: boolean;
  hasValidRepeatCount: boolean;
  invalidItemizedLines: boolean;
  needsExchangeRate: boolean;
  normalizedCurrency: MajorCurrencyCode;
  repeatCountNumber: number;
  splitMismatch: boolean;
  splitTotal: number;
  splits: Record<string, number>;
  validLineItems: ExpenseLineItem[];
}

interface ExpenseDialogSubmitGuardInput {
  isSaving: boolean;
  state: ExpenseDialogCalculatedState;
  title: string;
}

export function emptyExpenseLineItem(members: Member[], index: number): EditableExpenseLineItem {
  return {
    id: `line-${Date.now().toString(36)}-${index}`,
    title: "",
    amount: "",
    participantIds: members.map((member) => member.id),
  };
}

export function initialExpenseLineItems(expense: Expense | null, members: Member[]): EditableExpenseLineItem[] {
  if (!expense?.lineItems?.length) {
    return [emptyExpenseLineItem(members, 1)];
  }

  return expense.lineItems.map((lineItem) => ({
    ...lineItem,
    amount: String(lineItem.amount),
    participantIds: lineItem.participantIds.filter((memberId) => members.some((member) => member.id === memberId)),
  }));
}

export function initialExpenseSplitValues(members: Member[], expense: Expense | null): Record<string, string> {
  return Object.fromEntries(members.map((member) => [member.id, expense ? String(expense.splits[member.id] ?? 0) : "0"]));
}

export function expenseSplitValuesForMode(members: Member[], value: "0" | "1"): Record<string, string> {
  return Object.fromEntries(members.map((member) => [member.id, value]));
}

export function initialExpenseTripPlanId({
  expense,
  selectedTripPlanId,
  trip,
}: {
  expense: Expense | null;
  selectedTripPlanId?: string | null;
  trip: Trip;
}): string {
  return (
    expense?.tripPlanId ??
    selectedTripPlanId ??
    trip.mainTripPlanId ??
    trip.activePlanVariantId ??
    trip.tripPlans?.[0]?.id ??
    trip.planVariants[0]?.id ??
    ""
  );
}

export function parseExpenseLineItems(lineItems: EditableExpenseLineItem[]): ExpenseLineItem[] {
  return lineItems.map((lineItem, index) => ({
    id: lineItem.id || `line-${index + 1}`,
    title: lineItem.title.trim(),
    amount: Number(lineItem.amount || 0),
    participantIds: lineItem.participantIds,
  }));
}

export function validExpenseLineItems(lineItems: ExpenseLineItem[]): ExpenseLineItem[] {
  return lineItems.filter((lineItem) => lineItem.title && Number.isFinite(lineItem.amount) && lineItem.amount > 0 && lineItem.participantIds.length > 0);
}

export function calculateExpenseDialogState({
  amount,
  currency,
  exchangeRate,
  expense,
  lineItems,
  members,
  repeatCount,
  settlementCurrency,
  splitMode,
  splitValues,
}: ExpenseDialogStateInput): ExpenseDialogCalculatedState {
  const amountNumber = Number(amount);
  const exchangeRateNumber = Number(exchangeRate);
  const repeatCountNumber = Number(repeatCount);
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const needsExchangeRate = normalizedCurrency !== normalizeCurrencyCode(settlementCurrency);
  const hasValidExchangeRate = !needsExchangeRate || (Number.isFinite(exchangeRateNumber) && exchangeRateNumber > 0);
  const hasValidRepeatCount = Boolean(expense) || (Number.isInteger(repeatCountNumber) && repeatCountNumber >= 1 && repeatCountNumber <= 31);
  const memberIds = members.map((member) => member.id);
  const parsedSplitValues = Object.fromEntries(members.map((member) => [member.id, Number(splitValues[member.id] || 0)]));
  const parsedLineItems = parseExpenseLineItems(lineItems);
  const validLineItems = validExpenseLineItems(parsedLineItems);
  const splits = Number.isFinite(amountNumber) && amountNumber >= 0
    ? splitMode === "itemized"
      ? buildItemizedExpenseSplits({ lineItems: validLineItems, memberIds })
      : buildExpenseSplits({ amount: amountNumber, memberIds, mode: splitMode, valuesByMember: parsedSplitValues })
    : {};
  const splitTotal = sumShares(splits);
  const splitMismatch = (splitMode === "exact" || splitMode === "percentage" || splitMode === "itemized") && Math.abs(splitTotal - amountNumber) > 0.01;
  const invalidItemizedLines = splitMode === "itemized" && (!validLineItems.length || validLineItems.length !== lineItems.length);

  return {
    amountNumber,
    exchangeRateNumber,
    hasValidExchangeRate,
    hasValidRepeatCount,
    invalidItemizedLines,
    needsExchangeRate,
    normalizedCurrency,
    repeatCountNumber,
    splitMismatch,
    splitTotal,
    splits,
    validLineItems,
  };
}

export function canSubmitExpenseDialog({ isSaving, state, title }: ExpenseDialogSubmitGuardInput): boolean {
  return (
    !isSaving
    && Boolean(title.trim())
    && Number.isFinite(state.amountNumber)
    && state.amountNumber > 0
    && !state.splitMismatch
    && state.hasValidExchangeRate
    && !state.invalidItemizedLines
    && state.hasValidRepeatCount
  );
}
