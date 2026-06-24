import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderExpenses } from "../testing/support/render-expenses-page";

describe("TripExpensesPage actual expense actions", () => {
  afterEach(() => {
    window.localStorage?.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("offers a duplicate-as-estimate action without editing the actual expense", async () => {
    const user = userEvent.setup();
    const props = renderExpenses({
      onDuplicateExpenseAsEstimate: vi.fn(),
    });

    await user.click(
      screen.getByRole("button", {
        name: /ทำ Dim Dim Sum brunch เป็น estimate/i,
      }),
    );

    expect(props.onDuplicateExpenseAsEstimate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "expense-dimsum",
        title: "Dim Dim Sum brunch",
      }),
    );
    expect(props.onUpdateExpense).not.toHaveBeenCalled();
  });

  it("records a refund as a settlement instead of changing the original expense", async () => {
    const user = userEvent.setup();
    const props = renderExpenses();

    await user.click(
      screen.getByRole("button", {
        name: /บันทึก refund ของ Dim Dim Sum brunch/i,
      }),
    );

    expect(props.onCreateExpense).toHaveBeenCalledWith({
      itemId: null,
      tripPlanId: null,
      title: "Refund: Dim Dim Sum brunch",
      amount: 384,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      notes: "Refund settlement for actual expense: Dim Dim Sum brunch",
      paidBy: "member-aom",
      category: "settlement",
      splits: {
        "member-beam": 128,
        "member-nam": 128,
        "member-family": 128,
      },
    });
    expect(props.onUpdateExpense).not.toHaveBeenCalled();
  });

  it("cancels an actual expense through the ledger action", async () => {
    const user = userEvent.setup();
    const props = renderExpenses();

    await user.click(
      screen.getByRole("button", { name: /ยกเลิก Dim Dim Sum brunch/i }),
    );

    expect(props.onDeleteExpense).toHaveBeenCalledWith("expense-dimsum");
  });
});
