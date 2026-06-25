import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import {
  installLocalStorageStub,
  loadPersistedTripDraft,
  persistTripDraft,
  render,
  resetSagittariusAppTestEnvironment,
  tripWithPlans,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit expense actions", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("duplicates a local actual expense as a booking estimate without creating real money", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    persistTripDraft(storage, {
      ...draftTrip,
      bookingDocs: [],
    });

    render(<SagittariusApp initialView="expenses" />);

    await screen.findByRole("region", { name: /เงินทริป/i });
    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    await user.click(screen.getAllByRole("button", { name: /Dim Dim Sum brunch/i })[0]);
    await user.click(
      screen.getByRole("button", {
        name: /สร้างประมาณการจองจาก Dim Dim Sum brunch/i,
      }),
    );

    await waitFor(() => {
      const persistedTrip = loadPersistedTripDraft(storage);
      expect(persistedTrip.expenses).toHaveLength(draftTrip.expenses.length);
      expect(persistedTrip.bookingDocs).toEqual([
        expect.objectContaining({
          type: "other",
          title: "Estimate: Dim Dim Sum brunch",
          status: "draft",
          priceAmount: 512,
          currency: "HKD",
          tripPlanId: draftTrip.activePlanVariantId,
          relatedExpenseIds: [],
          notes: expect.stringContaining(
            "This does not create or move real money.",
          ),
        }),
      ]);
    });
  });

  it("records a local actual expense refund as a settlement without removing the source", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    persistTripDraft(storage, draftTrip);

    render(<SagittariusApp initialView="expenses" />);

    await screen.findByRole("region", { name: /เงินทริป/i });
    await user.click(screen.getByRole("tab", { name: /จัดการค่าใช้จ่าย/i }));
    await user.click(screen.getAllByRole("button", { name: /Dim Dim Sum brunch/i })[0]);
    await user.click(
      screen.getByRole("button", {
        name: /บันทึกเงินคืนของ Dim Dim Sum brunch/i,
      }),
    );

    await waitFor(() => {
      const persistedTrip = loadPersistedTripDraft(storage);
      expect(
        persistedTrip.expenses.find((expense) => expense.id === "expense-dimsum"),
      ).toBeTruthy();
      expect(persistedTrip.expenses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: "Refund: Dim Dim Sum brunch",
            amount: 384,
            category: "settlement",
            paidBy: "member-aom",
            tripPlanId: draftTrip.activePlanVariantId,
            splits: {
              "member-beam": 128,
              "member-nam": 128,
              "member-family": 128,
            },
          }),
        ]),
      );
    });
  });
});
