import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TripApiError } from "@/src/trip/api-client";
import type { PlanVariant, Trip } from "@/src/trip/types";
import {
  apiTripWithPlans,
  createApiClientForTrip,
  openItineraryHeaderControls,
  renderApiSagittariusApp,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit API Trip Plan conflicts", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("reloads cockpit state when API Trip Plan publish hits a version conflict", async () => {
    const user = userEvent.setup();
    const apiTrip = apiTripWithPlans();
    const reloadedPlan: PlanVariant = {
      id: "plan-variant-reloaded",
      tripId: apiTrip.id,
      name: "Reloaded Plan",
      kind: "draft",
      status: "draft",
      description: "",
      version: 3,
    };
    const reloadedTrip: Trip = {
      ...apiTrip,
      activePlanVariantId: reloadedPlan.id,
      mainTripPlanId: reloadedPlan.id,
      planVariants: [...apiTrip.planVariants, reloadedPlan],
      tripPlans: [...(apiTrip.tripPlans ?? apiTrip.planVariants), reloadedPlan],
      itineraryItems: [
        {
          ...apiTrip.itineraryItems[0],
          id: "item-reloaded-plan",
          planVariantId: reloadedPlan.id,
          activity: "Reloaded plan stop",
        },
      ],
      version: (apiTrip.version ?? 0) + 2,
    };
    const loadTrip = vi
      .fn()
      .mockResolvedValueOnce({
        trip: apiTrip,
        suggestions: [],
        tasks: [],
        stopNotes: [],
        expenseSummary: null,
      })
      .mockResolvedValueOnce({
        trip: reloadedTrip,
        suggestions: [],
        tasks: [],
        stopNotes: [],
        expenseSummary: null,
      })
      .mockResolvedValue({
        trip: reloadedTrip,
        suggestions: [],
        tasks: [],
        stopNotes: [],
        expenseSummary: null,
      });
    const apiClient = createApiClientForTrip(apiTrip, {
      loadTrip,
      setMainTripPlan: vi.fn().mockRejectedValue(
        new TripApiError({
          code: "version_conflict",
          message: "version conflict",
          status: 409,
        }),
      ),
    });

    await renderApiSagittariusApp(user, {
      initialView: "itinerary",
      apiClient,
    });

    await openItineraryHeaderControls(user);
    await user.selectOptions(await screen.findByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    await user.click(screen.getByRole("button", { name: "ใช้เป็นแผนหลัก" }));

    expect(apiClient.setMainTripPlan!).toHaveBeenCalledWith(
      apiTrip.id,
      "plan-variant-backup",
      "session-token",
      expect.objectContaining({ clientMutationId: expect.any(String) }),
    );
    await waitFor(() =>
      expect(loadTrip.mock.calls.length).toBeGreaterThanOrEqual(2),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Trip Plan")).toHaveValue(reloadedPlan.id),
    );
    expect(
      screen.getByRole("row", { name: /Reloaded plan stop/i }),
    ).toBeInTheDocument();
  }, 45_000);
});
