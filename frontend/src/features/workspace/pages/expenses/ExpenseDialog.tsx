import { type FormEvent, useEffect, useState } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import {
  buildExpenseSplits,
  buildItemizedExpenseSplits,
  formatMoney,
  type ExpenseSplitMode,
} from "@/src/trip/expenses";
import { fetchMajorExchangeRate, majorCurrencyOptions, normalizeCurrencyCode } from "@/src/trip/currencies";
import type { Expense, ExpenseComment, Member, Trip } from "@/src/trip/types";
import { Button, IconButton, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
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
import {
  expenseCategories,
  expenseSplitModes,
  formatExchangeRateInput,
  memberById,
  sumShares,
} from "./expense-page-support";

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
  const linkedItem = itemId ? trip.itineraryItems.find((item) => item.id === itemId) : null;
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
          <div className={expenseStyles.dialogGridClassName}>
            <label className={expenseStyles.fieldClassName}>
              <span>{t.expenses.fields.title}</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className={expenseStyles.fieldClassName}>
              <span>{t.expenses.fields.amount}</span>
              <input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
            </label>
            <label className={expenseStyles.fieldClassName}>
              <span>{t.expenses.fields.currency}</span>
              <Select
                aria-label={t.expenses.fields.currency}
                value={currency}
                onChange={(event) => {
                  setCurrency(normalizeCurrencyCode(event.target.value));
                  setExchangeRateTouched(false);
                  setExchangeRate("1");
                }}
              >
                {majorCurrencyOptions.map((option) => (
                  <option key={option.code} value={option.code}>{option.code} · {option.label}</option>
                ))}
              </Select>
            </label>
            <label className={expenseStyles.fieldClassName}>
              <span>{t.expenses.fields.receiptUrl}</span>
              <input value={receiptUrl} onChange={(event) => setReceiptUrl(event.target.value)} />
            </label>
            <label className={`${expenseStyles.fieldClassName} md:col-span-2`}>
              <span>{t.expenses.fields.notes}</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
            {!expense ? (
              <label className={expenseStyles.fieldClassName}>
                <span>{t.expenses.fields.repeatCount}</span>
                <input inputMode="numeric" min={1} max={31} type="number" value={repeatCount} onChange={(event) => setRepeatCount(event.target.value)} />
              </label>
            ) : null}
            {needsExchangeRate ? (
              <label className={expenseStyles.fieldClassName}>
                <span>{t.expenses.fields.exchangeRate({ currency: normalizedCurrency, settlementCurrency })}</span>
                <input
                  inputMode="decimal"
                  value={exchangeRate}
                  onChange={(event) => {
                    setExchangeRateTouched(true);
                    setExchangeRate(event.target.value);
                  }}
                />
              </label>
            ) : null}
            <label className={expenseStyles.fieldClassName}>
              <span>{t.expenses.fields.paidBy}</span>
              <Select value={paidBy} onChange={(event) => setPaidBy(event.target.value)}>
                {trip.members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
              </Select>
            </label>
            <label className={expenseStyles.fieldClassName}>
              <span>{t.expenses.fields.category}</span>
              <Select value={category} onChange={(event) => setCategory(event.target.value as Expense["category"])}>
                {expenseCategories.map((candidate) => <option key={candidate} value={candidate}>{candidate}</option>)}
              </Select>
            </label>
            <div className="grid gap-1.5">
              <label className={expenseStyles.fieldClassName}>
                <span>{t.expenses.fields.tripPlan}</span>
                <Select
                  value={effectiveTripPlanId}
                  disabled={Boolean(linkedItem)}
                  onChange={(event) => setTripPlanId(event.target.value)}
                >
                  {tripPlanOptions.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </Select>
              </label>
              {linkedItem ? <span className={expenseStyles.balanceMetaClassName}>{t.expenses.dialog.planLockedToLinkedStop}</span> : null}
            </div>
            <label className={expenseStyles.fieldClassName}>
              <span>{t.expenses.fields.linkedStop}</span>
              <Select value={itemId} onChange={(event) => changeItemId(event.target.value)}>
                <option value="">{t.expenses.fields.noLinkedStop}</option>
                {trip.itineraryItems.map((item) => <option key={item.id} value={item.id}>{item.activity}</option>)}
              </Select>
            </label>
            <label className={expenseStyles.fieldClassName}>
              <span>{t.expenses.fields.splitMode}</span>
              <Select value={splitMode} onChange={(event) => changeSplitMode(event.target.value as ExpenseSplitMode)}>
                {expenseSplitModes.map((mode) => <option key={mode} value={mode}>{t.expenses.splitModes[mode]}</option>)}
              </Select>
            </label>
          </div>

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
            <section className={expenseStyles.commentsClassName} aria-label={t.expenses.fields.comments}>
              <div className={expenseStyles.balanceListClassName}>
                {comments.map((comment) => {
                  const author = memberById(trip.members, comment.authorId);
                  return (
                    <div className={expenseStyles.commentRowClassName} key={comment.id}>
                      <strong>{author?.displayName ?? t.expenses.comment.unknownAuthor}</strong>
                      <span>{comment.body}</span>
                    </div>
                  );
                })}
                {!comments.length ? <p className={expenseStyles.balanceMetaClassName}>{t.expenses.comment.empty}</p> : null}
              </div>
              <label className={expenseStyles.fieldClassName}>
                <span>{t.expenses.fields.commentInput}</span>
                <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} />
              </label>
              <Button type="button" variant="ghost" onClick={addComment}>{t.expenses.actions.addComment}</Button>
            </section>
          ) : null}

          <p className={splitMismatch ? expenseStyles.warningClassName : expenseStyles.balanceMetaClassName}>
            {t.expenses.dialog.splitTotal({ total: formatMoney(splitTotal, normalizedCurrency), amount: formatMoney(Number.isFinite(amountNumber) ? amountNumber : 0, normalizedCurrency) })}
            {splitMismatch ? ` ${t.expenses.dialog.mismatch}` : ""}
            {invalidItemizedLines ? ` ${t.expenses.dialog.itemizedRequired}` : ""}
            {needsExchangeRate && hasValidExchangeRate ? ` ${t.expenses.dialog.settleValue({ amount: formatMoney(amountNumber * exchangeRateNumber, settlementCurrency) })}` : ""}
            {needsExchangeRate && !hasValidExchangeRate ? ` ${t.expenses.dialog.exchangeRateRequired}` : ""}
          </p>

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
