import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { seedTrip } from "@/src/trip/seed";
import {
  loadPersistedTripDraft,
  openItineraryHeaderControls,
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit local Trip Plan creation", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("creates a named local Trip Plan and selects it without copying itinerary rows", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    const selector = (await screen.findByLabelText(
      "Trip Plan",
    )) as HTMLSelectElement;
    await user.click(screen.getByRole("button", { name: "เพิ่มแผน" }));
    await user.type(screen.getByPlaceholderText("ตั้งชื่อแผน"), "Museum Day");
    await user.click(screen.getByRole("button", { name: "สร้างแผน" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Trip Plan")).toHaveDisplayValue(
        "Museum Day - ร่าง",
      ),
    );
    expect(selector).toHaveValue(
      (screen.getByRole("option", { name: "Museum Day - ร่าง" }) as HTMLOptionElement)
        .value,
    );
    expect(
      screen.queryByRole("row", { name: /Dim Dim Sum/i }),
    ).not.toBeInTheDocument();
    const persistedTrip = loadPersistedTripDraft(window.localStorage);
    expect(persistedTrip.activePlanVariantId).toBe(seedTrip.activePlanVariantId);
    expect(persistedTrip.mainTripPlanId).toBe(
      seedTrip.mainTripPlanId ?? seedTrip.activePlanVariantId,
    );
    expect(persistedTrip.planVariants).toEqual(persistedTrip.tripPlans);
    expect(
      persistedTrip.planVariants.find((plan) => plan.id === selector.value),
    ).toMatchObject({ kind: "draft", status: "draft" });
  });
});
