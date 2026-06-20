import { useCallback, useState, type FormEvent } from "react";
import { normalizeCurrencyCode } from "@/src/trip/currencies";
import type { Expense, Member, Trip } from "@/src/trip/types";
import {
  calculateExpenseDialogState,
  canSubmitExpenseDialog,
  initialExpenseTripPlanId,
} from "../expense-dialog-support";
import type { ExpenseInput, ExpenseUpdateInput } from "../expense-page-types";
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
  onCreateExpense: (input: ExpenseInput) => void | Promise<void>;
  onUpdateExpense: (input: ExpenseUpdateInput) => void | Promise<void>;
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
  const linkedItem = itemId
    ? (trip.itineraryItems.find((item) => item.id === itemId) ?? null)
    : null;
  const effectiveTripPlanId = linkedItem?.planVariantId ?? tripPlanId;
  const tripPlanOptions = trip.tripPlans ?? trip.planVariants;

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
    const nextLinkedItem = nextItemId
      ? trip.itineraryItems.find((item) => item.id === nextItemId)
      : null;
    if (nextLinkedItem?.planVariantId) {
      setTripPlanId(nextLinkedItem.planVariantId);
    }
  }

  async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!canSubmitExpense) return;
    const input: ExpenseInput = {
      itemId: itemId || null,
      tripPlanId: effectiveTripPlanId || null,
      title: trimmedTitle,
      amount: calculatedState.amountNumber,
      currency: calculatedState.normalizedCurrency,
      exchangeRateToSettlementCurrency: calculatedState.needsExchangeRate
        ? calculatedState.exchangeRateNumber
        : 1,
      paidBy,
      category,
      splits: calculatedState.splits,
    };
    if (notes.trim()) input.notes = notes.trim();
    if (receiptUrl.trim()) input.receiptUrl = receiptUrl.trim();
    if (splitEditor.splitMode === "itemized") {
      input.lineItems = calculatedState.validLineItems;
    }
    if (comments.length) input.comments = comments;
    setIsSaving(true);
    try {
      if (expense) {
        await onUpdateExpense({ ...input, expenseId: expense.id });
        return;
      }
      if (calculatedState.repeatCountNumber > 1) {
        input.repeatCount = calculatedState.repeatCountNumber;
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
