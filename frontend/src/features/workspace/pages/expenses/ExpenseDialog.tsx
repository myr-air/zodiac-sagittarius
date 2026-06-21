import { useI18n } from "@/src/i18n/I18nProvider";
import type { Expense, Member, Trip } from "@/src/trip/types";
import { Button, IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { ExpenseCommentsSection } from "./components/ExpenseCommentsSection";
import { ExpenseDetailsFields } from "./components/ExpenseDetailsFields";
import { ExpenseDialogSummary } from "./components/ExpenseDialogSummary";
import { ExpenseSplitFields } from "./components/ExpenseSplitFields";
import { useExpenseDialogState } from "./hooks/useExpenseDialogState";
import * as expenseStyles from "./TripExpensesPage.styles";
import type { ExpenseInput, ExpenseUpdateInput } from "./model/expense-page-types";

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
  const state = useExpenseDialogState({
    apiBaseUrl,
    currentMember,
    expense,
    selectedTripPlanId,
    settlementCurrency,
    trip,
    onCreateExpense,
    onUpdateExpense,
  });

  return (
    <div className={expenseStyles.dialogBackdropClassName}>
      <section className={expenseStyles.dialogClassName} role="dialog" aria-modal="true" aria-label={expense ? t.expenses.dialog.editTitle : t.expenses.dialog.addTitle}>
        <div className={expenseStyles.dialogHeaderClassName}>
          <h2>{expense ? t.expenses.dialog.editTitle : t.expenses.dialog.addTitle}</h2>
          <IconButton type="button" aria-label={t.common.actions.close} onClick={onClose}><Icon name="x" /></IconButton>
        </div>
        <form className={expenseStyles.dialogFormClassName} onSubmit={state.submitExpense}>
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
            <Button type="button" variant="ghost" onClick={onClose}>{t.common.actions.cancel}</Button>
            <Button type="submit" disabled={!state.canSubmitExpense}>
              {t.expenses.actions.saveExpense}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
