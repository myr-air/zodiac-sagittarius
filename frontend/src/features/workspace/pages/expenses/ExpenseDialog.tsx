import { type FormEvent, useCallback, useState } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { normalizeCurrencyCode } from "@/src/trip/currencies";
import type { Expense, ExpenseComment, Member, Trip } from "@/src/trip/types";
import { Button, IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { ExpenseCommentsSection } from "./components/ExpenseCommentsSection";
import { ExpenseDetailsFields } from "./components/ExpenseDetailsFields";
import { ExpenseDialogSummary } from "./components/ExpenseDialogSummary";
import { ExpenseSplitFields } from "./components/ExpenseSplitFields";
import { useExpenseExchangeRateAutofill } from "./hooks/useExpenseExchangeRateAutofill";
import { useExpenseSplitEditor } from "./hooks/useExpenseSplitEditor";
import * as expenseStyles from "./TripExpensesPage.styles";
import {
  calculateExpenseDialogState,
  canSubmitExpenseDialog,
  initialExpenseTripPlanId,
} from "./expense-dialog-support";
import type { ExpenseInput, ExpenseUpdateInput } from "./expense-page-types";

interface ExpenseDialogProps {
  expense: Expense | null;
  trip: Trip;
  currentMember: Member;
  settlementCurrency: string;
  selectedTripPlanId?: string | null;
  apiBaseUrl: string;
  onClose: () => void;
  onCreateExpense: (input: ExpenseInput) => void | Promise<void>;
  onUpdateExpense: (input: ExpenseUpdateInput) => void | Promise<void>;
}

export function ExpenseDialog({
  expense,
  trip,
  currentMember,
  settlementCurrency,
  selectedTripPlanId,
  apiBaseUrl,
  onClose,
  onCreateExpense,
  onUpdateExpense,
}: ExpenseDialogProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState(expense?.title ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [currency, setCurrency] = useState(normalizeCurrencyCode(expense?.currency ?? "HKD"));
  const [exchangeRate, setExchangeRate] = useState(expense?.exchangeRateToSettlementCurrency ? String(expense.exchangeRateToSettlementCurrency) : "1");
  const [exchangeRateTouched, setExchangeRateTouched] = useState(Boolean(expense?.exchangeRateToSettlementCurrency));
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [receiptUrl, setReceiptUrl] = useState(expense?.receiptUrl ?? "");
  const [comments, setComments] = useState<ExpenseComment[]>(expense?.comments ?? []);
  const [commentDraft, setCommentDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [repeatCount, setRepeatCount] = useState("1");
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? currentMember.id);
  const [category, setCategory] = useState<Expense["category"]>(expense?.category ?? "transport");
  const [itemId, setItemId] = useState(expense?.itineraryItemId ?? "");
  const [tripPlanId, setTripPlanId] = useState(initialExpenseTripPlanId({ expense, selectedTripPlanId, trip }));
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
  const canSubmitExpense = canSubmitExpenseDialog({ isSaving, state: calculatedState, title });
  const linkedItem = itemId ? (trip.itineraryItems.find((item) => item.id === itemId) ?? null) : null;
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

  function addComment() {
    const body = commentDraft.trim();
    if (!body) return;
    setComments((current) => [
      ...current,
      {
        id: `comment-${Date.now().toString(36)}-${current.length + 1}`,
        authorId: currentMember.id,
        body,
        createdAt: new Date().toISOString(),
      },
    ]);
    setCommentDraft("");
  }

  function changeItemId(nextItemId: string) {
    setItemId(nextItemId);
    const nextLinkedItem = nextItemId ? trip.itineraryItems.find((item) => item.id === nextItemId) : null;
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
      exchangeRateToSettlementCurrency: calculatedState.needsExchangeRate ? calculatedState.exchangeRateNumber : 1,
      paidBy,
      category,
      splits: calculatedState.splits,
    };
    if (notes.trim()) input.notes = notes.trim();
    if (receiptUrl.trim()) input.receiptUrl = receiptUrl.trim();
    if (splitEditor.splitMode === "itemized") input.lineItems = calculatedState.validLineItems;
    if (comments.length) input.comments = comments;
    setIsSaving(true);
    try {
      if (expense) {
        await onUpdateExpense({ ...input, expenseId: expense.id });
        return;
      }
      if (calculatedState.repeatCountNumber > 1) input.repeatCount = calculatedState.repeatCountNumber;
      await onCreateExpense(input);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={expenseStyles.dialogBackdropClassName}>
      <section className={expenseStyles.dialogClassName} role="dialog" aria-modal="true" aria-label={expense ? t.expenses.dialog.editTitle : t.expenses.dialog.addTitle}>
        <div className={expenseStyles.dialogHeaderClassName}>
          <h2>{expense ? t.expenses.dialog.editTitle : t.expenses.dialog.addTitle}</h2>
          <IconButton type="button" aria-label={t.common.actions.close} onClick={onClose}><Icon name="x" /></IconButton>
        </div>
        <form className={expenseStyles.dialogFormClassName} onSubmit={submitExpense}>
          <ExpenseDetailsFields
            amount={amount}
            category={category}
            currency={currency}
            effectiveTripPlanId={effectiveTripPlanId}
            exchangeRate={exchangeRate}
            expense={expense}
            itemId={itemId}
            linkedItem={linkedItem}
            needsExchangeRate={calculatedState.needsExchangeRate}
            normalizedCurrency={calculatedState.normalizedCurrency}
            notes={notes}
            paidBy={paidBy}
            receiptUrl={receiptUrl}
            repeatCount={repeatCount}
            settlementCurrency={settlementCurrency}
            splitMode={splitEditor.splitMode}
            title={title}
            trip={trip}
            tripPlanOptions={tripPlanOptions}
            copy={t.expenses}
            onAmountChange={setAmount}
            onCategoryChange={setCategory}
            onCurrencyChange={changeCurrency}
            onExchangeRateChange={changeExchangeRate}
            onItemIdChange={changeItemId}
            onNotesChange={setNotes}
            onPaidByChange={setPaidBy}
            onReceiptUrlChange={setReceiptUrl}
            onRepeatCountChange={setRepeatCount}
            onSplitModeChange={splitEditor.changeSplitMode}
            onTitleChange={setTitle}
            onTripPlanIdChange={setTripPlanId}
          />

          <ExpenseSplitFields
            splitMode={splitEditor.splitMode}
            members={trip.members}
            lineItems={splitEditor.lineItems}
            splitValues={splitEditor.splitValues}
            copy={t.expenses}
            onAddLineItem={splitEditor.addLineItem}
            onToggleLineParticipant={splitEditor.toggleLineParticipant}
            onUpdateLineItem={splitEditor.updateLineItem}
            onUpdateSplitValue={splitEditor.updateSplitValue}
          />

          {expense ? (
            <ExpenseCommentsSection
              comments={comments}
              commentDraft={commentDraft}
              members={trip.members}
              copy={t.expenses}
              onAddComment={addComment}
              onCommentDraftChange={setCommentDraft}
            />
          ) : null}

          <ExpenseDialogSummary
            calculation={calculatedState}
            settlementCurrency={settlementCurrency}
            copy={t.expenses.dialog}
          />

          <div className={expenseStyles.dialogActionsClassName}>
            <Button type="button" variant="ghost" onClick={onClose}>{t.common.actions.cancel}</Button>
            <Button type="submit" disabled={!canSubmitExpense}>
              {t.expenses.actions.saveExpense}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
