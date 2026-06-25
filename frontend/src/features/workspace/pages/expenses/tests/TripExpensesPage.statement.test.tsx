import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderExpenses } from "../testing/support/render-expenses-page";

describe("TripExpensesPage statement", () => {
  it("shows account payback suggestions and the owner statement without duplicating the trip ledger", async () => {
    const user = userEvent.setup();
    renderExpenses();

    await user.click(screen.getByRole("tab", { name: /รายการบัญชี/i }));

    const panel = screen.getByRole("tabpanel", { name: /รายการบัญชี/i });
    expect(within(panel).getByRole("heading", { name: "รายการละเอียด" })).toBeInTheDocument();
    expect(within(panel).getByText(/ดูว่าแต่ละรายการคือค่าอะไร/i)).toBeInTheDocument();
    expect(within(panel).getByRole("heading", { name: "รายการจ่ายคืนที่แนะนำ" })).toBeInTheDocument();
    expect(within(panel).getByText(/Travel Mate จ่าย Family Member/i)).toBeInTheDocument();
    expect(within(panel).getByText(/รายการต้องเคลียร์/i)).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: /คัดลอกข้อความเตือน/i })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: /บันทึกจ่ายคืน/i })).toBeInTheDocument();

    const personalStatement = within(panel).getByRole("table", { name: /รายการบัญชีส่วนตัวของ Travel Mate/i });
    expect(personalStatement).toHaveClass("expense-personal-statement-table");
    expect(within(personalStatement).getByRole("columnheader", { name: "ค่าอะไร" })).toBeVisible();
    expect(within(personalStatement).getByRole("columnheader", { name: "วิธีเคลียร์" })).toBeVisible();
    expect(within(personalStatement).getByText("วันที่ 1 · 2026-06-18")).toBeInTheDocument();
    expect(within(personalStatement).getByText("วันที่ 3 · 2026-06-20")).toBeInTheDocument();
    expect(within(personalStatement).getByText("Aom received Beam payback")).toBeInTheDocument();
    expect(within(personalStatement).getByText("เราจ่ายคืน")).toBeInTheDocument();
    expect(within(personalStatement).getByText("จ่ายให้ Demo Traveler")).toBeInTheDocument();
    expect(within(personalStatement).getByText("Luk Yu dinner")).toBeInTheDocument();
    expect(within(personalStatement).getAllByText("Explorer Friend จ่ายแทนเรา").length).toBeGreaterThan(0);
    expect(within(panel).queryByRole("table", { name: /รายการเงินทริปแบบละเอียด/i })).not.toBeInTheDocument();
    expect(within(panel).queryByRole("radio", { name: /ไม่ต้องคืน|ตรวจยอด|ทั้งหมด/i })).not.toBeInTheDocument();
    expect(within(panel).queryByText("ไม่ผูกวัน")).not.toBeInTheDocument();
    expect(within(panel).queryByRole("button", { name: /แก้ไข|ลบ|บันทึกเงินคืน/i })).not.toBeInTheDocument();
  });

  it("keeps the personal statement item column on the same cell shell as the row", async () => {
    const user = userEvent.setup();
    renderExpenses();

    await user.click(screen.getByRole("tab", { name: /รายการบัญชี/i }));

    const personalStatement = within(screen.getByRole("tabpanel", { name: /รายการบัญชี/i }))
      .getByRole("table", { name: /รายการบัญชีส่วนตัวของ Travel Mate/i });
    const itemContent = within(personalStatement).getByText("Luk Yu dinner").closest("div");
    const itemCell = itemContent?.closest("td");

    expect(itemCell).toHaveClass("text-xs", "font-bold", "leading-5", "text-(--color-text-muted)");
    expect(itemContent).toHaveClass("grid", "min-w-0", "gap-1");
  });

  it("keeps setup tools out of the statement tab", async () => {
    const user = userEvent.setup();
    renderExpenses();

    await user.click(screen.getByRole("tab", { name: /รายการบัญชี/i }));

    const panel = screen.getByRole("tabpanel", { name: /รายการบัญชี/i });
    expect(within(panel).getByRole("region", { name: /รายการเงินแบบละเอียด/i })).toBeInTheDocument();
    expect(within(panel).queryByRole("region", { name: /^เครื่องมือ$/i })).not.toBeInTheDocument();
    expect(within(panel).queryByLabelText(/สกุลเงินที่แสดง/i)).not.toBeInTheDocument();
  });

  it("shows setup controls and a calculator in the tools tab", async () => {
    const user = userEvent.setup();
    renderExpenses();

    await user.click(screen.getByRole("tab", { name: /^เครื่องมือ$/i }));

    const panel = screen.getByRole("tabpanel", { name: /^เครื่องมือ$/i });
    expect(within(panel).getByRole("region", { name: /เครื่องคิดเลข/i })).toBeInTheDocument();
    await user.type(within(panel).getByLabelText(/สมการ/i), "90+64+40-14");
    expect(within(panel).getByText("ผลลัพธ์ HK$180.00")).toBeInTheDocument();
    expect(within(panel).getByLabelText(/สกุลเงินที่แสดง/i)).toHaveValue("HKD");
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

    await user.click(screen.getByRole("tab", { name: /รายการบัญชี/i }));
    const panel = screen.getByRole("tabpanel", { name: /รายการบัญชี/i });
    expect(within(panel).getByText("บัญชีนี้ไม่มียอดจ่ายคืนที่ต้องจัดการ")).toBeInTheDocument();
  });
});
