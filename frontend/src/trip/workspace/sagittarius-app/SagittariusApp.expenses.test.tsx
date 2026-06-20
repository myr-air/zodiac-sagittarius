import {
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { tripStorageKey } from "@/src/trip/repository";
import { seedTrip } from "@/src/trip/seed";
import type { Trip } from "@/src/trip/types";
import {
  installLocalStorageStub,
  openItineraryHeaderControls,
  render,
  tripWithPlans,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit expenses", () => {
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

    await user.click(screen.getByRole("button", { name: /เพิ่มค่าใช้จ่าย/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    await user.type(
      within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i),
      "Late night taxi",
    );
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "100");
    await user.selectOptions(
      within(dialog).getByLabelText(/แบ่งแบบ/i),
      "exact",
    );
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

    const expenseTable = screen.getByRole("table", { name: /รายการค่าใช้จ่าย/i });
    expect(within(expenseTable).getByText("Late night taxi")).toBeInTheDocument();
    expect(expenseTable).toHaveTextContent("HK$100.00");
    const persistedTrip = JSON.parse(localStorage.getItem(tripStorageKey)!) as Trip;
    expect(
      persistedTrip.expenses.find((expense) => expense.title === "Late night taxi"),
    ).toMatchObject({
      tripPlanId: seedTrip.activePlanVariantId,
      itineraryItemId: null,
    });
  });

  it("adds unlinked local expenses to the selected Trip Plan", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    storage.setItem(tripStorageKey, JSON.stringify(draftTrip));

    render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    await screen.findByRole("option", { name: "Rain Plan - ร่าง" });
    await user.selectOptions(screen.getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    await user.click(screen.getByRole("link", { name: /ค่าใช้จ่าย/i }));
    await user.click(
      await screen.findByRole("button", { name: /เพิ่มค่าใช้จ่าย/i }),
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

    const expenseTable = screen.getByRole("table", { name: /รายการค่าใช้จ่าย/i });
    await waitFor(() => {
      expect(within(expenseTable).getByText("Rain plan taxi")).toBeInTheDocument();
    });
    const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
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
    storage.setItem(tripStorageKey, JSON.stringify(draftTrip));

    render(<SagittariusApp initialView="expenses" />);

    await screen.findByRole("region", { name: /เงินทริป/i });
    await user.click(screen.getByRole("button", { name: /แก้ไข Dim Dim Sum brunch/i }));
    const dialog = screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i });
    await user.selectOptions(within(dialog).getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }),
    );

    await waitFor(() => {
      const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
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

  it("duplicates a local actual expense as a booking estimate without creating real money", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    storage.setItem(tripStorageKey, JSON.stringify({
      ...draftTrip,
      bookingDocs: [],
    }));

    render(<SagittariusApp initialView="expenses" />);

    await screen.findByRole("region", { name: /เงินทริป/i });
    await user.click(
      screen.getByRole("button", {
        name: /ทำ Dim Dim Sum brunch เป็น estimate/i,
      }),
    );

    await waitFor(() => {
      const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
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
    storage.setItem(tripStorageKey, JSON.stringify(draftTrip));

    render(<SagittariusApp initialView="expenses" />);

    await screen.findByRole("region", { name: /เงินทริป/i });
    await user.click(
      screen.getByRole("button", {
        name: /บันทึก refund ของ Dim Dim Sum brunch/i,
      }),
    );

    await waitFor(() => {
      const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
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
