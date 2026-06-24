import { screen, waitFor } from "@testing-library/react";
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

describe("Sagittarius cockpit local Trip Plan selection", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("switches local Trip Plans and changes visible itinerary rows by planVariantId", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    persistTripDraft(storage, draftTrip);

    render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    await screen.findByRole("option", { name: "Rain Plan - ร่าง" });
    await screen.findByRole("row", { name: /Dim Dim Sum/i });
    await user.selectOptions(screen.getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);

    expect(
      await screen.findByRole("row", { name: /Rain plan gallery/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /Dim Dim Sum/i }),
    ).not.toBeInTheDocument();
    const persistedTrip = loadPersistedTripDraft(storage);
    expect(persistedTrip.activePlanVariantId).toBe(draftTrip.activePlanVariantId);
    expect(persistedTrip.mainTripPlanId).toBe(draftTrip.mainTripPlanId);
    expect(persistedTrip.planVariants).toEqual(persistedTrip.tripPlans);
    expect(
      persistedTrip.planVariants.find(
        (plan) => plan.id === "plan-variant-backup",
      ),
    ).toMatchObject({ kind: "draft", status: "draft" });
    expect(window.location.search).toContain("tripPlanId=plan-variant-backup");
  });

  it("preserves the selected Trip Plan across reload-style remounts", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    persistTripDraft(storage, draftTrip);

    const { unmount } = render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    await screen.findByRole("option", { name: "Rain Plan - ร่าง" });
    await user.selectOptions(screen.getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    expect(
      await screen.findByRole("row", { name: /Rain plan gallery/i }),
    ).toBeInTheDocument();

    unmount();
    render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    await waitFor(() =>
      expect(screen.getByLabelText("Trip Plan")).toHaveValue(
        "plan-variant-backup",
      ),
    );
    expect(
      await screen.findByRole("row", { name: /Rain plan gallery/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /Dim Dim Sum/i }),
    ).not.toBeInTheDocument();
  });
});
