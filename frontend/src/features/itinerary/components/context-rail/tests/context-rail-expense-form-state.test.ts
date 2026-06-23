import { describe, expect, it } from "vitest";
import type { Expense } from "@/src/trip/types";
import {
  buildContextRailExpenseSubmission,
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

  it("builds normalized expense submissions from create and edit state", () => {
    const createState = updateContextRailExpenseFormValue(
      updateContextRailExpenseFormValue(
        initialContextRailExpenseFormState("member-owner"),
        "title",
        "  Taxi  ",
      ),
      "amount",
      "120.5",
    );
    const editState = startContextRailExpenseEdit({
      id: "expense-dimdim-1",
      title: "Dim sum",
      amount: 240,
      paidBy: "member-aom",
      splits: {},
      category: "food",
      itineraryItemId: "item-dimdim",
      version: 1,
    });

    expect(buildContextRailExpenseSubmission(createState)).toEqual({
      amount: 120.5,
      category: "food",
      expenseId: null,
      paidBy: "member-owner",
      title: "Taxi",
    });
    expect(buildContextRailExpenseSubmission(editState)).toEqual({
      amount: 240,
      category: "food",
      expenseId: "expense-dimdim-1",
      paidBy: "member-aom",
      title: "Dim sum",
    });
    expect(buildContextRailExpenseSubmission({
      ...createState,
      formValues: { ...createState.formValues, amount: "-1" },
    })).toBeNull();
  });
});
