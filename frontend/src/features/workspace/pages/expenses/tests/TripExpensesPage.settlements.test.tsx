import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderExpenses } from "../testing/support/render-expenses-page";

describe("TripExpensesPage settlement exports", () => {
  afterEach(() => {
    window.localStorage?.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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

  it("blocks duplicate settlement records while the same payback is pending", async () => {
    const user = userEvent.setup();
    let resolveCreate: (() => void) | undefined;
    const onCreateExpense = vi.fn(() => new Promise<void>((resolve) => {
      resolveCreate = resolve;
    }));
    renderExpenses({ onCreateExpense });
    const paybackButton = screen.getAllByRole("button", { name: /บันทึกจ่ายคืน/i })[0];

    await user.dblClick(paybackButton);

    expect(onCreateExpense).toHaveBeenCalledTimes(1);
    expect(paybackButton).toBeDisabled();
    resolveCreate?.();
  });

  it("copies a shareable settlement statement for the group chat", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderExpenses();

    await user.click(screen.getByRole("tab", { name: /ตั้งค่า/i }));
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

    await user.click(screen.getByRole("tab", { name: /ตั้งค่า/i }));
    await user.click(screen.getByRole("button", { name: /ส่งออก/i }));

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
