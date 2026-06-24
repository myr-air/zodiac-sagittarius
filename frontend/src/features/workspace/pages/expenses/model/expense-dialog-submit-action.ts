import type { Expense } from "@/src/trip/types";
import type {
  CreateExpenseHandler,
  ExpenseInput,
  UpdateExpenseHandler,
} from "./expense-page-types";

interface SubmitExpenseDialogInput {
  canSubmitExpense: boolean;
  expense: Expense | null;
  input: ExpenseInput;
  onCreateExpense: CreateExpenseHandler;
  onUpdateExpense: UpdateExpenseHandler;
  setSaving: (isSaving: boolean) => void;
}

export async function submitExpenseDialog({
  canSubmitExpense,
  expense,
  input,
  onCreateExpense,
  onUpdateExpense,
  setSaving,
}: SubmitExpenseDialogInput): Promise<boolean> {
  if (!canSubmitExpense) return false;

  setSaving(true);
  try {
    if (expense) {
      await onUpdateExpense({ ...input, expenseId: expense.id });
      return true;
    }
    await onCreateExpense(input);
    return true;
  } finally {
    setSaving(false);
  }
}
