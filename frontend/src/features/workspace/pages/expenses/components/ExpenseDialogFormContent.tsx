import type { Expense, Trip } from "@/src/trip/types";
import type { SelectOption } from "@/src/shared/select-options";
import { formatMoney } from "@/src/trip/expenses";
import { Button } from "@/src/ui";
import { useMemo } from "react";
import type { useExpenseDialogState } from "../hooks/useExpenseDialogState";
import * as expenseStyles from "../TripExpensesPage.styles";
import type { ExpensePageLabels } from "../model/expense-page-types";
import { ExpenseCommentsSection } from "./ExpenseCommentsSection";
import { ExpenseDetailsFields } from "./ExpenseDetailsFields";
import { ExpenseDialogSummary } from "./ExpenseDialogSummary";
import { ExpenseSplitFields } from "./ExpenseSplitFields";

interface ExpenseDialogFormContentProps {
  expense: Expense | null;
  onCancel: () => void;
  settlementCurrency: string;
  state: ReturnType<typeof useExpenseDialogState>;
  t: ExpensePageLabels;
  trip: Trip;
}

export function ExpenseDialogFormContent({
  expense,
  onCancel,
  settlementCurrency,
  state,
  t,
  trip,
}: ExpenseDialogFormContentProps) {
  const hasSplitDetails = state.splitEditor.splitMode !== "equal" && state.splitEditor.splitMode !== "personal";
  const storedValueCardOptions = useMemo(
    () => storedValueCardSelectOptions(trip.expenses, state.storedValueCardName),
    [state.storedValueCardName, trip.expenses],
  );
  const amountFeedback = state.amount.trim()
    ? state.calculatedState.amountExpression.error === "syntax"
      ? { tone: "danger" as const, text: t.expenses.dialog.amountExpressionInvalid }
      : state.calculatedState.amountExpression.isExpression && Number.isFinite(state.calculatedState.amountNumber)
        ? {
          tone: "muted" as const,
          text: t.expenses.dialog.amountExpressionPreview({
            amount: formatMoney(state.calculatedState.amountNumber, state.calculatedState.normalizedCurrency),
          }),
        }
        : null
    : null;

  return (
    <>
      <div className={expenseStyles.dialogFormScrollClassName}>
        <ExpenseDetailsFields
          amount={state.amount}
          amountFeedback={amountFeedback}
          category={state.category}
          currency={state.currency}
          effectiveTripPlanId={state.effectiveTripPlanId}
          exchangeRate={state.exchangeRate}
          expense={expense}
          itemId={state.itemId}
          linkedItem={state.linkedItem}
          needsExchangeRate={state.calculatedState.needsExchangeRate}
          normalizedCurrency={state.calculatedState.normalizedCurrency}
          notes={state.notes}
          paidBy={state.paidBy}
          receiptUrl={state.receiptUrl}
          repeatCount={state.repeatCount}
          settlementCurrency={settlementCurrency}
          spentOn={state.spentOn}
          storedValueCardOptions={storedValueCardOptions}
          storedValueCardName={state.storedValueCardName}
          storedValueTransactionType={state.storedValueTransactionType}
          splitMode={state.splitEditor.splitMode}
          title={state.title}
          trip={trip}
          tripPlanOptions={state.tripPlanOptions}
          copy={t.expenses}
          onAmountChange={state.setAmount}
          onCategoryChange={state.setCategory}
          onCurrencyChange={state.changeCurrency}
          onExchangeRateChange={state.changeExchangeRate}
          onItemIdChange={state.changeItemId}
          onNotesChange={state.setNotes}
          onPaidByChange={state.setPaidBy}
          onReceiptUrlChange={state.setReceiptUrl}
          onRepeatCountChange={state.setRepeatCount}
          onSpentOnChange={state.setSpentOn}
          onStoredValueCardNameChange={state.setStoredValueCardName}
          onStoredValueTransactionTypeChange={state.setStoredValueTransactionType}
          onSplitModeChange={state.splitEditor.changeSplitMode}
          onTitleChange={state.setTitle}
          onTripPlanIdChange={state.setTripPlanId}
        />

        {hasSplitDetails ? (
          <section className={expenseStyles.dialogSectionClassName} aria-labelledby="expense-dialog-split-section">
            <div className={expenseStyles.dialogSectionHeaderClassName}>
              <h3 id="expense-dialog-split-section">{t.expenses.dialog.sections.split}</h3>
            </div>
            <ExpenseSplitFields
              splitMode={state.splitEditor.splitMode}
              members={trip.members}
              lineItems={state.splitEditor.lineItems}
              splitValues={state.splitEditor.splitValues}
              copy={t.expenses}
              onAddLineItem={state.splitEditor.addLineItem}
              onToggleLineParticipant={state.splitEditor.toggleLineParticipant}
              onUpdateLineItem={state.splitEditor.updateLineItem}
              onUpdateSplitValue={state.splitEditor.updateSplitValue}
            />
          </section>
        ) : null}

        {expense ? (
          <section className={expenseStyles.dialogSectionClassName} aria-labelledby="expense-dialog-comments-section">
            <div className={expenseStyles.dialogSectionHeaderClassName}>
              <h3 id="expense-dialog-comments-section">{t.expenses.dialog.sections.comments}</h3>
            </div>
            <ExpenseCommentsSection
              comments={state.comments}
              commentDraft={state.commentDraft}
              members={trip.members}
              copy={t.expenses}
              onAddComment={state.addComment}
              onCommentDraftChange={state.setCommentDraft}
            />
          </section>
        ) : null}
      </div>

      <div className={expenseStyles.dialogReviewClassName} role="group" aria-label={t.expenses.dialog.sections.review}>
        <ExpenseDialogSummary
          calculation={state.calculatedState}
          settlementCurrency={settlementCurrency}
          copy={t.expenses.dialog}
        />

        <div className={expenseStyles.dialogReviewActionsClassName}>
          <Button type="button" variant="ghost" onClick={onCancel}>{t.common.actions.cancel}</Button>
          <Button type="submit" disabled={!state.canSubmitExpense}>
            {t.expenses.actions.saveExpense}
          </Button>
        </div>
      </div>
    </>
  );
}

function storedValueCardSelectOptions(
  expenses: Trip["expenses"],
  currentCardName: string,
): SelectOption[] {
  const cardsByName = new Map<string, SelectOption>();
  for (const expense of expenses) {
    const cardName = expense.storedValueCardName?.trim();
    if (!cardName || cardsByName.has(cardName)) continue;
    cardsByName.set(cardName, { value: cardName, label: cardName });
  }
  const currentName = currentCardName.trim();
  if (currentName && !cardsByName.has(currentName)) {
    cardsByName.set(currentName, { value: currentName, label: currentName });
  }
  return Array.from(cardsByName.values()).sort((left, right) =>
    left.label.localeCompare(right.label),
  );
}
