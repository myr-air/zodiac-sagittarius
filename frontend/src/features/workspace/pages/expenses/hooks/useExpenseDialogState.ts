import { useCallback, type FormEvent } from "react";
import type { Expense, Member, Trip } from "@/src/trip/types";
import {
  calculateExpenseDialogState,
} from "../model/expense-dialog-calculation";
import { canSubmitExpenseDialog } from "../model/expense-dialog-submit-guard";
import { submitExpenseDialog } from "../model/expense-dialog-submit-action";
import { buildExpenseDialogSubmitInput } from "../model/expense-dialog-submit-input";
import type {
  CreateExpenseHandler,
  UpdateExpenseHandler,
} from "../model/expense-page-types";
import { useExpenseComments } from "./useExpenseComments";
import { useExpenseDialogFormValues } from "./useExpenseDialogFormValues";
import { useExpenseDialogLinkingState } from "./useExpenseDialogLinkingState";
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
  const splitEditor = useExpenseSplitEditor({ expense, members: trip.members });
  const linkingState = useExpenseDialogLinkingState({
    expense,
    itemId: formValues.itemId,
    selectedTripPlanId,
    setItemId: (itemId) => setFormValue("itemId", itemId),
    trip,
  });
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
    isSaving: linkingState.isSaving,
    state: calculatedState,
    title: formValues.title,
  });

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

  async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmitExpense) return;
    const input = buildExpenseDialogSubmitInput({
      calculatedState,
      category: formValues.category,
      comments,
      effectiveTripPlanId: linkingState.effectiveTripPlanId,
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
      setSaving: linkingState.setSaving,
    });
  }

  return {
    amount: formValues.amount,
    calculatedState,
    canSubmitExpense,
    category: formValues.category,
    changeCurrency,
    changeExchangeRate,
    changeItemId: linkingState.changeItemId,
    commentDraft,
    comments,
    currency: formValues.currency,
    effectiveTripPlanId: linkingState.effectiveTripPlanId,
    exchangeRate: formValues.exchangeRate,
    itemId: formValues.itemId,
    linkedItem: linkingState.linkedItem,
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
    setTripPlanId: linkingState.setTripPlanId,
    splitEditor,
    submitExpense,
    title: formValues.title,
    tripPlanOptions: linkingState.tripPlanOptions,
    addComment,
  };
}
