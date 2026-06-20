import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { seedTrip } from "@/src/trip/seed";
import { renderExpenses } from "./TripExpensesPage.test-support";

describe("TripExpensesPage", () => {
  afterEach(() => {
    window.localStorage?.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders a travel money cockpit with balances, ledger filters, and settle-up actions", () => {
    renderExpenses();

    expect(screen.getByRole("region", { name: /เงินทริป/i })).toHaveClass("expenses-page", "grid", "bg-transparent");
    expect(screen.getByRole("region", { name: /สรุปเงิน/i })).toHaveTextContent("HK$");
    expect(screen.getByRole("region", { name: /สรุปเงิน/i }).querySelector(".expense-stat")).toHaveClass(
      "rounded-(--radius-md)",
      "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]",
    );
    expect(screen.getByRole("region", { name: /สรุปเงิน/i }).querySelector(".expense-stat")?.className).not.toContain("0_8px_18px");
    expect(document.querySelector(".expense-ledger-table thead")).toHaveClass("bg-(--color-surface-subtle)");
    expect(document.querySelector(".expense-ledger-table thead")?.className).not.toContain("linear-gradient");
    expect(document.querySelector(".expenses-panel")).toHaveClass("shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(document.querySelector(".expenses-panel")?.textContent).toContain("Travel Mate");
    expect(document.querySelector(".expenses-command-bar")).toHaveClass("shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(document.querySelector(".expenses-table-wrap")).toHaveClass("shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(screen.getByRole("region", { name: /ยอดคงเหลือของเพื่อน/i })).toHaveTextContent("Travel Mate");
    expect(screen.getByRole("table", { name: /รายการค่าใช้จ่าย/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /เพิ่มค่าใช้จ่าย/i })).toBeEnabled();
    expect(screen.getAllByRole("button", { name: /บันทึกจ่ายคืน/i }).length).toBeGreaterThan(0);
  });

  it("filters the expense ledger by search text and category, then resets filters", async () => {
    const user = userEvent.setup();
    renderExpenses();

    await user.type(screen.getByLabelText(/ค้นหาค่าใช้จ่าย/i), "tram");

    expect(screen.getByText("Peak Tram tickets")).toBeInTheDocument();
    expect(screen.queryByText("Dim Dim Sum brunch")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("ประเภท"), "transport");

    expect(screen.getByText("ไม่พบค่าใช้จ่ายตามตัวกรอง")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ล้างตัวกรอง/i }));

    expect(screen.getByText("Dim Dim Sum brunch")).toBeInTheDocument();
    expect(screen.getByText("Octopus top-up")).toBeInTheDocument();
  });

  it("lets organizers choose the Trip Plan for an unlinked actual expense", async () => {
    const user = userEvent.setup();
    const props = renderExpenses({ selectedTripPlanId: "plan-main" });

    await user.click(screen.getByRole("button", { name: /แก้ไข Dim Dim Sum brunch/i }));
    const dialog = screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i });
    await user.selectOptions(within(dialog).getByLabelText("Trip Plan"), "plan-rain");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }));

    expect(props.onUpdateExpense).toHaveBeenCalledWith(expect.objectContaining({
      expenseId: "expense-dimsum",
      itemId: null,
      tripPlanId: "plan-rain",
    }));
  });

  it("surfaces inferred plan scope rows for organizer review", async () => {
    const user = userEvent.setup();
    const trip = {
      ...seedTrip,
      expenses: [
        {
          ...seedTrip.expenses[0],
          tripPlanId: "plan-rain",
          itineraryItemId: null,
        },
      ],
    };
    renderExpenses({
      trip,
      selectedTripPlanId: "plan-main",
      expenseSummary: buildExpenseSummary(trip.expenses, seedTrip.members[1].id),
    });

    const audit = screen.getByRole("region", { name: /ตรวจ scope ของเงินจริง/i });
    expect(audit).toHaveTextContent("Dim Dim Sum brunch");
    expect(audit).toHaveTextContent("scope ที่ระบบเดาไว้: แผนฝนตก");

    await user.click(
      within(audit).getByRole("button", {
        name: /ตรวจ scope ของ Dim Dim Sum brunch/i,
      }),
    );

    const dialog = screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i });
    expect(within(dialog).getByLabelText("Trip Plan")).toHaveValue("plan-rain");
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

  it("locks the Trip Plan to the linked stop when editing a linked expense", async () => {
    const user = userEvent.setup();
    const trip = {
      ...seedTrip,
      expenses: [
        {
          ...seedTrip.expenses[0],
          id: "expense-linked-arrival",
          title: "Arrival taxi receipt",
          tripPlanId: "plan-main",
          itineraryItemId: "item-arrive-hkg",
        },
      ],
    };
    renderExpenses({
      trip,
      selectedTripPlanId: "plan-main",
      expenseSummary: buildExpenseSummary(trip.expenses, seedTrip.members[1].id),
    });

    await user.click(screen.getByRole("button", { name: /แก้ไข Arrival taxi receipt/i }));
    const dialog = screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i });
    const planSelect = within(dialog).getByLabelText("Trip Plan");

    expect(planSelect).toBeDisabled();
    expect(planSelect).toHaveValue("plan-main");
    expect(dialog).toHaveTextContent("แผนจะตามจุดที่ผูกไว้");
  });

});
