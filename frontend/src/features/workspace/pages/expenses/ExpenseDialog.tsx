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
import * as expenseStyles from "./TripExpensesPage.styles";
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
  const [tripPlanId, setTripPlanId] = useState(
    expense?.tripPlanId ??
      selectedTripPlanId ??
      trip.mainTripPlanId ??
      trip.activePlanVariantId ??
      trip.tripPlans?.[0]?.id ??
      trip.planVariants[0]?.id ??
      "",
  );
  const [splitMode, setSplitMode] = useState<ExpenseSplitMode>(expense?.lineItems?.length ? "itemized" : expense ? "exact" : "equal");
  const [splitValues, setSplitValues] = useState<Record<string, string>>(
    Object.fromEntries(trip.members.map((member) => [member.id, expense ? String(expense.splits[member.id] ?? 0) : "0"])),
  );
  const [lineItems, setLineItems] = useState<EditableExpenseLineItem[]>(
    expense?.lineItems?.length
      ? expense.lineItems.map((lineItem) => ({
          ...lineItem,
          amount: String(lineItem.amount),
          participantIds: lineItem.participantIds.filter((memberId) => trip.members.some((member) => member.id === memberId)),
        }))
      : [emptyLineItem(trip.members, 1)],
  );
  const amountNumber = Number(amount);
  const exchangeRateNumber = Number(exchangeRate);
  const repeatCountNumber = Number(repeatCount);
  const hasValidRepeatCount = Boolean(expense) || (Number.isInteger(repeatCountNumber) && repeatCountNumber >= 1 && repeatCountNumber <= 31);
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const needsExchangeRate = normalizedCurrency !== normalizeCurrencyCode(settlementCurrency);
  const hasValidExchangeRate = !needsExchangeRate || (Number.isFinite(exchangeRateNumber) && exchangeRateNumber > 0);
  const parsedSplitValues = Object.fromEntries(trip.members.map((member) => [member.id, Number(splitValues[member.id] || 0)]));
  const parsedLineItems = lineItems.map((lineItem, index) => ({
    id: lineItem.id || `line-${index + 1}`,
    title: lineItem.title.trim(),
    amount: Number(lineItem.amount || 0),
    participantIds: lineItem.participantIds,
  }));
  const validLineItems = parsedLineItems.filter((lineItem) => lineItem.title && Number.isFinite(lineItem.amount) && lineItem.amount > 0 && lineItem.participantIds.length > 0);
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
      setSplitValues(Object.fromEntries(trip.members.map((member) => [member.id, "0"])));
    } else if (nextMode === "shares") {
      setSplitValues(Object.fromEntries(trip.members.map((member) => [member.id, "1"])));
    } else if (nextMode === "percentage") {
      setSplitValues(Object.fromEntries(trip.members.map((member) => [member.id, "0"])));
    } else if (nextMode === "itemized" && !lineItems.length) {
      setLineItems([emptyLineItem(trip.members, 1)]);
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
    setLineItems((current) => [...current, emptyLineItem(trip.members, current.length + 1)]);
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

          {splitMode === "itemized" ? (
            <div className={expenseStyles.itemizedListClassName}>
              {lineItems.map((lineItem, index) => (
                <fieldset className={expenseStyles.itemizedLineClassName} key={lineItem.id} role="group" aria-label={t.expenses.fields.lineGroup({ number: index + 1 })}>
                  <label className={expenseStyles.fieldClassName}>
                    <span>{t.expenses.fields.lineTitle}</span>
                    <input value={lineItem.title} onChange={(event) => updateLineItem(index, { title: event.target.value })} />
                  </label>
                  <label className={expenseStyles.fieldClassName}>
                    <span>{t.expenses.fields.lineAmount}</span>
                    <input inputMode="decimal" value={lineItem.amount} onChange={(event) => updateLineItem(index, { amount: event.target.value })} />
                  </label>
                  <div className={expenseStyles.participantChecksClassName} aria-label={t.expenses.fields.lineParticipants}>
                    {trip.members.map((member) => (
                      <label key={member.id}>
                        <input
                          type="checkbox"
                          checked={lineItem.participantIds.includes(member.id)}
                          onChange={() => toggleLineParticipant(index, member.id)}
                        />
                        {member.displayName}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <Button type="button" variant="ghost" onClick={addLineItem}>{t.expenses.actions.addLineItem}</Button>
            </div>
          ) : splitMode !== "equal" ? (
            <div className={expenseStyles.splitGridClassName}>
              {trip.members.map((member) => (
                <label className={expenseStyles.fieldClassName} key={member.id}>
                  <span>{t.expenses.fields.memberShare({ name: member.displayName })}</span>
                  <input
                    inputMode="decimal"
                    value={splitValues[member.id] ?? ""}
                    onChange={(event) => setSplitValues((current) => ({ ...current, [member.id]: event.target.value }))}
                  />
                </label>
              ))}
            </div>
          ) : null}

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

interface EditableExpenseLineItem {
  id: string;
  title: string;
  amount: string;
  participantIds: string[];
}

function emptyLineItem(members: Member[], index: number): EditableExpenseLineItem {
  return {
    id: `line-${Date.now().toString(36)}-${index}`,
    title: "",
    amount: "",
    participantIds: members.map((member) => member.id),
  };
}
