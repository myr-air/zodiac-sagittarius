import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import {
  installLocalStorageStub,
  loadPersistedTripDraft,
  openItineraryHeaderControls,
  persistTripDraft,
  render,
  resetSagittariusAppTestEnvironment,
  tripWithPlans,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit expense Trip Plan assignment", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("adds unlinked local expenses to the selected Trip Plan", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    persistTripDraft(storage, draftTrip);

    render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    await screen.findByRole("option", { name: "Rain Plan - ร่าง" });
    await user.selectOptions(screen.getAllByLabelText(/Trip Plan|แผนทริป/i)[0], [
      "plan-variant-backup",
    ]);
    await user.click(screen.getByRole("link", { name: /ค่าใช้จ่าย/i }));
    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    await user.click(
      await screen.findByRole("button", { name: /เพิ่มรายการ/i }),
    );
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    await user.type(
      within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i),
      "Rain plan taxi",
    );
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "180");
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }),
    );

    const expenseTable = screen.getByRole("table", { name: /บันทึกใช้จ่าย/i });
    await waitFor(() => {
      expect(within(expenseTable).getByText("Rain plan taxi")).toBeInTheDocument();
    });
    const persistedTrip = loadPersistedTripDraft(storage);
    expect(
      persistedTrip.expenses.find((expense) => expense.title === "Rain plan taxi"),
    ).toMatchObject({
      tripPlanId: "plan-variant-backup",
      itineraryItemId: null,
    });
    expect(persistedTrip.mainTripPlanId).toBe(draftTrip.mainTripPlanId);
    expect(persistedTrip.activePlanVariantId).toBe(draftTrip.activePlanVariantId);
  });

  it("moves an unlinked local actual expense to the organizer-selected Trip Plan", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    persistTripDraft(storage, draftTrip);

    render(<SagittariusApp initialView="expenses" />);

    await screen.findByRole("region", { name: /เงินทริป/i });
    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    await user.click(screen.getAllByRole("button", { name: /แก้ไข Dim Dim Sum brunch/i })[0]);
    const dialog = screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i });
    await user.selectOptions(within(dialog).getByLabelText(/Trip Plan|แผนทริป/i), [
      "plan-variant-backup",
    ]);
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }),
    );

    await waitFor(() => {
      const persistedTrip = loadPersistedTripDraft(storage);
      expect(
        persistedTrip.expenses.find((expense) => expense.id === "expense-dimsum"),
      ).toMatchObject({
        tripPlanId: "plan-variant-backup",
        itineraryItemId: null,
      });
      expect(persistedTrip.mainTripPlanId).toBe(draftTrip.mainTripPlanId);
      expect(persistedTrip.activePlanVariantId).toBe(draftTrip.activePlanVariantId);
    });
  });

  it("switches Trip Plans from the expense page and shows that plan's ledger records", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = {
      ...tripWithPlans(),
      expenses: [
        ...tripWithPlans().expenses,
        {
          ...tripWithPlans().expenses[0],
          id: "expense-rain-snack",
          title: "Rain gallery snack",
          tripPlanId: "plan-variant-backup",
          itineraryItemId: null,
        },
      ],
    };
    persistTripDraft(storage, draftTrip);

    render(<SagittariusApp initialView="expenses" />);

    await screen.findByRole("region", { name: /เงินทริป/i });
    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    expect(screen.getAllByText("Dim Dim Sum brunch").length).toBeGreaterThan(0);
    expect(screen.queryByText("Rain gallery snack")).not.toBeInTheDocument();

    await user.selectOptions(screen.getAllByLabelText(/Trip Plan|แผนทริป/i)[0], [
      "plan-variant-backup",
    ]);

    await waitFor(() => {
      expect(screen.getAllByText("Rain gallery snack").length).toBeGreaterThan(0);
    });
    expect(screen.queryByText("Dim Dim Sum brunch")).not.toBeInTheDocument();
  });
});
