import { useCallback, useState } from "react";
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
  const [formValues, setFormValues] =
    useState<ExpenseDialogInitialFields>(initialFields);

  const updateFormValue = useCallback(
    <Field extends keyof ExpenseDialogInitialFields>(
      field: Field,
      value: ExpenseDialogInitialFields[Field],
    ) => {
      setFormValues((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const changeCurrency = useCallback((nextCurrency: string) => {
    const nextFields = expenseDialogCurrencyChangeFields(nextCurrency);
    setFormValues((current) => ({ ...current, ...nextFields }));
  }, []);

  const changeExchangeRate = useCallback((nextExchangeRate: string) => {
    const nextFields = expenseDialogManualExchangeRateFields(nextExchangeRate);
    setFormValues((current) => ({ ...current, ...nextFields }));
  }, []);

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
