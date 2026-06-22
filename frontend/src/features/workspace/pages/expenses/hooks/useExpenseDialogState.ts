import { useCallback, useState, type FormEvent } from "react";
import { normalizeCurrencyCode } from "@/src/trip/currencies";
import type { Expense, Member, Trip } from "@/src/trip/types";
import {
  calculateExpenseDialogState,
} from "../model/expense-dialog-calculation";
import {
  expenseDialogEffectiveTripPlanId,
  expenseDialogLinkedItem,
  expenseDialogTripPlanIdForItemSelection,
  expenseDialogTripPlanOptions,
} from "../model/expense-dialog-linking";
import { canSubmitExpenseDialog } from "../model/expense-dialog-submit-guard";
import { initialExpenseTripPlanId } from "../model/expense-dialog-initial-state";
import { buildExpenseDialogSubmitInput } from "../model/expense-dialog-submit-input";
import type {
  CreateExpenseHandler,
  UpdateExpenseHandler,
} from "../model/expense-page-types";
import { useExpenseComments } from "./useExpenseComments";
import { useExpenseExchangeRateAutofill } from "./useExpenseExchangeRateAutofill";
import { useExpenseSplitEditor } from "./useExpenseSplitEditor";

interface ExpenseDialogStateInput {
  apiBaseUrl: string;
  currentMember: Member;
  expense: Expense | null;
  selectedTripPlanId?: string | null;
  settlementCurrency: string;
  trip: Trip;
  onCreateExpense: CreateExpenseHandler;
  onUpdateExpense: UpdateExpenseHandler;
}

export function useExpenseDialogState({
  apiBaseUrl,
  currentMember,
  expense,
  selectedTripPlanId,
  settlementCurrency,
  trip,
  onCreateExpense,
  onUpdateExpense,
}: ExpenseDialogStateInput) {
  const [title, setTitle] = useState(expense?.title ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [currency, setCurrency] = useState(
    normalizeCurrencyCode(expense?.currency ?? "HKD"),
  );
  const [exchangeRate, setExchangeRate] = useState(
    expense?.exchangeRateToSettlementCurrency
      ? String(expense.exchangeRateToSettlementCurrency)
      : "1",
  );
  const [exchangeRateTouched, setExchangeRateTouched] = useState(
    Boolean(expense?.exchangeRateToSettlementCurrency),
  );
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [receiptUrl, setReceiptUrl] = useState(expense?.receiptUrl ?? "");
  const {
    addComment,
    commentDraft,
    comments,
    setCommentDraft,
  } = useExpenseComments({ currentMember, expense });
  const [isSaving, setIsSaving] = useState(false);
  const [repeatCount, setRepeatCount] = useState("1");
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? currentMember.id);
  const [category, setCategory] = useState<Expense["category"]>(
    expense?.category ?? "transport",
  );
  const [itemId, setItemId] = useState(expense?.itineraryItemId ?? "");
  const [tripPlanId, setTripPlanId] = useState(
    initialExpenseTripPlanId({ expense, selectedTripPlanId, trip }),
  );
  const splitEditor = useExpenseSplitEditor({ expense, members: trip.members });
  const calculatedState = calculateExpenseDialogState({
    amount,
    currency,
    exchangeRate,
    expense,
    lineItems: splitEditor.lineItems,
    members: trip.members,
    repeatCount,
    settlementCurrency,
    splitMode: splitEditor.splitMode,
    splitValues: splitEditor.splitValues,
  });
  const canSubmitExpense = canSubmitExpenseDialog({
    isSaving,
    state: calculatedState,
    title,
  });
  const linkedItem = expenseDialogLinkedItem(trip, itemId);
  const effectiveTripPlanId = expenseDialogEffectiveTripPlanId({
    linkedItem,
    tripPlanId,
  });
  const tripPlanOptions = expenseDialogTripPlanOptions(trip);

  const autofillExchangeRate = useCallback((nextExchangeRate: string) => {
    setExchangeRate(nextExchangeRate);
  }, []);
  useExpenseExchangeRateAutofill({
    apiBaseUrl,
    exchangeRateTouched,
    needsExchangeRate: calculatedState.needsExchangeRate,
    normalizedCurrency: calculatedState.normalizedCurrency,
    settlementCurrency,
    onExchangeRateChange: autofillExchangeRate,
  });

  function changeCurrency(nextCurrency: string) {
    setCurrency(normalizeCurrencyCode(nextCurrency));
    setExchangeRateTouched(false);
    setExchangeRate("1");
  }

  function changeExchangeRate(nextExchangeRate: string) {
    setExchangeRateTouched(true);
    setExchangeRate(nextExchangeRate);
  }

  function changeItemId(nextItemId: string) {
    setItemId(nextItemId);
    const nextTripPlanId = expenseDialogTripPlanIdForItemSelection(trip, nextItemId);
    if (nextTripPlanId) setTripPlanId(nextTripPlanId);
  }

  async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmitExpense) return;
    const input = buildExpenseDialogSubmitInput({
      calculatedState,
      category,
      comments,
      effectiveTripPlanId,
      expense,
      itemId,
      notes,
      paidBy,
      receiptUrl,
      splitMode: splitEditor.splitMode,
      title,
    });
    setIsSaving(true);
    try {
      if (expense) {
        await onUpdateExpense({ ...input, expenseId: expense.id });
        return;
      }
      await onCreateExpense(input);
    } finally {
      setIsSaving(false);
    }
  }

  return {
    amount,
    calculatedState,
    canSubmitExpense,
    category,
    changeCurrency,
    changeExchangeRate,
    changeItemId,
    commentDraft,
    comments,
    currency,
    effectiveTripPlanId,
    exchangeRate,
    itemId,
    linkedItem,
    notes,
    paidBy,
    receiptUrl,
    repeatCount,
    setAmount,
    setCategory,
    setCommentDraft,
    setNotes,
    setPaidBy,
    setReceiptUrl,
    setRepeatCount,
    setTitle,
    setTripPlanId,
    splitEditor,
    submitExpense,
    title,
    tripPlanOptions,
    addComment,
  };
}
