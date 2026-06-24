import type { Expense, Trip } from "@/src/trip/types";
import { Button } from "@/src/ui";
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

  return (
    <>
      <div className={expenseStyles.dialogFormScrollClassName}>
        <ExpenseDetailsFields
          amount={state.amount}
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
