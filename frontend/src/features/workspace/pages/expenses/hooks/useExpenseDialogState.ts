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
import { canSubmitExpenseDialog } from "../model/expense-dialog-submit-guard";
import {
  initialExpenseDialogUiState,
  setExpenseDialogSaving,
  updateExpenseDialogTripPlanId,
} from "../model/expense-dialog-ui-state";
import { submitExpenseDialog } from "../model/expense-dialog-submit-action";
import { buildExpenseDialogSubmitInput } from "../model/expense-dialog-submit-input";
import type {
  CreateExpenseHandler,
  UpdateExpenseHandler,
} from "../model/expense-page-types";
import { useExpenseComments } from "./useExpenseComments";
import { useExpenseDialogFormValues } from "./useExpenseDialogFormValues";
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
  const {
    changeCurrency,
    changeExchangeRate,
    formValues,
    setAmount,
    setCategory,
    setExchangeRate,
    setFormValue,
    setNotes,
    setPaidBy,
    setReceiptUrl,
    setRepeatCount,
    setTitle,
  } = useExpenseDialogFormValues({
    currentMemberId: currentMember.id,
    expense,
  });
  const {
    addComment,
    commentDraft,
    comments,
    setCommentDraft,
  } = useExpenseComments({ currentMember, expense });
  const [uiState, setUiState] = useState(() =>
    initialExpenseDialogUiState({ expense, selectedTripPlanId, trip }),
  );
  const splitEditor = useExpenseSplitEditor({ expense, members: trip.members });
  const calculatedState = calculateExpenseDialogState({
    amount: formValues.amount,
    currency: formValues.currency,
    exchangeRate: formValues.exchangeRate,
    expense,
    lineItems: splitEditor.lineItems,
    members: trip.members,
    repeatCount: formValues.repeatCount,
    settlementCurrency,
    splitMode: splitEditor.splitMode,
    splitValues: splitEditor.splitValues,
  });
  const canSubmitExpense = canSubmitExpenseDialog({
    isSaving: uiState.isSaving,
    state: calculatedState,
    title: formValues.title,
  });
  const linkedItem = expenseDialogLinkedItem(trip, formValues.itemId);
  const effectiveTripPlanId = expenseDialogEffectiveTripPlanId({
    linkedItem,
    tripPlanId: uiState.tripPlanId,
  });
  const tripPlanOptions = expenseDialogTripPlanOptions(trip);

  const autofillExchangeRate = useCallback((nextExchangeRate: string) => {
    setExchangeRate(nextExchangeRate);
  }, [setExchangeRate]);
  useExpenseExchangeRateAutofill({
    apiBaseUrl,
    exchangeRateTouched: formValues.exchangeRateTouched,
    needsExchangeRate: calculatedState.needsExchangeRate,
    normalizedCurrency: calculatedState.normalizedCurrency,
    settlementCurrency,
    onExchangeRateChange: autofillExchangeRate,
  });

  function changeItemId(nextItemId: string) {
    const nextFields = expenseDialogItemSelectionFields({
      currentTripPlanId: uiState.tripPlanId,
      itemId: nextItemId,
      trip,
    });
    setFormValue("itemId", nextFields.itemId);
    setUiState((current) =>
      updateExpenseDialogTripPlanId(current, nextFields.tripPlanId),
    );
  }

  async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmitExpense) return;
    const input = buildExpenseDialogSubmitInput({
      calculatedState,
      category: formValues.category,
      comments,
      effectiveTripPlanId,
      expense,
      itemId: formValues.itemId,
      notes: formValues.notes,
      paidBy: formValues.paidBy,
      receiptUrl: formValues.receiptUrl,
      splitMode: splitEditor.splitMode,
      title: formValues.title,
    });
    await submitExpenseDialog({
      canSubmitExpense,
      expense,
      input,
      onCreateExpense,
      onUpdateExpense,
      setSaving: (isSaving) =>
        setUiState((current) => setExpenseDialogSaving(current, isSaving)),
    });
  }

  return {
    amount: formValues.amount,
    calculatedState,
    canSubmitExpense,
    category: formValues.category,
    changeCurrency,
    changeExchangeRate,
    changeItemId,
    commentDraft,
    comments,
    currency: formValues.currency,
    effectiveTripPlanId,
    exchangeRate: formValues.exchangeRate,
    itemId: formValues.itemId,
    linkedItem,
    notes: formValues.notes,
    paidBy: formValues.paidBy,
    receiptUrl: formValues.receiptUrl,
    repeatCount: formValues.repeatCount,
    setAmount,
    setCategory,
    setCommentDraft,
    setNotes,
    setPaidBy,
    setReceiptUrl,
    setRepeatCount,
    setTitle,
    setTripPlanId: (tripPlanId: string) =>
      setUiState((current) =>
        updateExpenseDialogTripPlanId(current, tripPlanId),
      ),
    splitEditor,
    submitExpense,
    title: formValues.title,
    tripPlanOptions,
    addComment,
  };
}
