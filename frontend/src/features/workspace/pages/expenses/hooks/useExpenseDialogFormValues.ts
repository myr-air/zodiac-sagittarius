import { useCallback } from "react";
import { useFormFields } from "@/src/shared/hooks/use-form-fields";
import type { Expense } from "@/src/trip/types";
import {
  expenseDialogCurrencyChangeFields,
  expenseDialogManualExchangeRateFields,
} from "../model/expense-dialog-currency";
import {
  initialExpenseDialogFields,
  type ExpenseDialogInitialFields,
} from "../model/expense-dialog-initial-state";

interface ExpenseDialogFormValuesInput {
  currentMemberId: string;
  expense: Expense | null;
}

export function useExpenseDialogFormValues({
  currentMemberId,
  expense,
}: ExpenseDialogFormValuesInput) {
  const initialFields = initialExpenseDialogFields({
    currentMemberId,
    expense,
  });
  const {
    fields: formValues,
    updateField: updateFormValue,
    updateFields,
  } = useFormFields<ExpenseDialogInitialFields>(initialFields);

  const changeCurrency = useCallback((nextCurrency: string) => {
    const nextFields = expenseDialogCurrencyChangeFields(nextCurrency);
    updateFields(nextFields);
  }, [updateFields]);

  const changeExchangeRate = useCallback((nextExchangeRate: string) => {
    const nextFields = expenseDialogManualExchangeRateFields(nextExchangeRate);
    updateFields(nextFields);
  }, [updateFields]);

  const setExchangeRate = useCallback((exchangeRate: string) => {
    updateFormValue("exchangeRate", exchangeRate);
  }, [updateFormValue]);

  return {
    changeCurrency,
    changeExchangeRate,
    formValues,
    setAmount: (amount: string) => updateFormValue("amount", amount),
    setCategory: (category: Expense["category"]) =>
      updateFormValue("category", category),
    setExchangeRate,
    setFormValue: updateFormValue,
    setNotes: (notes: string) => updateFormValue("notes", notes),
    setPaidBy: (paidBy: string) => updateFormValue("paidBy", paidBy),
    setReceiptUrl: (receiptUrl: string) =>
      updateFormValue("receiptUrl", receiptUrl),
    setRepeatCount: (repeatCount: string) =>
      updateFormValue("repeatCount", repeatCount),
    setTitle: (title: string) => updateFormValue("title", title),
  };
}
