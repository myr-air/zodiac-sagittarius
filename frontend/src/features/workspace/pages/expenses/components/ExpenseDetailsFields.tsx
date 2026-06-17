import type { ExpenseSplitMode } from "@/src/trip/expenses";
import { majorCurrencyOptions } from "@/src/trip/currencies";
import type { Expense, ItineraryItem, Trip, TripPlan } from "@/src/trip/types";
import { Select } from "@/src/ui";
import * as expenseStyles from "../TripExpensesPage.styles";
import { expenseCategories, expenseSplitModes } from "../expense-page-support";

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
    <div className={expenseStyles.dialogGridClassName}>
      <label className={expenseStyles.fieldClassName}>
        <span>{copy.fields.title}</span>
        <input value={title} onChange={(event) => onTitleChange(event.target.value)} />
      </label>
      <label className={expenseStyles.fieldClassName}>
        <span>{copy.fields.amount}</span>
        <input inputMode="decimal" value={amount} onChange={(event) => onAmountChange(event.target.value)} />
      </label>
      <label className={expenseStyles.fieldClassName}>
        <span>{copy.fields.currency}</span>
        <Select aria-label={copy.fields.currency} value={currency} onChange={(event) => onCurrencyChange(event.target.value)}>
          {majorCurrencyOptions.map((option) => (
            <option key={option.code} value={option.code}>{option.code} · {option.label}</option>
          ))}
        </Select>
      </label>
      <label className={expenseStyles.fieldClassName}>
        <span>{copy.fields.receiptUrl}</span>
        <input value={receiptUrl} onChange={(event) => onReceiptUrlChange(event.target.value)} />
      </label>
      <label className={`${expenseStyles.fieldClassName} md:col-span-2`}>
        <span>{copy.fields.notes}</span>
        <textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} />
      </label>
      {!expense ? (
        <label className={expenseStyles.fieldClassName}>
          <span>{copy.fields.repeatCount}</span>
          <input inputMode="numeric" min={1} max={31} type="number" value={repeatCount} onChange={(event) => onRepeatCountChange(event.target.value)} />
        </label>
      ) : null}
      {needsExchangeRate ? (
        <label className={expenseStyles.fieldClassName}>
          <span>{copy.fields.exchangeRate({ currency: normalizedCurrency, settlementCurrency })}</span>
          <input inputMode="decimal" value={exchangeRate} onChange={(event) => onExchangeRateChange(event.target.value)} />
        </label>
      ) : null}
      <label className={expenseStyles.fieldClassName}>
        <span>{copy.fields.paidBy}</span>
        <Select value={paidBy} onChange={(event) => onPaidByChange(event.target.value)}>
          {trip.members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
        </Select>
      </label>
      <label className={expenseStyles.fieldClassName}>
        <span>{copy.fields.category}</span>
        <Select value={category} onChange={(event) => onCategoryChange(event.target.value as Expense["category"])}>
          {expenseCategories.map((candidate) => <option key={candidate} value={candidate}>{candidate}</option>)}
        </Select>
      </label>
      <div className="grid gap-1.5">
        <label className={expenseStyles.fieldClassName}>
          <span>{copy.fields.tripPlan}</span>
          <Select value={effectiveTripPlanId} disabled={Boolean(linkedItem)} onChange={(event) => onTripPlanIdChange(event.target.value)}>
            {tripPlanOptions.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </Select>
        </label>
        {linkedItem ? <span className={expenseStyles.balanceMetaClassName}>{copy.dialog.planLockedToLinkedStop}</span> : null}
      </div>
      <label className={expenseStyles.fieldClassName}>
        <span>{copy.fields.linkedStop}</span>
        <Select value={itemId} onChange={(event) => onItemIdChange(event.target.value)}>
          <option value="">{copy.fields.noLinkedStop}</option>
          {trip.itineraryItems.map((item) => <option key={item.id} value={item.id}>{item.activity}</option>)}
        </Select>
      </label>
      <label className={expenseStyles.fieldClassName}>
        <span>{copy.fields.splitMode}</span>
        <Select value={splitMode} onChange={(event) => onSplitModeChange(event.target.value as ExpenseSplitMode)}>
          {expenseSplitModes.map((mode) => <option key={mode} value={mode}>{copy.splitModes[mode]}</option>)}
        </Select>
      </label>
    </div>
  );
}
