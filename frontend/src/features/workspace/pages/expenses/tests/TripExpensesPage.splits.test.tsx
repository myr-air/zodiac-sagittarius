import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { seedTrip } from "@/src/trip/seed";
import { renderExpenses } from "./TripExpensesPage.test-support";

describe("TripExpensesPage split forms", () => {
  afterEach(() => {
    window.localStorage?.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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
