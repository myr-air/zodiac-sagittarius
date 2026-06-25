import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderExpenses } from "../testing/support/render-expenses-page";

describe("TripExpensesPage statement", () => {
  it("shows account payback suggestions and the owner statement without duplicating the trip ledger", async () => {
    const user = userEvent.setup();
    renderExpenses();

    await user.click(screen.getByRole("tab", { name: /รายการและเครื่องมือ/i }));

    const panel = screen.getByRole("tabpanel", { name: /รายการและเครื่องมือ/i });
    expect(within(panel).getByRole("heading", { name: "รายการละเอียด" })).toBeInTheDocument();
    expect(within(panel).getByText(/ดูว่าแต่ละรายการคือค่าอะไร/i)).toBeInTheDocument();
    expect(within(panel).getByRole("heading", { name: "รายการจ่ายคืนที่แนะนำ" })).toBeInTheDocument();
    expect(within(panel).getByText(/Travel Mate จ่าย Family Member/i)).toBeInTheDocument();
    expect(within(panel).getByText(/รายการต้องเคลียร์/i)).toBeInTheDocument();
    await user.click(within(panel).getByRole("button", { name: /คำสั่ง/i }));
    expect(within(panel).getByRole("button", { name: /คัดลอกข้อความเตือน/i })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: /บันทึกจ่ายคืน/i })).toBeInTheDocument();

    const personalStatement = within(panel).getByRole("table", { name: /รายการบัญชีส่วนตัวของ Travel Mate/i });
    expect(personalStatement).toHaveClass("expense-personal-statement-table");
    expect(within(personalStatement).getByRole("columnheader", { name: "ค่าอะไร" })).toBeVisible();
    expect(within(personalStatement).getByRole("columnheader", { name: "วิธีเคลียร์" })).toBeVisible();
    expect(within(personalStatement).getByText("Aom received Beam payback")).toBeInTheDocument();
    expect(within(personalStatement).getByText("เราจ่ายคืน")).toBeInTheDocument();
    expect(within(personalStatement).getByText("จ่ายให้ Demo Traveler")).toBeInTheDocument();
    expect(within(personalStatement).getByText("Luk Yu dinner")).toBeInTheDocument();
    expect(within(personalStatement).getAllByText("Explorer Friend จ่ายแทนเรา").length).toBeGreaterThan(0);
    expect(within(panel).queryByRole("table", { name: /รายการเงินทริปแบบละเอียด/i })).not.toBeInTheDocument();
    expect(within(panel).queryByRole("radio", { name: /ไม่ต้องคืน|ตรวจยอด|ทั้งหมด/i })).not.toBeInTheDocument();
    expect(within(panel).queryByRole("button", { name: /แก้ไข|ลบ|บันทึกเงินคืน/i })).not.toBeInTheDocument();
  });

  it("shows an account-scoped empty payback state", async () => {
    const user = userEvent.setup();
    renderExpenses({
      expenseSummary: {
        groupSpend: 0,
        netByMember: {},
        currentUserNetLabel: "settled",
        settlementSuggestions: [],
      },
    });

    await user.click(screen.getByRole("tab", { name: /รายการและเครื่องมือ/i }));
    const panel = screen.getByRole("tabpanel", { name: /รายการและเครื่องมือ/i });
    expect(within(panel).getByText("บัญชีนี้ไม่มียอดจ่ายคืนที่ต้องจัดการ")).toBeInTheDocument();
  });
});
