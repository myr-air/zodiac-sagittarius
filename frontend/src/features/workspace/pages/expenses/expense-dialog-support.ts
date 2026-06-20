import {
  buildExpenseSplits,
  buildItemizedExpenseSplits,
  sumShares,
  type ExpenseSplitMode,
} from "@/src/trip/expenses";
import {
  normalizeCurrencyCode,
  type MajorCurrencyCode,
} from "@/src/trip/currencies";
import type { Expense, ExpenseLineItem, Member } from "@/src/trip/types";
import {
  parseExpenseLineItems,
  type EditableExpenseLineItem,
  validExpenseLineItems,
} from "./expense-dialog-line-items";

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
