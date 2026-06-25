import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { seedTrip } from "@/src/trip/seed";
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

    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    await user.click(ledgerRowButton("Dim Dim Sum brunch"));
    await user.click(
      screen.getByRole("button", {
        name: /สร้างประมาณการจองจาก Dim Dim Sum brunch/i,
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

    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    await user.click(ledgerRowButton("Dim Dim Sum brunch"));
    await user.click(
      screen.getByRole("button", {
        name: /บันทึกเงินคืนของ Dim Dim Sum brunch/i,
      }),
    );

    expect(props.onCreateExpense).toHaveBeenCalledWith({
      itemId: null,
      tripPlanId: "plan-main",
      title: "Refund: Dim Dim Sum brunch",
      amount: 384,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      notes: "Refund settlement for actual expense: Dim Dim Sum brunch",
      paidBy: "member-aom",
      category: "settlement",
      settlementAllocations: expect.any(Array),
      splits: {
        "member-beam": 128,
        "member-nam": 128,
        "member-family": 128,
      },
    });
    expect(props.onUpdateExpense).not.toHaveBeenCalled();
  });

  it("confirms before deleting an actual expense through the ledger action", async () => {
    const user = userEvent.setup();
    const props = renderExpenses();

    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    await user.click(ledgerRowButton("Dim Dim Sum brunch"));
    await user.click(
      screen.getByRole("button", { name: /ลบ Dim Dim Sum brunch/i }),
    );

    expect(props.onDeleteExpense).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: /ลบรายการนี้/i });
    expect(dialog).toHaveTextContent(/ย้อนกลับไม่ได้/i);
    await user.click(screen.getByRole("button", { name: /ลบรายการนี้/i }));

    expect(props.onDeleteExpense).toHaveBeenCalledWith("expense-dimsum");
  });

  it("does not open the normal spend editor for payback rows", async () => {
    const user = userEvent.setup();
    const trip = {
      ...seedTrip,
      expenses: [
        {
          ...seedTrip.expenses[0],
          id: "expense-payback",
          title: "Beam paid Aom",
          category: "settlement" as const,
        },
      ],
    };
    renderExpenses({
      trip,
      expenseSummary: buildExpenseSummary(trip.expenses, seedTrip.members[1].id),
    });

    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));

    expect(screen.getAllByRole("button", { name: /แก้ไข Beam paid Aom/i })[0]).toBeDisabled();
  });
});

function ledgerRowButton(title: string): HTMLButtonElement {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>(".expense-ledger-row-button"))
    .find((candidate) => candidate.textContent?.includes(title));
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button!;
}
