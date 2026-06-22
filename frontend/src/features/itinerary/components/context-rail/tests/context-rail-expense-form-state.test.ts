import { describe, expect, it } from "vitest";
import type { Expense } from "@/src/trip/types";
import {
  contextRailExpenseCategoryOptions,
  initialContextRailExpenseFormState,
  resetContextRailExpenseFormAfterSubmit,
  startContextRailExpenseEdit,
  updateContextRailExpenseFormValue,
} from "../context-rail-expense-form-state";

describe("context rail expense form state", () => {
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
