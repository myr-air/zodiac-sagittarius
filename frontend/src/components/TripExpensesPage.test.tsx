import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { seedTrip } from "@/src/trip/seed";
import { TripExpensesPage } from "./TripExpensesPage";

function renderExpenses(overrides: Partial<Parameters<typeof TripExpensesPage>[0]> = {}) {
  const props: Parameters<typeof TripExpensesPage>[0] = {
    trip: seedTrip,
    currentMember: seedTrip.members[1],
    expenseSummary: buildExpenseSummary(seedTrip.expenses, seedTrip.members[1].id),
    canEditExpenses: true,
    onCreateExpense: vi.fn(),
    onUpdateExpense: vi.fn(),
    onDeleteExpense: vi.fn(),
    onRecordPaybackReminder: vi.fn(),
    ...overrides,
  };
  renderWithI18n(<TripExpensesPage {...props} />, { locale: "th" });
  return props;
}

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
    expect(screen.getByRole("region", { name: /สรุปเงิน/i }).querySelector(".expense-stat")).toHaveClass("bg-(--color-surface)", "rounded-(--radius-md)");
    expect(screen.getByRole("region", { name: /ยอดคงเหลือของเพื่อน/i })).toHaveTextContent("Travel Mate");
    expect(screen.getByRole("table", { name: /รายการค่าใช้จ่าย/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /เพิ่มค่าใช้จ่าย/i })).toBeEnabled();
    expect(screen.getAllByRole("button", { name: /บันทึกจ่ายคืน/i }).length).toBeGreaterThan(0);
  });

  it("creates an expense with exact splits and an itinerary link", async () => {
    const user = userEvent.setup();
    const props = renderExpenses();

    await user.click(screen.getByRole("button", { name: /เพิ่มค่าใช้จ่าย/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
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

  it("records a settlement from a suggestion", async () => {
    const user = userEvent.setup();
    const props = renderExpenses();

    await user.click(screen.getAllByRole("button", { name: /บันทึกจ่ายคืน/i })[0]);

    expect(props.onCreateExpense).toHaveBeenCalledWith(expect.objectContaining({
      category: "settlement",
      amount: expect.any(Number),
      paidBy: expect.any(String),
      splits: expect.any(Object),
    }));
  });

  it("copies a shareable settlement statement for the group chat", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderExpenses();

    await user.click(screen.getByRole("button", { name: /คัดลอกสรุปยอด/i }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Trip money - Hong Kong + Shenzhen Trip"));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Paybacks"));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Family Member pays Travel Mate"));
    expect(screen.getByRole("status", { name: /สถานะการคัดลอกสรุปยอด/i })).toHaveTextContent("คัดลอกแล้ว");
  });

  it("downloads an expense CSV for spreadsheet audit", async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    const append = vi.fn();
    const remove = vi.fn();
    const anchor = {
      click,
      remove,
      set href(value: string) {
        this.hrefValue = value;
      },
      get href() {
        return this.hrefValue;
      },
      download: "",
      hrefValue: "",
    };
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "a") return anchor as unknown as HTMLAnchorElement;
      return originalCreateElement(tagName);
    });
    vi.spyOn(document.body, "append").mockImplementation(append);
    const createObjectURL = vi.fn().mockReturnValue("blob:expenses-csv");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    renderExpenses();

    await user.click(screen.getByRole("button", { name: /ดาวน์โหลด CSV/i }));

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchor.download).toBe("hong-kong-shenzhen-trip-expenses.csv");
    expect(append).toHaveBeenCalledWith(anchor);
    expect(click).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:expenses-csv");
  });

  it("copies a direct payback reminder for one friend", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const props = renderExpenses();

    await user.click(screen.getAllByRole("button", { name: /คัดลอก reminder/i })[0]);

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("please pay"));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Hong Kong + Shenzhen Trip"));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Mark it as paid in Joii"));
    expect(props.onRecordPaybackReminder).toHaveBeenCalledWith(expect.objectContaining({
      amount: expect.any(Number),
      from: expect.any(String),
      to: expect.any(String),
    }));
    expect(screen.getByRole("status", { name: /สถานะการคัดลอกสรุปยอด/i })).toHaveTextContent("คัดลอกแล้ว");
  });

  it("shows the last reminder time on a suggested payback", () => {
    renderExpenses({
      expenseSummary: {
        groupSpend: 120,
        netByMember: {
          "member-aom": 120,
          "member-beam": -120,
        },
        currentUserNetLabel: "You owe HK$120.00",
        settlementSuggestions: [
          {
            from: "member-beam",
            to: "member-aom",
            amount: 120,
            lastRemindedAt: "2026-06-05T12:00:00.000Z",
          },
        ],
      },
    });

    expect(screen.getByText(/เตือนล่าสุด/i)).toBeInTheDocument();
    expect(screen.getByText(/5 มิ\.ย\. 2026/i)).toBeInTheDocument();
  });
});
