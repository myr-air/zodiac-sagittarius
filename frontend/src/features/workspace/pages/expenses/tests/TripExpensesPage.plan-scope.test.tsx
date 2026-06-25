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

  it("lets organizers choose the trip plan for an unlinked actual expense", async () => {
    const user = userEvent.setup();
    const props = renderExpenses({ selectedTripPlanId: "plan-main" });

    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    await user.click(screen.getAllByRole("button", { name: /แก้ไข Dim Dim Sum brunch/i })[0]);
    const dialog = screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i });
    await user.selectOptions(within(dialog).getByLabelText("แผนทริป"), "plan-rain");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }));

    expect(props.onUpdateExpense).toHaveBeenCalledWith(expect.objectContaining({
      expenseId: "expense-dimsum",
      itemId: null,
      tripPlanId: "plan-rain",
    }));
  });

  it("uses the first available trip plan when main and active plan ids are missing", async () => {
    const user = userEvent.setup();
    const trip = {
      ...seedTrip,
      activePlanVariantId: "",
      mainTripPlanId: "",
      planVariants: [],
      tripPlans: [
        {
          id: "plan-first",
          tripId: seedTrip.id,
          name: "First saved plan",
          kind: "main" as const,
          description: "Fallback plan",
        },
        {
          id: "plan-later",
          tripId: seedTrip.id,
          name: "Later plan",
          kind: "backup" as const,
          description: "Secondary plan",
        },
      ],
    };
    const props = renderExpenses({
      trip,
      selectedTripPlanId: undefined,
      expenseSummary: buildExpenseSummary(trip.expenses, seedTrip.members[1].id),
    });

    expect(screen.getAllByLabelText("แผนทริป")[0]).toHaveValue("plan-first");

    await user.click(screen.getByRole("button", { name: /เพิ่มรายการ/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    await user.type(within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Fallback plan taxi");
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "120");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }));

    expect(props.onCreateExpense).toHaveBeenCalledWith(expect.objectContaining({
      title: "Fallback plan taxi",
      tripPlanId: "plan-first",
    }));
  });

  it("scopes generated settlement records to the fallback trip plan", async () => {
    const user = userEvent.setup();
    const trip = {
      ...seedTrip,
      activePlanVariantId: "",
      mainTripPlanId: "",
      planVariants: [],
      tripPlans: [
        {
          id: "plan-first",
          tripId: seedTrip.id,
          name: "First saved plan",
          kind: "main" as const,
          description: "Fallback plan",
        },
      ],
    };
    const props = renderExpenses({
      trip,
      selectedTripPlanId: undefined,
      expenseSummary: buildExpenseSummary(trip.expenses, seedTrip.members[1].id),
    });

    await user.click(screen.getAllByRole("button", { name: /บันทึกจ่ายคืน/i })[0]);

    expect(props.onCreateExpense).toHaveBeenCalledWith(expect.objectContaining({
      category: "settlement",
      tripPlanId: "plan-first",
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

    const audit = screen.getByRole("region", { name: /ตรวจขอบเขตของเงินจริง/i });
    expect(audit).toHaveTextContent("Dim Dim Sum brunch");
    expect(audit).toHaveTextContent("ขอบเขตที่ระบบเดาไว้: แผนฝนตก");

    await user.click(
      within(audit).getByRole("button", {
        name: /ตรวจขอบเขตของ Dim Dim Sum brunch/i,
      }),
    );

    const dialog = screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i });
    expect(within(dialog).getByLabelText("แผนทริป")).toHaveValue("plan-rain");
  });

  it("locks the trip plan to the linked stop when editing a linked expense", async () => {
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

    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    await user.click(screen.getAllByRole("button", { name: /แก้ไข Arrival taxi receipt/i })[0]);
    const dialog = screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i });
    const planSelect = within(dialog).getByLabelText("แผนทริป");

    expect(planSelect).toBeDisabled();
    expect(planSelect).toHaveValue("plan-main");
    expect(dialog).toHaveTextContent("แผนจะตามจุดที่ผูกไว้");
  });
});
