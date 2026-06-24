import { buildSelectOptions, type SelectOption } from "@/src/shared/select-options";
import type { Expense } from "../types";
import { expenseCategoryValues } from "./expense-types";

export type ExpenseCategorySelectOption = SelectOption<Expense["category"]>;

export function expenseCategorySelectOptions(): ExpenseCategorySelectOption[] {
  return buildSelectOptions(expenseCategoryValues, (value) => value);
}
