import {
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlanVariant } from "@/src/trip/types";
import {
  apiTripWithPlans,
  createApiClientForTrip,
  openItineraryHeaderControls,
  renderApiSagittariusApp,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit API Trip Plan creation", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("creates a Trip Plan through the API, then selects it without publishing", async () => {
    const user = userEvent.setup();
    const apiTrip = apiTripWithPlans();
    const createdPlan: PlanVariant = {
      id: "plan-variant-api-created",
      tripId: apiTrip.id,
      name: "API Plan",
      kind: "draft",
      status: "draft",
      description: "",
      version: 1,
    };
    const apiClient = createApiClientForTrip(apiTrip, {
      createTripPlan: vi.fn().mockResolvedValue(createdPlan),
      setMainTripPlan: vi.fn(),
    });

    await renderApiSagittariusApp(user, {
      initialView: "itinerary",
      apiClient,
    });

    await openItineraryHeaderControls(user);
    await user.click(await screen.findByRole("button", { name: "เพิ่มแผน" }));
    await user.type(screen.getByPlaceholderText("ตั้งชื่อแผน"), "API Plan");
    await user.click(screen.getByRole("button", { name: "สร้างแผน" }));

    await waitFor(() =>
      expect(apiClient.createTripPlan!).toHaveBeenCalledWith(
        apiTrip.id,
        "session-token",
        expect.objectContaining({
          name: "API Plan",
          status: "draft",
          creationMode: "blank",
          description: "",
        }),
      ),
    );
    expect(apiClient.setMainTripPlan!).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByLabelText("Trip Plan")).toHaveValue(createdPlan.id),
    );
  }, 45_000);
});
