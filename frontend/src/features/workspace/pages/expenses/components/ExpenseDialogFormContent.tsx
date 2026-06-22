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
  return (
    <>
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
        onSplitModeChange={state.splitEditor.changeSplitMode}
        onTitleChange={state.setTitle}
        onTripPlanIdChange={state.setTripPlanId}
      />

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

      {expense ? (
        <ExpenseCommentsSection
          comments={state.comments}
          commentDraft={state.commentDraft}
          members={trip.members}
          copy={t.expenses}
          onAddComment={state.addComment}
          onCommentDraftChange={state.setCommentDraft}
        />
      ) : null}

      <ExpenseDialogSummary
        calculation={state.calculatedState}
        settlementCurrency={settlementCurrency}
        copy={t.expenses.dialog}
      />

      <div className={expenseStyles.dialogActionsClassName}>
        <Button type="button" variant="ghost" onClick={onCancel}>{t.common.actions.cancel}</Button>
        <Button type="submit" disabled={!state.canSubmitExpense}>
          {t.expenses.actions.saveExpense}
        </Button>
      </div>
    </>
  );
}
