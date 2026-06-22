import { useCallback, useState, type FormEvent } from "react";
import type { Expense, Member, Trip } from "@/src/trip/types";
import {
  calculateExpenseDialogState,
} from "../model/expense-dialog-calculation";
import {
  expenseDialogEffectiveTripPlanId,
  expenseDialogItemSelectionFields,
  expenseDialogLinkedItem,
  expenseDialogTripPlanOptions,
} from "../model/expense-dialog-linking";
import {
  expenseDialogCurrencyChangeFields,
  expenseDialogManualExchangeRateFields,
} from "../model/expense-dialog-currency";
import { canSubmitExpenseDialog } from "../model/expense-dialog-submit-guard";
import {
  initialExpenseDialogFields,
  initialExpenseTripPlanId,
} from "../model/expense-dialog-initial-state";
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
  const initialFields = initialExpenseDialogFields({
    currentMemberId: currentMember.id,
    expense,
  });
  const [title, setTitle] = useState(initialFields.title);
  const [amount, setAmount] = useState(initialFields.amount);
  const [currency, setCurrency] = useState(initialFields.currency);
  const [exchangeRate, setExchangeRate] = useState(initialFields.exchangeRate);
  const [exchangeRateTouched, setExchangeRateTouched] = useState(
    initialFields.exchangeRateTouched,
  );
  const [notes, setNotes] = useState(initialFields.notes);
  const [receiptUrl, setReceiptUrl] = useState(initialFields.receiptUrl);
  const {
    addComment,
    commentDraft,
    comments,
    setCommentDraft,
  } = useExpenseComments({ currentMember, expense });
  const [isSaving, setIsSaving] = useState(false);
  const [repeatCount, setRepeatCount] = useState(initialFields.repeatCount);
  const [paidBy, setPaidBy] = useState(initialFields.paidBy);
  const [category, setCategory] = useState<Expense["category"]>(
    initialFields.category,
  );
  const [itemId, setItemId] = useState(initialFields.itemId);
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
    const nextFields = expenseDialogCurrencyChangeFields(nextCurrency);
    setCurrency(nextFields.currency);
    setExchangeRateTouched(nextFields.exchangeRateTouched);
    setExchangeRate(nextFields.exchangeRate);
  }

  function changeExchangeRate(nextExchangeRate: string) {
    const nextFields = expenseDialogManualExchangeRateFields(nextExchangeRate);
    setExchangeRateTouched(nextFields.exchangeRateTouched);
    setExchangeRate(nextFields.exchangeRate);
  }

  function changeItemId(nextItemId: string) {
    const nextFields = expenseDialogItemSelectionFields({
      currentTripPlanId: tripPlanId,
      itemId: nextItemId,
      trip,
    });
    setItemId(nextFields.itemId);
    setTripPlanId(nextFields.tripPlanId);
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
