import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { seedTrip } from "@/src/trip/seed";
import {
  loadPersistedTripDraft,
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit expense creation", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("adds a local shared expense from the full expenses page", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="expenses" />);

    expect(
      await screen.findByRole("region", { name: /เงินทริป/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ค่าใช้จ่าย/i })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await user.click(screen.getByRole("tab", { name: /รายการใช้จ่าย/i }));
    await user.click(screen.getByRole("button", { name: /เพิ่มรายการ/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    await user.type(
      within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i),
      "Late night taxi",
    );
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "100");
    await user.click(within(dialog).getByRole("button", { name: /จำนวนจริง/i }));
    await user.clear(within(dialog).getByLabelText(/ส่วนของ Demo Traveler/i));
    await user.type(
      within(dialog).getByLabelText(/ส่วนของ Demo Traveler/i),
      "40",
    );
    await user.clear(within(dialog).getByLabelText(/ส่วนของ Travel Mate/i));
    await user.type(
      within(dialog).getByLabelText(/ส่วนของ Travel Mate/i),
      "60",
    );
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }),
    );

    const expenseTable = screen.getByRole("table", { name: /บันทึกใช้จ่าย/i });
    expect(within(expenseTable).getByText("Late night taxi")).toBeInTheDocument();
    expect(expenseTable).toHaveTextContent("HK$100.00");
    const persistedTrip = loadPersistedTripDraft(localStorage);
    expect(
      persistedTrip.expenses.find((expense) => expense.title === "Late night taxi"),
    ).toMatchObject({
      tripPlanId: seedTrip.activePlanVariantId,
      itineraryItemId: null,
    });
  });
});
