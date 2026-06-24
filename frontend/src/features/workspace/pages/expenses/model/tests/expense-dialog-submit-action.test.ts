import { describe, expect, it, vi } from "vitest";
import type { Expense } from "@/src/trip/types";
import { submitExpenseDialog } from "../expense-dialog-submit-action";
import type {
  CreateExpenseHandler,
  ExpenseInput,
  UpdateExpenseHandler,
} from "../expense-page-types";

const input: ExpenseInput = {
  amount: 40,
  category: "food",
  currency: "HKD",
  itemId: null,
  paidBy: "member-aom",
  splits: {
    "member-aom": 40,
  },
  title: "Dinner",
};

describe("submitExpenseDialog", () => {
  it("does not submit when the dialog is not ready", async () => {
    const onCreateExpense = vi.fn<CreateExpenseHandler>();
    const onUpdateExpense = vi.fn<UpdateExpenseHandler>();
    const setSaving = vi.fn();

    await expect(submitExpenseDialog({
      canSubmitExpense: false,
      expense: null,
      input,
      onCreateExpense,
      onUpdateExpense,
      setSaving,
    })).resolves.toBe(false);

    expect(onCreateExpense).not.toHaveBeenCalled();
    expect(onUpdateExpense).not.toHaveBeenCalled();
    expect(setSaving).not.toHaveBeenCalled();
  });

  it("creates new expenses and resets saving state", async () => {
    const onCreateExpense = vi.fn<CreateExpenseHandler>().mockResolvedValue(undefined);
    const onUpdateExpense = vi.fn<UpdateExpenseHandler>();
    const setSaving = vi.fn();

    await expect(submitExpenseDialog({
      canSubmitExpense: true,
      expense: null,
      input,
      onCreateExpense,
      onUpdateExpense,
      setSaving,
    })).resolves.toBe(true);

    expect(onCreateExpense).toHaveBeenCalledWith(input);
    expect(onUpdateExpense).not.toHaveBeenCalled();
    expect(setSaving).toHaveBeenNthCalledWith(1, true);
    expect(setSaving).toHaveBeenNthCalledWith(2, false);
  });

  it("updates existing expenses and resets saving state after failures", async () => {
    const error = new Error("save failed");
    const onCreateExpense = vi.fn<CreateExpenseHandler>();
    const onUpdateExpense = vi.fn<UpdateExpenseHandler>().mockRejectedValue(error);
    const setSaving = vi.fn();

    await expect(submitExpenseDialog({
      canSubmitExpense: true,
      expense: { id: "expense-existing" } as Expense,
      input,
      onCreateExpense,
      onUpdateExpense,
      setSaving,
    })).rejects.toThrow(error);

    expect(onCreateExpense).not.toHaveBeenCalled();
    expect(onUpdateExpense).toHaveBeenCalledWith({
      ...input,
      expenseId: "expense-existing",
    });
    expect(setSaving).toHaveBeenNthCalledWith(1, true);
    expect(setSaving).toHaveBeenNthCalledWith(2, false);
  });
});
