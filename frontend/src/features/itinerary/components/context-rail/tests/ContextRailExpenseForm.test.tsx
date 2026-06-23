import type { FormEvent } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import { ContextRailExpenseForm } from "../ContextRailExpenseForm";

const labels = {
  actualOnlyHint: "Actual expenses only",
  amount: "Amount",
  category: "Category",
  create: "Add expense",
  paidBy: "Paid by",
  save: "Save",
  title: "Title",
};

describe("ContextRailExpenseForm", () => {
  it("renders editable fields and routes changes", () => {
    const onAmountChange = vi.fn();
    const onCategoryChange = vi.fn();
    const onPaidByChange = vi.fn();
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
    const onTitleChange = vi.fn();

    render(
      <ContextRailExpenseForm
        canEditExpenses
        editingExpenseId={null}
        expenseAmount="120"
        expenseCategory="food"
        expensePaidBy="member-aom"
        expenseTitle="Taxi"
        labels={labels}
        members={tripFixture.trip.members}
        onAmountChange={onAmountChange}
        onCategoryChange={onCategoryChange}
        onPaidByChange={onPaidByChange}
        onSubmit={onSubmit}
        onTitleChange={onTitleChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "MTR" } });
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "42" } });
    fireEvent.change(screen.getByLabelText("Paid by"), { target: { value: "member-beam" } });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "transport" } });
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));

    expect(onTitleChange).toHaveBeenCalledWith("MTR");
    expect(onAmountChange).toHaveBeenCalled();
    expect(onPaidByChange).toHaveBeenCalledWith("member-beam");
    expect(onCategoryChange).toHaveBeenCalledWith("transport");
    expect(onSubmit).toHaveBeenCalled();
  });

  it("disables controls when expenses cannot be edited", () => {
    render(
      <ContextRailExpenseForm
        canEditExpenses={false}
        editingExpenseId="expense-1"
        expenseAmount=""
        expenseCategory="food"
        expensePaidBy="member-aom"
        expenseTitle=""
        labels={labels}
        members={tripFixture.trip.members}
        onAmountChange={() => {}}
        onCategoryChange={() => {}}
        onPaidByChange={() => {}}
        onSubmit={() => {}}
        onTitleChange={() => {}}
      />,
    );

    expect(screen.getByLabelText("Title")).toBeDisabled();
    expect(screen.getByLabelText("Amount")).toBeDisabled();
    expect(screen.getByLabelText("Paid by")).toBeDisabled();
    expect(screen.getByLabelText("Category")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
