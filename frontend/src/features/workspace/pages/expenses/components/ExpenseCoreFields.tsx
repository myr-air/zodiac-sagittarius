import { SelectOptions } from "@/src/shared/components/select-options";
import { majorCurrencySelectOptions } from "@/src/trip/currencies";
import { Select } from "@/src/ui";
import * as expenseStyles from "../TripExpensesPage.styles";
import { expenseDialogRepeatCountRange } from "../model/expense-dialog-constraints";

interface ExpenseCoreFieldsProps {
  amount: string;
  currency: string;
  exchangeRate: string;
  isEditing: boolean;
  needsExchangeRate: boolean;
  normalizedCurrency: string;
  notes: string;
  receiptUrl: string;
  repeatCount: string;
  settlementCurrency: string;
  title: string;
  copy: {
    fields: {
      amount: string;
      currency: string;
      exchangeRate: (input: { currency: string; settlementCurrency: string }) => string;
      notes: string;
      receiptUrl: string;
      repeatCount: string;
      title: string;
    };
  };
  onAmountChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onExchangeRateChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onReceiptUrlChange: (value: string) => void;
  onRepeatCountChange: (value: string) => void;
  onTitleChange: (value: string) => void;
}

export function ExpenseCoreFields({
  amount,
  copy,
  currency,
  exchangeRate,
  isEditing,
  needsExchangeRate,
  normalizedCurrency,
  notes,
  receiptUrl,
  repeatCount,
  settlementCurrency,
  title,
  onAmountChange,
  onCurrencyChange,
  onExchangeRateChange,
  onNotesChange,
  onReceiptUrlChange,
  onRepeatCountChange,
  onTitleChange,
}: ExpenseCoreFieldsProps) {
  return (
    <>
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
          <SelectOptions options={majorCurrencySelectOptions()} />
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
      {!isEditing ? (
        <label className={expenseStyles.fieldClassName}>
          <span>{copy.fields.repeatCount}</span>
          <input inputMode="numeric" min={expenseDialogRepeatCountRange.min} max={expenseDialogRepeatCountRange.max} type="number" value={repeatCount} onChange={(event) => onRepeatCountChange(event.target.value)} />
        </label>
      ) : null}
      {needsExchangeRate ? (
        <label className={expenseStyles.fieldClassName}>
          <span>{copy.fields.exchangeRate({ currency: normalizedCurrency, settlementCurrency })}</span>
          <input inputMode="decimal" value={exchangeRate} onChange={(event) => onExchangeRateChange(event.target.value)} />
        </label>
      ) : null}
    </>
  );
}
