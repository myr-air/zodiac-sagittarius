import type { ExpenseSplitMode } from "@/src/trip/expenses";
import type { Expense, ItineraryItem, Trip, TripPlan } from "@/src/trip/types";
import * as expenseStyles from "../TripExpensesPage.styles";
import { ExpenseCoreFields } from "./ExpenseCoreFields";
import { ExpenseLinkingFields } from "./ExpenseLinkingFields";

interface ExpenseDetailsFieldsProps {
  amount: string;
  category: Expense["category"];
  currency: string;
  effectiveTripPlanId: string;
  exchangeRate: string;
  expense: Expense | null;
  itemId: string;
  linkedItem: ItineraryItem | null;
  needsExchangeRate: boolean;
  normalizedCurrency: string;
  notes: string;
  paidBy: string;
  receiptUrl: string;
  repeatCount: string;
  settlementCurrency: string;
  splitMode: ExpenseSplitMode;
  title: string;
  trip: Trip;
  tripPlanOptions: TripPlan[];
  copy: {
    dialog: {
      planLockedToLinkedStop: string;
      sections: {
        receipt: string;
        routing: string;
      };
    };
    fields: {
      amount: string;
      category: string;
      currency: string;
      exchangeRate: (input: { currency: string; settlementCurrency: string }) => string;
      linkedStop: string;
      noLinkedStop: string;
      notes: string;
      paidBy: string;
      receiptUrl: string;
      repeatCount: string;
      splitMode: string;
      title: string;
      tripPlan: string;
    };
    splitModes: Record<ExpenseSplitMode, string>;
  };
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: Expense["category"]) => void;
  onCurrencyChange: (value: string) => void;
  onExchangeRateChange: (value: string) => void;
  onItemIdChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onPaidByChange: (value: string) => void;
  onReceiptUrlChange: (value: string) => void;
  onRepeatCountChange: (value: string) => void;
  onSplitModeChange: (value: ExpenseSplitMode) => void;
  onTitleChange: (value: string) => void;
  onTripPlanIdChange: (value: string) => void;
}

export function ExpenseDetailsFields({
  amount,
  category,
  currency,
  effectiveTripPlanId,
  exchangeRate,
  expense,
  itemId,
  linkedItem,
  needsExchangeRate,
  normalizedCurrency,
  notes,
  paidBy,
  receiptUrl,
  repeatCount,
  settlementCurrency,
  splitMode,
  title,
  trip,
  tripPlanOptions,
  copy,
  onAmountChange,
  onCategoryChange,
  onCurrencyChange,
  onExchangeRateChange,
  onItemIdChange,
  onNotesChange,
  onPaidByChange,
  onReceiptUrlChange,
  onRepeatCountChange,
  onSplitModeChange,
  onTitleChange,
  onTripPlanIdChange,
}: ExpenseDetailsFieldsProps) {
  return (
    <div className={expenseStyles.dialogStackClassName}>
      <section className={expenseStyles.dialogSectionClassName} aria-labelledby="expense-dialog-receipt-section">
        <div className={expenseStyles.dialogSectionHeaderClassName}>
          <h3 id="expense-dialog-receipt-section">{copy.dialog.sections.receipt}</h3>
        </div>
        <div className={expenseStyles.dialogGridClassName}>
          <ExpenseCoreFields
            amount={amount}
            copy={copy}
            currency={currency}
            exchangeRate={exchangeRate}
            isEditing={Boolean(expense)}
            needsExchangeRate={needsExchangeRate}
            normalizedCurrency={normalizedCurrency}
            notes={notes}
            receiptUrl={receiptUrl}
            repeatCount={repeatCount}
            settlementCurrency={settlementCurrency}
            title={title}
            onAmountChange={onAmountChange}
            onCurrencyChange={onCurrencyChange}
            onExchangeRateChange={onExchangeRateChange}
            onNotesChange={onNotesChange}
            onReceiptUrlChange={onReceiptUrlChange}
            onRepeatCountChange={onRepeatCountChange}
            onTitleChange={onTitleChange}
          />
        </div>
      </section>

      <section className={expenseStyles.dialogSectionClassName} aria-labelledby="expense-dialog-routing-section">
        <div className={expenseStyles.dialogSectionHeaderClassName}>
          <h3 id="expense-dialog-routing-section">{copy.dialog.sections.routing}</h3>
        </div>
        <div className={expenseStyles.dialogGridClassName}>
          <ExpenseLinkingFields
            category={category}
            copy={copy}
            effectiveTripPlanId={effectiveTripPlanId}
            itemId={itemId}
            linkedItem={linkedItem}
            paidBy={paidBy}
            splitMode={splitMode}
            trip={trip}
            tripPlanOptions={tripPlanOptions}
            onCategoryChange={onCategoryChange}
            onItemIdChange={onItemIdChange}
            onPaidByChange={onPaidByChange}
            onSplitModeChange={onSplitModeChange}
            onTripPlanIdChange={onTripPlanIdChange}
          />
        </div>
      </section>
    </div>
  );
}
