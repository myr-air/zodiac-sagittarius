import { screen, waitFor, within } from "@testing-library/react";
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

  it("creates an expense with exact splits and an itinerary link", async () => {
    const user = userEvent.setup();
    const props = renderExpenses();

    await user.click(screen.getByRole("button", { name: /เพิ่มค่าใช้จ่าย/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    expect(dialog).toHaveClass("shadow-[0_10px_18px_rgb(15_23_42_/_0.14)]");
    expect(dialog.className).not.toContain("0_14px_34px");
    await user.type(within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Airport taxi");
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "300");
    await user.selectOptions(within(dialog).getByLabelText(/จ่ายโดย/i), "member-beam");
    await user.selectOptions(within(dialog).getByLabelText(/แบ่งแบบ/i), "exact");
    await user.clear(within(dialog).getByLabelText(/ส่วนของ Demo Traveler/i));
    await user.type(within(dialog).getByLabelText(/ส่วนของ Demo Traveler/i), "150");
    await user.clear(within(dialog).getByLabelText(/ส่วนของ Travel Mate/i));
    await user.type(within(dialog).getByLabelText(/ส่วนของ Travel Mate/i), "100");
    await user.clear(within(dialog).getByLabelText(/ส่วนของ Explorer Friend/i));
    await user.type(within(dialog).getByLabelText(/ส่วนของ Explorer Friend/i), "50");
    await user.selectOptions(within(dialog).getByLabelText(/ผูกกับแผน/i), "item-arrive-hkg");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }));

    expect(props.onCreateExpense).toHaveBeenCalledWith({
      itemId: "item-arrive-hkg",
      tripPlanId: "plan-main",
      title: "Airport taxi",
      amount: 300,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      paidBy: "member-beam",
      category: "transport",
      splits: {
        "member-aom": 150,
        "member-beam": 100,
        "member-nam": 50,
        "member-family": 0,
        "member-viewer": 0,
      },
    });
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

  it("creates a foreign-currency expense with an auto-filled settlement exchange rate", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ date: "2026-06-05", base: "CNY", quote: "HKD", rate: 1.1 }],
    }));
    const props = renderExpenses();

    await user.click(screen.getByRole("button", { name: /เพิ่มค่าใช้จ่าย/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    await user.type(within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Shenzhen taxi");
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "100");
    await user.selectOptions(within(dialog).getByLabelText(/สกุลเงิน/i), "CNY");
    await waitFor(() => expect(within(dialog).getByLabelText(/เรท CNY เป็น HKD/i)).toHaveValue("1.1"));
    await user.click(within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }));

    expect(props.onCreateExpense).toHaveBeenCalledWith(expect.objectContaining({
      title: "Shenzhen taxi",
      amount: 100,
      currency: "CNY",
      exchangeRateToSettlementCurrency: 1.1,
    }));
  });

  it("keeps manual exchange rate edits after auto-fill", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ date: "2026-06-05", base: "CNY", quote: "HKD", rate: 1.1 }],
    }));
    const props = renderExpenses();

    await user.click(screen.getByRole("button", { name: /เพิ่มค่าใช้จ่าย/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    await user.type(within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Manual rate taxi");
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "100");
    await user.selectOptions(within(dialog).getByLabelText(/สกุลเงิน/i), "CNY");
    const exchangeRateInput = await within(dialog).findByLabelText(/เรท CNY เป็น HKD/i);
    await waitFor(() => expect(exchangeRateInput).toHaveValue("1.1"));
    await user.clear(exchangeRateInput);
    await user.type(exchangeRateInput, "1.08");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }));

    expect(props.onCreateExpense).toHaveBeenCalledWith(expect.objectContaining({
      title: "Manual rate taxi",
      currency: "CNY",
      exchangeRateToSettlementCurrency: 1.08,
    }));
  });

  it("captures notes and repeat count for multi-day travel expenses", async () => {
    const user = userEvent.setup();
    const props = renderExpenses();

    await user.click(screen.getByRole("button", { name: /เพิ่มค่าใช้จ่าย/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    await user.type(within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Hotel night");
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "1800");
    await user.type(within(dialog).getByLabelText(/โน้ต/i), "Room 1207, includes deposit.");
    await user.clear(within(dialog).getByLabelText(/ทำซ้ำ/i));
    await user.type(within(dialog).getByLabelText(/ทำซ้ำ/i), "3");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }));

    expect(props.onCreateExpense).toHaveBeenCalledWith(expect.objectContaining({
      title: "Hotel night",
      amount: 1800,
      notes: "Room 1207, includes deposit.",
      repeatCount: 3,
    }));
  });

  it("adds a comment to an existing expense before saving edits", async () => {
    const user = userEvent.setup();
    const trip = {
      ...seedTrip,
      expenses: [
        {
          ...seedTrip.expenses[0],
          id: "expense-commented",
          title: "Dim sum receipt",
          comments: [
            {
              id: "comment-existing",
              authorId: "member-aom",
              body: "Receipt uploaded by Aom.",
              createdAt: "2026-06-05T10:00:00.000Z",
            },
          ],
        },
      ],
    };
    const props = renderExpenses({
      trip,
      expenseSummary: buildExpenseSummary(trip.expenses, seedTrip.members[1].id),
    });

    await user.click(screen.getByRole("button", { name: /แก้ไข Dim sum receipt/i }));
    const dialog = screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i });
    expect(dialog).toHaveTextContent("Receipt uploaded by Aom.");
    await user.type(within(dialog).getByLabelText(/เพิ่ม comment/i), "I'll transfer tonight.");
    await user.click(within(dialog).getByRole("button", { name: /เพิ่ม comment/i }));
    await user.click(within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }));

    expect(props.onUpdateExpense).toHaveBeenCalledWith(expect.objectContaining({
      expenseId: "expense-commented",
      comments: [
        {
          id: "comment-existing",
          authorId: "member-aom",
          body: "Receipt uploaded by Aom.",
          createdAt: "2026-06-05T10:00:00.000Z",
        },
        {
          id: expect.any(String),
          authorId: "member-beam",
          body: "I'll transfer tonight.",
          createdAt: expect.any(String),
        },
      ],
    }));
  });

  it("keeps the edit dialog open until an async expense update finishes", async () => {
    const user = userEvent.setup();
    let resolveUpdate: (() => void) | undefined;
    const onUpdateExpense = vi.fn(() => new Promise<void>((resolve) => {
      resolveUpdate = resolve;
    }));
    renderExpenses({ onUpdateExpense });

    await user.click(screen.getByRole("button", { name: /แก้ไข Dim Dim Sum brunch/i }));
    const dialog = screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i });
    await user.click(within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }));

    expect(screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i })).toBeInTheDocument();
    resolveUpdate?.();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i })).not.toBeInTheDocument());
  });

  it("creates an itemized receipt by assigning each line to the friends who shared it", async () => {
    const user = userEvent.setup();
    const trip = { ...seedTrip, members: seedTrip.members.slice(0, 3), expenses: [] };
    const props = renderExpenses({
      trip,
      currentMember: trip.members[0],
      expenseSummary: buildExpenseSummary([], trip.members[0].id),
    });

    await user.click(screen.getByRole("button", { name: /เพิ่มค่าใช้จ่าย/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    await user.type(within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Itemized receipt");
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "219.99");
    await user.selectOptions(within(dialog).getByLabelText(/แบ่งแบบ/i), "itemized");

    const firstLine = within(dialog).getByRole("group", { name: /รายการ 1/i });
    await user.clear(within(firstLine).getByLabelText(/ชื่อรายการ/i));
    await user.type(within(firstLine).getByLabelText(/ชื่อรายการ/i), "Taxi van");
    await user.clear(within(firstLine).getByLabelText(/ยอดรายการ/i));
    await user.type(within(firstLine).getByLabelText(/ยอดรายการ/i), "120");

    await user.click(within(dialog).getByRole("button", { name: /เพิ่มรายการ/i }));
    const secondLine = within(dialog).getByRole("group", { name: /รายการ 2/i });
    await user.type(within(secondLine).getByLabelText(/ชื่อรายการ/i), "Museum pass");
    await user.type(within(secondLine).getByLabelText(/ยอดรายการ/i), "99.99");
    await user.click(within(secondLine).getByLabelText(/Travel Mate/i));
    await user.click(within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }));

    expect(props.onCreateExpense).toHaveBeenCalledWith(expect.objectContaining({
      amount: 219.99,
      splits: {
        "member-aom": 90,
        "member-beam": 40,
        "member-nam": 89.99,
      },
      lineItems: [
        {
          id: expect.any(String),
          title: "Taxi van",
          amount: 120,
          participantIds: ["member-aom", "member-beam", "member-nam"],
        },
        {
          id: expect.any(String),
          title: "Museum pass",
          amount: 99.99,
          participantIds: ["member-aom", "member-nam"],
        },
      ],
    }));
  });

  it("creates a percentage expense without losing a rounding cent", async () => {
    const user = userEvent.setup();
    const props = renderExpenses();

    await user.click(screen.getByRole("button", { name: /เพิ่มค่าใช้จ่าย/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    await user.type(within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Dim sum");
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "100");
    await user.selectOptions(within(dialog).getByLabelText(/แบ่งแบบ/i), "percentage");
    await user.clear(within(dialog).getByLabelText(/ส่วนของ Demo Traveler/i));
    await user.type(within(dialog).getByLabelText(/ส่วนของ Demo Traveler/i), "33.333");
    await user.clear(within(dialog).getByLabelText(/ส่วนของ Travel Mate/i));
    await user.type(within(dialog).getByLabelText(/ส่วนของ Travel Mate/i), "33.333");
    await user.clear(within(dialog).getByLabelText(/ส่วนของ Explorer Friend/i));
    await user.type(within(dialog).getByLabelText(/ส่วนของ Explorer Friend/i), "33.334");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }));

    expect(props.onCreateExpense).toHaveBeenCalledWith(expect.objectContaining({
      amount: 100,
      splits: expect.objectContaining({
        "member-aom": 33.33,
        "member-beam": 33.33,
        "member-nam": 33.34,
      }),
    }));
  });


});
