import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderExpenses } from "../testing/support/render-expenses-page";

describe("TripExpensesPage overview and filters", () => {
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
});
