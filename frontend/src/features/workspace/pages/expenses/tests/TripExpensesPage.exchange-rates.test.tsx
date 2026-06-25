import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderExpenses } from "../testing/support/render-expenses-page";

describe("TripExpensesPage exchange rates", () => {
  afterEach(() => {
    window.localStorage?.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("creates a foreign-currency expense with an auto-filled settlement exchange rate", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ date: "2026-06-05", base: "CNY", quote: "HKD", rate: 1.1 }],
    }));
    const props = renderExpenses();

    await user.click(screen.getByRole("button", { name: /เพิ่มรายการ/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    await user.type(within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Shenzhen taxi");
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "100");
    await user.selectOptions(within(dialog).getByLabelText(/สกุลเงิน/i), "CNY");
    await waitFor(() => expect(within(dialog).getByLabelText(/อัตราแลกเปลี่ยน CNY เป็น HKD/i)).toHaveValue("1.1"));
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

    await user.click(screen.getByRole("button", { name: /เพิ่มรายการ/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    await user.type(within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Manual rate taxi");
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "100");
    await user.selectOptions(within(dialog).getByLabelText(/สกุลเงิน/i), "CNY");
    const exchangeRateInput = await within(dialog).findByLabelText(/อัตราแลกเปลี่ยน CNY เป็น HKD/i);
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

  it("converts the visible ledger and balances to a selected display currency", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ date: "2026-06-05", base: "HKD", quote: "THB", rate: 4.6 }),
    }));
    renderExpenses();

    await user.click(screen.getByRole("tab", { name: /^เครื่องมือ$/i }));
    await user.selectOptions(screen.getByLabelText(/สกุลเงินที่แสดง/i), "THB");

    await waitFor(() => expect(screen.getByLabelText(/อัตราแลกเปลี่ยน HKD เป็น THB/i)).toHaveValue("4.6"));
    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    expect(screen.getAllByText("฿2,355.20").length).toBeGreaterThan(0);
    const rowButton = Array.from(document.querySelectorAll<HTMLButtonElement>(".expense-ledger-row-button"))
      .find((button) => button.textContent?.includes("Dim Dim Sum brunch"));
    expect(rowButton).toBeInstanceOf(HTMLButtonElement);
    await user.click(rowButton!);
    expect(screen.getByText(/Paid in HKD\. No currency conversion needed\. Shown as ฿2,355\.20\./)).toBeInTheDocument();
  });
});
