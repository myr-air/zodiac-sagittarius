import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { seedTrip } from "@/src/trip/seed";
import {
  installLocalStorageStub,
  loadPersistedTripDraft,
  openItineraryHeaderControls,
  persistTripDraft,
  render,
  resetSagittariusAppTestEnvironment,
  tripWithPlans,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit local Trip Plan publishing", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("sets the selected local Trip Plan as Main only from the explicit action", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    persistTripDraft(storage, draftTrip);

    render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    await screen.findByRole("option", { name: "Rain Plan - ร่าง" });
    await user.selectOptions(screen.getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    await user.click(screen.getByRole("button", { name: "ใช้เป็นแผนหลัก" }));

    await waitFor(() => {
      const persistedTrip = loadPersistedTripDraft(storage);
      expect(persistedTrip.activePlanVariantId).toBe("plan-variant-backup");
      expect(persistedTrip.mainTripPlanId).toBe("plan-variant-backup");
      expect(
        persistedTrip.planVariants.find(
          (plan) => plan.id === "plan-variant-backup",
        ),
      ).toMatchObject({ kind: "main", status: "main" });
      expect(
        persistedTrip.planVariants.find(
          (plan) => plan.id === seedTrip.activePlanVariantId,
        ),
      ).toMatchObject({ kind: "backup", status: "backup" });
    });
  });
});
