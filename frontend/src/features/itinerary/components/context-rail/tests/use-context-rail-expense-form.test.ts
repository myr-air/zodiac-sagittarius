import type { ChangeEvent, FormEvent } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Expense } from "@/src/trip/types";
import {
  contextRailExpenseCategoryOptions,
  initialContextRailExpenseFormState,
  resetContextRailExpenseFormAfterSubmit,
  startContextRailExpenseEdit,
  updateContextRailExpenseFormValue,
  useContextRailExpenseForm,
} from "../use-context-rail-expense-form";

function createHook(options: { selectedItemId?: string } = {}) {
  const onCreateExpense = vi.fn();
  const onUpdateExpense = vi.fn();
  const hook = renderHook(() =>
    useContextRailExpenseForm({
      defaultPaidBy: "member-owner",
      onCreateExpense,
      onUpdateExpense,
      selectedItemId: options.selectedItemId,
    }),
  );

  return { ...hook, onCreateExpense, onUpdateExpense };
}

function submit(result: ReturnType<typeof createHook>["result"]) {
  act(() => {
    result.current.submitExpense({
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>);
  });
}

describe("useContextRailExpenseForm", () => {
  it("updates composed expense form state immutably", () => {
    const initial = initialContextRailExpenseFormState("member-owner");

    expect(initial).toEqual({
      editingExpenseId: null,
      formValues: {
        amount: "",
        category: "food",
        paidBy: "member-owner",
        title: "",
      },
    });
    expect(
      updateContextRailExpenseFormValue(initial, "title", "Taxi"),
    ).toEqual({
      ...initial,
      formValues: {
        ...initial.formValues,
        title: "Taxi",
      },
    });
  });

  it("starts editing and resets submit fields from one form state", () => {
    const expense: Expense = {
      id: "expense-dimdim-1",
      title: "Dim sum",
      amount: 240,
      paidBy: "member-aom",
      splits: {},
      category: "food",
      itineraryItemId: "item-dimdim",
      version: 1,
    };
    const editing = startContextRailExpenseEdit(expense);

    expect(editing).toEqual({
      editingExpenseId: "expense-dimdim-1",
      formValues: {
        amount: "240",
        category: "food",
        paidBy: "member-aom",
        title: "Dim sum",
      },
    });
    expect(resetContextRailExpenseFormAfterSubmit(editing)).toEqual({
      editingExpenseId: null,
      formValues: {
        amount: "",
        category: "food",
        paidBy: "member-aom",
        title: "",
      },
    });
  });

  it("creates expenses with normalized form values", () => {
    const { result, onCreateExpense, onUpdateExpense } = createHook({
      selectedItemId: "item-dimdim",
    });

    act(() => {
      result.current.setExpenseTitle(" Taxi ");
      result.current.onAmountChange({
        target: { value: "120.5" },
      } as ChangeEvent<HTMLInputElement>);
      result.current.setExpensePaidBy("member-beam");
      result.current.setExpenseCategory("transport");
    });
    submit(result);

    expect(onCreateExpense).toHaveBeenCalledWith({
      itemId: "item-dimdim",
      title: "Taxi",
      amount: 120.5,
      paidBy: "member-beam",
      category: "transport",
    });
    expect(onUpdateExpense).not.toHaveBeenCalled();
    expect(result.current.expenseTitle).toBe("");
    expect(result.current.expenseAmount).toBe("");
  });

  it("updates the active edited expense and resets edit mode", () => {
    const { result, onCreateExpense, onUpdateExpense } = createHook();
    const expense: Expense = {
      id: "expense-dimdim-1",
      title: "Dim sum",
      amount: 240,
      paidBy: "member-aom",
      splits: {},
      category: "food",
      itineraryItemId: "item-dimdim",
      version: 1,
    };

    act(() => {
      result.current.startEditingExpense(expense);
      result.current.setExpenseTitle("Dim sum edited");
      result.current.onAmountChange({
        target: { value: "260" },
      } as ChangeEvent<HTMLInputElement>);
      result.current.setExpenseCategory("tickets");
    });
    submit(result);

    expect(onUpdateExpense).toHaveBeenCalledWith({
      expenseId: "expense-dimdim-1",
      title: "Dim sum edited",
      amount: 260,
      paidBy: "member-aom",
      category: "tickets",
    });
    expect(onCreateExpense).not.toHaveBeenCalled();
    expect(result.current.editingExpenseId).toBeNull();
  });

  it("ignores blank titles, invalid amounts, and negative amounts", () => {
    const { result, onCreateExpense, onUpdateExpense } = createHook();

    submit(result);
    act(() => {
      result.current.setExpenseTitle("Taxi");
      result.current.onAmountChange({
        target: { value: "not-a-number" },
      } as ChangeEvent<HTMLInputElement>);
    });
    submit(result);
    act(() => {
      result.current.onAmountChange({
        target: { value: "-1" },
      } as ChangeEvent<HTMLInputElement>);
    });
    submit(result);

    expect(onCreateExpense).not.toHaveBeenCalled();
    expect(onUpdateExpense).not.toHaveBeenCalled();
  });

  it("exports the canonical category order used by context rail expense forms", () => {
    expect(contextRailExpenseCategoryOptions).toEqual([
      "food",
      "transport",
      "tickets",
      "stay",
      "shopping",
      "settlement",
    ]);
  });
});
