import { type FormEvent, useEffect, useState } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import {
  buildExpenseSplits,
  buildItemizedExpenseSplits,
  type ExpenseSplitMode,
} from "@/src/trip/expenses";
import { fetchMajorExchangeRate, normalizeCurrencyCode } from "@/src/trip/currencies";
import type { Expense, ExpenseComment, Member, Trip } from "@/src/trip/types";
import { Button, IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { ExpenseCommentsSection } from "./components/ExpenseCommentsSection";
import { ExpenseDetailsFields } from "./components/ExpenseDetailsFields";
import { ExpenseDialogSummary } from "./components/ExpenseDialogSummary";
import { ExpenseSplitFields } from "./components/ExpenseSplitFields";
import * as expenseStyles from "./TripExpensesPage.styles";
import {
  emptyExpenseLineItem,
  expenseSplitValuesForMode,
  initialExpenseLineItems,
  initialExpenseSplitValues,
  initialExpenseTripPlanId,
  parseExpenseLineItems,
  validExpenseLineItems,
  type EditableExpenseLineItem,
} from "./expense-dialog-support";
import type { ExpenseInput, ExpenseUpdateInput } from "./expense-page-types";
import { formatExchangeRateInput, sumShares } from "./expense-page-support";

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
  const [splitMode, setSplitMode] = useState<ExpenseSplitMode>(expense?.lineItems?.length ? "itemized" : expense ? "exact" : "equal");
  const [splitValues, setSplitValues] = useState<Record<string, string>>(initialExpenseSplitValues(trip.members, expense));
  const [lineItems, setLineItems] = useState<EditableExpenseLineItem[]>(initialExpenseLineItems(expense, trip.members));
  const amountNumber = Number(amount);
  const exchangeRateNumber = Number(exchangeRate);
  const repeatCountNumber = Number(repeatCount);
  const hasValidRepeatCount = Boolean(expense) || (Number.isInteger(repeatCountNumber) && repeatCountNumber >= 1 && repeatCountNumber <= 31);
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const needsExchangeRate = normalizedCurrency !== normalizeCurrencyCode(settlementCurrency);
  const hasValidExchangeRate = !needsExchangeRate || (Number.isFinite(exchangeRateNumber) && exchangeRateNumber > 0);
  const parsedSplitValues = Object.fromEntries(trip.members.map((member) => [member.id, Number(splitValues[member.id] || 0)]));
  const parsedLineItems = parseExpenseLineItems(lineItems);
  const validLineItems = validExpenseLineItems(parsedLineItems);
  const splits = Number.isFinite(amountNumber) && amountNumber >= 0
    ? splitMode === "itemized"
      ? buildItemizedExpenseSplits({ lineItems: validLineItems, memberIds: trip.members.map((member) => member.id) })
      : buildExpenseSplits({ amount: amountNumber, memberIds: trip.members.map((member) => member.id), mode: splitMode, valuesByMember: parsedSplitValues })
    : {};
  const splitTotal = sumShares(splits);
  const splitMismatch = (splitMode === "exact" || splitMode === "percentage" || splitMode === "itemized") && Math.abs(splitTotal - amountNumber) > 0.01;
  const invalidItemizedLines = splitMode === "itemized" && (!validLineItems.length || validLineItems.length !== lineItems.length);
  const linkedItem = itemId ? (trip.itineraryItems.find((item) => item.id === itemId) ?? null) : null;
  const effectiveTripPlanId = linkedItem?.planVariantId ?? tripPlanId;
  const tripPlanOptions = trip.tripPlans ?? trip.planVariants;

  useEffect(() => {
    let cancelled = false;
    if (!needsExchangeRate || exchangeRateTouched) return;

    fetchMajorExchangeRate(normalizedCurrency, normalizeCurrencyCode(settlementCurrency), {
      backendBaseUrl: apiBaseUrl,
    })
      .then((quote) => {
        if (!cancelled && quote) {
          setExchangeRate(formatExchangeRateInput(quote.rate));
        }
      })
      .catch(() => {
        // Keep manual exchange-rate entry available when the provider is offline.
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, exchangeRateTouched, needsExchangeRate, normalizedCurrency, settlementCurrency]);

  function changeSplitMode(nextMode: ExpenseSplitMode) {
    setSplitMode(nextMode);
    if (nextMode === "exact") {
      setSplitValues(expenseSplitValuesForMode(trip.members, "0"));
    } else if (nextMode === "shares") {
      setSplitValues(expenseSplitValuesForMode(trip.members, "1"));
    } else if (nextMode === "percentage") {
      setSplitValues(expenseSplitValuesForMode(trip.members, "0"));
    } else if (nextMode === "itemized" && !lineItems.length) {
      setLineItems([emptyExpenseLineItem(trip.members, 1)]);
    }
  }

  function changeCurrency(nextCurrency: string) {
    setCurrency(normalizeCurrencyCode(nextCurrency));
    setExchangeRateTouched(false);
    setExchangeRate("1");
  }

  function changeExchangeRate(nextExchangeRate: string) {
    setExchangeRateTouched(true);
    setExchangeRate(nextExchangeRate);
  }

  function updateLineItem(index: number, patch: Partial<EditableExpenseLineItem>) {
    setLineItems((current) => current.map((lineItem, candidateIndex) => (candidateIndex === index ? { ...lineItem, ...patch } : lineItem)));
  }

  function toggleLineParticipant(index: number, memberId: string) {
    setLineItems((current) => current.map((lineItem, candidateIndex) => {
      if (candidateIndex !== index) return lineItem;
      const participantIds = lineItem.participantIds.includes(memberId)
        ? lineItem.participantIds.filter((participantId) => participantId !== memberId)
        : [...lineItem.participantIds, memberId];
      return { ...lineItem, participantIds };
    }));
  }

  function addLineItem() {
    setLineItems((current) => [...current, emptyExpenseLineItem(trip.members, current.length + 1)]);
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
    if (isSaving || !trimmedTitle || !Number.isFinite(amountNumber) || amountNumber <= 0 || splitMismatch || !hasValidExchangeRate || invalidItemizedLines || !hasValidRepeatCount) return;
    const input: ExpenseInput = {
      itemId: itemId || null,
      tripPlanId: effectiveTripPlanId || null,
      title: trimmedTitle,
      amount: amountNumber,
      currency: normalizedCurrency,
      exchangeRateToSettlementCurrency: needsExchangeRate ? exchangeRateNumber : 1,
      paidBy,
      category,
      splits,
    };
    if (notes.trim()) input.notes = notes.trim();
    if (receiptUrl.trim()) input.receiptUrl = receiptUrl.trim();
    if (splitMode === "itemized") input.lineItems = validLineItems;
    if (comments.length) input.comments = comments;
    setIsSaving(true);
    try {
      if (expense) {
        await onUpdateExpense({ ...input, expenseId: expense.id });
        return;
      }
      if (repeatCountNumber > 1) input.repeatCount = repeatCountNumber;
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
            needsExchangeRate={needsExchangeRate}
            normalizedCurrency={normalizedCurrency}
            notes={notes}
            paidBy={paidBy}
            receiptUrl={receiptUrl}
            repeatCount={repeatCount}
            settlementCurrency={settlementCurrency}
            splitMode={splitMode}
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
            onSplitModeChange={changeSplitMode}
            onTitleChange={setTitle}
            onTripPlanIdChange={setTripPlanId}
          />

          <ExpenseSplitFields
            splitMode={splitMode}
            members={trip.members}
            lineItems={lineItems}
            splitValues={splitValues}
            copy={t.expenses}
            onAddLineItem={addLineItem}
            onToggleLineParticipant={toggleLineParticipant}
            onUpdateLineItem={updateLineItem}
            onUpdateSplitValue={(memberId, value) => setSplitValues((current) => ({ ...current, [memberId]: value }))}
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
            amount={amountNumber}
            currency={normalizedCurrency}
            exchangeRate={exchangeRateNumber}
            hasValidExchangeRate={hasValidExchangeRate}
            invalidItemizedLines={invalidItemizedLines}
            needsExchangeRate={needsExchangeRate}
            settlementCurrency={settlementCurrency}
            splitMismatch={splitMismatch}
            splitTotal={splitTotal}
            copy={t.expenses.dialog}
          />

          <div className={expenseStyles.dialogActionsClassName}>
            <Button type="button" variant="ghost" onClick={onClose}>{t.common.actions.cancel}</Button>
            <Button type="submit" disabled={isSaving || !title.trim() || !Number.isFinite(amountNumber) || amountNumber <= 0 || splitMismatch || !hasValidExchangeRate || invalidItemizedLines || !hasValidRepeatCount}>
              {t.expenses.actions.saveExpense}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
