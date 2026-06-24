import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { seedTrip } from "@/src/trip/seed";
import { renderExpenses } from "../testing/support/render-expenses-page";

describe("TripExpensesPage plan scope", () => {
  afterEach(() => {
    window.localStorage?.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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
});
