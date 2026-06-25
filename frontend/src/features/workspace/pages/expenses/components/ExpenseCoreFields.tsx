import { useId, useState } from "react";
import { SelectOptions } from "@/src/shared/components/select-options";
import { majorCurrencySelectOptions } from "@/src/trip/currencies";
import { Button, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
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
  spentOn: string;
  storedValueCardName: string;
  storedValueTransactionType: "topup" | "spend" | "refund" | "";
  title: string;
  copy: {
    fields: {
      amount: string;
      currency: string;
      exchangeRate: (input: { currency: string; settlementCurrency: string }) => string;
      notes: string;
      receiptUrl: string;
      repeatCount: string;
      spentOn: string;
      storedValueCardName: string;
      storedValueTransactionType: string;
      title: string;
    };
    storedValue: {
      transactionTypes: {
        none: string;
        refund: string;
        spend: string;
        topup: string;
      };
    };
  };
  onAmountChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onExchangeRateChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onReceiptUrlChange: (value: string) => void;
  onRepeatCountChange: (value: string) => void;
  onSpentOnChange: (value: string) => void;
  onStoredValueCardNameChange: (value: string) => void;
  onStoredValueTransactionTypeChange: (value: "topup" | "spend" | "refund" | "") => void;
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
  spentOn,
  storedValueCardName,
  storedValueTransactionType,
  title,
  onAmountChange,
  onCurrencyChange,
  onExchangeRateChange,
  onNotesChange,
  onReceiptUrlChange,
  onRepeatCountChange,
  onSpentOnChange,
  onStoredValueCardNameChange,
  onStoredValueTransactionTypeChange,
  onTitleChange,
}: ExpenseCoreFieldsProps) {
  const advancedSectionId = useId();
  const [advancedOpen, setAdvancedOpen] = useState(() =>
    Boolean(notes || receiptUrl || needsExchangeRate || (!isEditing && repeatCount && repeatCount !== "1")),
  );
  const advancedSummary = [copy.fields.notes, copy.fields.receiptUrl].join(" · ");
  const advancedVisible = advancedOpen || needsExchangeRate;

  return (
    <>
      <div className={expenseStyles.dialogPrimaryAmountRowClassName}>
        <label className={expenseStyles.fieldClassName}>
          <span>{copy.fields.amount}</span>
          <input
            inputMode="decimal"
            placeholder="420.00"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
          />
        </label>
        <label className={expenseStyles.fieldClassName}>
          <span>{copy.fields.currency}</span>
          <Select aria-label={copy.fields.currency} value={currency} onChange={(event) => onCurrencyChange(event.target.value)}>
            <SelectOptions options={majorCurrencySelectOptions()} />
          </Select>
        </label>
      </div>
      <label className={expenseStyles.fieldClassName}>
        <span>{copy.fields.title}</span>
        <input
          placeholder="Airport taxi"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </label>
      <label className={expenseStyles.fieldClassName}>
        <span>{copy.fields.spentOn}</span>
        <input
          type="date"
          value={spentOn}
          onChange={(event) => onSpentOnChange(event.target.value)}
        />
      </label>

      <div className={expenseStyles.dialogDisclosureClassName}>
        <Button
          type="button"
          variant="ghost"
          aria-controls={advancedSectionId}
          aria-expanded={advancedVisible}
          className={expenseStyles.dialogDisclosureToggleClassName}
          onClick={() => setAdvancedOpen((current) => !current)}
        >
          <span className={expenseStyles.dialogDisclosureSummaryClassName}>{advancedSummary}</span>
          <span className={expenseStyles.dialogDisclosureMetaClassName} aria-hidden="true">
            <Icon className={advancedVisible ? "size-4 rotate-90 transition-transform" : "size-4 transition-transform"} name="chevronRight" />
          </span>
        </Button>
        {advancedVisible ? (
          <div className={expenseStyles.dialogDisclosurePanelClassName} id={advancedSectionId}>
            <div className={expenseStyles.dialogSecondaryGridClassName}>
              <label className={expenseStyles.fieldClassName}>
                <span>{copy.fields.receiptUrl}</span>
                <input
                  placeholder="https://"
                  value={receiptUrl}
                  onChange={(event) => onReceiptUrlChange(event.target.value)}
                />
              </label>
              {!isEditing ? (
                <label className={expenseStyles.fieldClassName}>
                  <span>{copy.fields.repeatCount}</span>
                  <input
                    inputMode="numeric"
                    min={expenseDialogRepeatCountRange.min}
                    max={expenseDialogRepeatCountRange.max}
                    type="number"
                    value={repeatCount}
                    onChange={(event) => onRepeatCountChange(event.target.value)}
                  />
                </label>
              ) : null}
              {needsExchangeRate ? (
                <label className={expenseStyles.fieldClassName}>
                  <span>{copy.fields.exchangeRate({ currency: normalizedCurrency, settlementCurrency })}</span>
                  <input
                    inputMode="decimal"
                    value={exchangeRate}
                    onChange={(event) => onExchangeRateChange(event.target.value)}
                  />
                </label>
              ) : null}
              <label className={expenseStyles.fieldClassName}>
                <span>{copy.fields.storedValueCardName}</span>
                <input
                  placeholder="Octopus"
                  value={storedValueCardName}
                  onChange={(event) => onStoredValueCardNameChange(event.target.value)}
                />
              </label>
              <label className={expenseStyles.fieldClassName}>
                <span>{copy.fields.storedValueTransactionType}</span>
                <Select
                  aria-label={copy.fields.storedValueTransactionType}
                  value={storedValueTransactionType}
                  onChange={(event) => onStoredValueTransactionTypeChange(event.target.value as typeof storedValueTransactionType)}
                >
                  <option value="">{copy.storedValue.transactionTypes.none}</option>
                  <option value="topup">{copy.storedValue.transactionTypes.topup}</option>
                  <option value="spend">{copy.storedValue.transactionTypes.spend}</option>
                  <option value="refund">{copy.storedValue.transactionTypes.refund}</option>
                </Select>
              </label>
            </div>
            <label className={expenseStyles.fieldClassName}>
              <span>{copy.fields.notes}</span>
              <textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} />
            </label>
          </div>
        ) : null}
      </div>
    </>
  );
}
