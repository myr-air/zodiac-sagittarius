import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderExpenses } from "../testing/support/render-expenses-page";

describe("TripExpensesPage statement", () => {
  it("shows a read-only detailed statement with date, payer, payment source, and settlement status", async () => {
    const user = userEvent.setup();
    renderExpenses();

    await user.click(screen.getByRole("tab", { name: /รายการละเอียด/i }));

    const panel = screen.getByRole("tabpanel", { name: /รายการละเอียด/i });
    expect(within(panel).getByRole("heading", { name: "รายการละเอียด" })).toBeInTheDocument();
    expect(within(panel).getByText(/ดูว่าแต่ละรายการคือค่าอะไร/i)).toBeInTheDocument();

    const personalStatement = within(panel).getByRole("table", { name: /รายการบัญชีส่วนตัวของ Travel Mate/i });
    expect(personalStatement).toHaveClass("expense-personal-statement-table");
    expect(within(personalStatement).getByRole("columnheader", { name: "ค่าอะไร" })).toBeVisible();
    expect(within(personalStatement).getByRole("columnheader", { name: "วิธีเคลียร์" })).toBeVisible();
    expect(within(personalStatement).getByText("Aom received Beam payback")).toBeInTheDocument();
    expect(within(personalStatement).getByText("เราจ่ายคืน")).toBeInTheDocument();
    expect(within(personalStatement).getByText("จ่ายให้ Demo Traveler")).toBeInTheDocument();
    expect(within(personalStatement).getByText("Luk Yu dinner")).toBeInTheDocument();
    expect(within(personalStatement).getAllByText("Explorer Friend จ่ายแทนเรา").length).toBeGreaterThan(0);

    const statement = within(panel).getByRole("table", { name: /รายการเงินทริปแบบละเอียด/i });
    expect(statement).toHaveClass("expense-statement-table");
    expect(within(statement).getByRole("columnheader", { name: "วัน" })).toBeVisible();
    expect(within(statement).getByRole("columnheader", { name: "ที่มาของรายการ" })).toBeVisible();
    expect(within(statement).getByText("Airport Express group tickets")).toBeInTheDocument();
    expect(within(statement).getAllByText("บันทึกในบัญชี").length).toBeGreaterThan(0);
    expect(within(statement).getAllByText("ตรวจยอด").length).toBeGreaterThan(0);
    expect(within(statement).getAllByText(/ยังไม่ยืนยันว่าเคลียร์ครบ/i).length).toBeGreaterThan(0);
    expect(within(statement).getAllByLabelText("เหตุผล").length).toBeGreaterThan(0);
    expect(within(statement).getByText("Aom received Beam payback")).toBeInTheDocument();
    expect(within(statement).getByText("เคลียร์ยอดแล้ว")).toBeInTheDocument();
    expect(within(panel).queryByRole("button", { name: /แก้ไข|ลบ|บันทึกเงินคืน/i })).not.toBeInTheDocument();
  });

  it("filters statement rows by settlement review state", async () => {
    const user = userEvent.setup();
    renderExpenses();

    await user.click(screen.getByRole("tab", { name: /รายการละเอียด/i }));
    const panel = screen.getByRole("tabpanel", { name: /รายการละเอียด/i });
    await user.click(within(panel).getByRole("radio", { name: /ไม่ต้องคืน/i }));

    const statement = within(panel).getByRole("table", { name: /รายการเงินทริปแบบละเอียด/i });
    expect(within(statement).getByText("Pacific Place personal shopping")).toBeInTheDocument();
    expect(within(statement).queryByText("Airport Express group tickets")).not.toBeInTheDocument();
    expect(within(statement).queryByText("Aom received Beam payback")).not.toBeInTheDocument();
  });
});
