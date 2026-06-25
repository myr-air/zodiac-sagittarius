import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { seedTrip } from "@/src/trip/seed";
import { renderExpenses } from "../testing/support/render-expenses-page";

describe("TripExpensesPage overview and filters", () => {
  afterEach(() => {
    window.localStorage?.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders a travel money cockpit with balances, ledger filters, and settle-up actions", async () => {
    const user = userEvent.setup();
    renderExpenses();

    expect(screen.getByRole("region", { name: /เงินทริป/i })).toHaveClass("expenses-page", "grid", "bg-[#f8fafc]");
    expect(screen.getByRole("region", { name: /สรุปเงิน/i })).toHaveTextContent("HK$");
    expect(screen.getByRole("region", { name: /สรุปเงิน/i }).querySelector(".expense-stat")).toHaveClass(
      "rounded-(--radius-md)",
      "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]",
    );
    expect(screen.getByRole("region", { name: /สรุปเงิน/i }).querySelector(".expense-stat")?.className).not.toContain("linear-gradient");
    expect(screen.getByRole("region", { name: /สรุปเงิน/i }).querySelector(".expense-stat")?.className).not.toContain("0_8px_18px");
    expect(screen.getByRole("tablist", { name: /ส่วนการเงินของทริป/i })).toHaveClass("expense-finance-tabs");
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(document.querySelector(".expenses-panel")).toHaveClass("shadow-none");
    expect(document.querySelector(".expenses-panel")?.className).not.toContain("linear-gradient");
    expect(screen.getByRole("button", { name: /เพิ่มรายการ/i })).toBeEnabled();
    await user.click(screen.getAllByRole("button", { name: /คำสั่ง/i })[0]);
    expect(screen.getByRole("button", { name: /บันทึกใช้จ่ายส่วนตัว/i })).toBeEnabled();
    await user.click(screen.getAllByRole("button", { name: /คำสั่ง/i })[1]);
    expect(screen.getAllByRole("button", { name: /บันทึกจ่ายคืน/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("region", { name: /บัตรเดินทาง/i })).toHaveTextContent("Octopus");
    expect(screen.getByRole("region", { name: /บัตรเดินทาง/i })).toHaveTextContent("HK$288.00");

    expect(screen.getByRole("region", { name: /ยอดคงเหลือของเพื่อน/i })).toHaveTextContent("Travel Mate");
    expect(screen.getByRole("region", { name: /ใช้จ่ายตามประเภท/i })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    expect(document.querySelector(".expense-ledger-table thead")).not.toHaveClass("sr-only");
    expect(document.querySelector(".expense-ledger-table thead")?.className).not.toContain("linear-gradient");
    expect(document.querySelector(".expenses-command-bar")).toHaveClass("shadow-none");
    expect(document.querySelector(".expenses-command-bar")?.className).not.toContain("linear-gradient");
    expect(document.querySelector(".expenses-table-wrap")).toHaveClass("shadow-none");
    const ledger = screen.getByRole("table", { name: /บันทึกใช้จ่าย/i });
    expect(ledger).toBeInTheDocument();
    const rowButton = Array.from(ledger.querySelectorAll(".expense-ledger-row-button"))
      .find((button) => button.textContent?.includes("Dim Dim Sum brunch"));
    expect(rowButton).toBeInstanceOf(HTMLButtonElement);
    await user.click(rowButton as HTMLButtonElement);
    expect(screen.getByRole("region", { name: /Dim Dim Sum brunch/i })).toHaveTextContent("แชร์กับ");
    expect(screen.getByRole("status", { name: /สถานะอัปเดตค่าใช้จ่าย/i })).toHaveTextContent(/กำลังแสดง/i);
    await user.click(screen.getByRole("button", { name: /ตัวกรอง/i }));
    expect(screen.getAllByLabelText("แผนทริป")[0]).toHaveValue("plan-main");
    expect(within(screen.getByRole("tabpanel", { name: /จัดการค่าใช้จ่าย/i })).getByLabelText(/วัน/i)).toHaveValue("all");

    await user.click(screen.getByRole("tab", { name: /รายการและเครื่องมือ/i }));
    expect(screen.getByLabelText(/สกุลเงินที่แสดง/i)).toHaveValue("HKD");
  });

  it("keeps long desktop ledger titles selectable without widening action columns", async () => {
    const user = userEvent.setup();
    const trip = {
      ...seedTrip,
      expenses: [
        {
          ...seedTrip.expenses[0],
          id: "expense-long-title",
          title: "Octopus card permanent stored value top-up and airport express transfer adjustment",
        },
      ],
    };
    renderExpenses({
      trip,
      expenseSummary: buildExpenseSummary(trip.expenses, seedTrip.members[1].id),
    });

    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    const ledger = screen.getByRole("table", { name: /บันทึกใช้จ่าย/i });
    const rowButton = Array.from(ledger.querySelectorAll(".expense-ledger-row-button"))
      .find((button) => button.textContent?.includes("Octopus card permanent stored value top-up"));
    expect(rowButton).toBeInstanceOf(HTMLButtonElement);

    expect(rowButton).toHaveClass("expense-ledger-row-button");
    expect(rowButton?.querySelector("strong")).toHaveClass("break-words");

    await user.click(rowButton as HTMLButtonElement);
    expect(screen.getByRole("region", { name: /Octopus card permanent stored value/i })).toHaveTextContent("แชร์กับ");
  });

  it("filters the expense ledger by search text and category, then resets filters", async () => {
    const user = userEvent.setup();
    renderExpenses();

    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    const ledger = screen.getByRole("table", { name: /บันทึกใช้จ่าย/i });
    await user.type(screen.getByLabelText(/ค้นหารายการ/i), "tram");

    expect(within(ledger).getAllByText("Peak Tram tickets").length).toBeGreaterThan(0);
    expect(within(ledger).queryByText("Dim Dim Sum brunch")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ตัวกรอง/i }));
    await user.selectOptions(
      within(screen.getByRole("tabpanel", { name: /จัดการค่าใช้จ่าย/i })).getByLabelText("ประเภท"),
      "transport",
    );

    expect(screen.getByText("ไม่พบค่าใช้จ่ายตามตัวกรอง")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ล้างตัวกรอง/i }));

    expect(within(ledger).getAllByText("Dim Dim Sum brunch").length).toBeGreaterThan(0);
    expect(within(ledger).getByText("Octopus top-up")).toBeInTheDocument();
  });

  it("filters the ledger by linked itinerary day", async () => {
    const user = userEvent.setup();
    const trip = {
      ...seedTrip,
      expenses: [
        {
          ...seedTrip.expenses[0],
          id: "expense-arrival",
          itineraryItemId: "item-arrive-hkg",
          title: "Arrival taxi",
        },
        {
          ...seedTrip.expenses[1],
          id: "expense-unlinked",
          itineraryItemId: null,
          title: "General tram",
        },
      ],
    };
    renderExpenses({
      trip,
      expenseSummary: buildExpenseSummary(trip.expenses, seedTrip.members[1].id),
    });

    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    await user.click(screen.getByRole("button", { name: /ตัวกรอง/i }));
    await user.selectOptions(
      within(screen.getByRole("tabpanel", { name: /จัดการค่าใช้จ่าย/i })).getByLabelText(/วัน/i),
      "2026-06-18",
    );

    const ledger = screen.getByRole("table", { name: /บันทึกใช้จ่าย/i });
    expect(within(ledger).getAllByText("Arrival taxi").length).toBeGreaterThan(0);
    expect(within(ledger).queryByText("General tram")).not.toBeInTheDocument();
    expect(within(ledger).getByText(/2026-06-18/)).toBeInTheDocument();
  });

  it("lets create-only travelers quick-add group spend without edit access or viewer splits", async () => {
    const user = userEvent.setup();
    const onCreateExpense = vi.fn().mockResolvedValue(undefined);
    renderExpenses({
      currentMember: seedTrip.members[2],
      expenseSummary: buildExpenseSummary(seedTrip.expenses, seedTrip.members[2].id),
      canCreateExpenses: true,
      canEditExpenses: false,
      onCreateExpense,
    });

    expect(screen.getByText("เพิ่มรายการได้")).toBeInTheDocument();
    const quickAdd = screen.getByRole("region", { name: /เพิ่มค่าใช้จ่ายล่าสุด/i });
    await user.type(within(quickAdd).getByLabelText(/จำนวนเงิน/i), "300");
    await user.click(within(quickAdd).getByRole("button", { name: /บันทึกเร็ว/i }));

    expect(onCreateExpense).toHaveBeenCalledWith(expect.objectContaining({
      amount: 300,
      category: "food",
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      itemId: null,
      paidBy: seedTrip.members[2].id,
      tripPlanId: "plan-main",
      splits: expect.objectContaining({
        [seedTrip.members[0].id]: 100,
        [seedTrip.members[1].id]: 100,
        [seedTrip.members[2].id]: 100,
      }),
    }));
    expect(onCreateExpense.mock.calls[0][0].splits).not.toHaveProperty(seedTrip.members[3].id);

    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    expect(screen.queryByRole("button", { name: /แก้ไข Dim Dim Sum brunch/i })).not.toBeInTheDocument();
  });

  it("records quick spend as personal when the traveler chooses just mine", async () => {
    const user = userEvent.setup();
    const onCreateExpense = vi.fn().mockResolvedValue(undefined);
    renderExpenses({
      currentMember: seedTrip.members[2],
      expenseSummary: buildExpenseSummary(seedTrip.expenses, seedTrip.members[2].id),
      canCreateExpenses: true,
      canEditExpenses: false,
      onCreateExpense,
    });

    const quickAdd = screen.getByRole("region", { name: /เพิ่มค่าใช้จ่ายล่าสุด/i });
    await user.type(within(quickAdd).getByLabelText(/จำนวนเงิน/i), "75");
    await user.type(within(quickAdd).getByLabelText(/ชื่อค่าใช้จ่าย/i), "MTR snack");
    await user.click(within(quickAdd).getByRole("button", { name: /ของฉันคนเดียว/i }));
    await user.click(within(quickAdd).getByRole("button", { name: /บันทึกเร็ว/i }));

    expect(onCreateExpense).toHaveBeenCalledWith(expect.objectContaining({
      title: "MTR snack",
      splits: {
        [seedTrip.members[2].id]: 75,
      },
    }));
  });

  it("does not mount a selected desktop receipt detail on initial mobile ledger render", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("matchMedia", vi.fn().mockImplementation((query: string) => ({
      matches: query === "(max-width: 767px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));

    renderExpenses();
    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));

    expect(document.querySelector(".expense-transaction-detail")).toBeNull();
    const firstMobileExpense = document.querySelector(".expense-mobile-ledger button");
    expect(firstMobileExpense).toBeInstanceOf(HTMLButtonElement);
    await user.click(firstMobileExpense as HTMLButtonElement);
    expect(document.querySelector(".expense-transaction-detail")).toBeInTheDocument();
  });
});
