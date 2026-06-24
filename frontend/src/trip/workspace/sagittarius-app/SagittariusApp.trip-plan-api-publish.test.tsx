import {
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Trip } from "@/src/trip/types";
import {
  apiTripWithPlans,
  createApiClientForTrip,
  openItineraryHeaderControls,
  renderApiSagittariusApp,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit API Trip Plan publishing", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("sets the selected API Trip Plan as Main only from the explicit action", async () => {
    const user = userEvent.setup();
    const apiTrip = apiTripWithPlans();
    const publishedTrip: Trip = {
      ...apiTrip,
      activePlanVariantId: "plan-variant-backup",
      mainTripPlanId: "plan-variant-backup",
      planVariants: [],
      tripPlans: [],
      version: (apiTrip.version ?? 0) + 1,
    };
    const apiClient = createApiClientForTrip(apiTrip, {
      setMainTripPlan: vi.fn().mockResolvedValue(publishedTrip),
    });

    await renderApiSagittariusApp(user, {
      initialView: "itinerary",
      apiClient,
    });

    await openItineraryHeaderControls(user);
    await user.selectOptions(await screen.findByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    expect(apiClient.setMainTripPlan!).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "ใช้เป็นแผนหลัก" }));

    await waitFor(() =>
      expect(apiClient.setMainTripPlan!).toHaveBeenCalledWith(
        apiTrip.id,
        "plan-variant-backup",
        "session-token",
        expect.objectContaining({ clientMutationId: expect.any(String) }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Trip Plan")).toHaveValue(
        "plan-variant-backup",
      ),
    );
    const selector = screen.getByLabelText("Trip Plan") as HTMLSelectElement;
    const optionLabels = Array.from(selector.options).map(
      (option) => option.textContent,
    );
    expect(
      optionLabels.some(
        (label) => label?.includes("Rain Plan") && label.includes("หลัก"),
      ),
    ).toBe(true);
    expect(
      optionLabels.some(
        (label) => label?.includes("แผนหลัก") && label.includes("สำรอง"),
      ),
    ).toBe(true);
    expect(
      screen.getByRole("row", { name: /Rain plan gallery/i }),
    ).toBeInTheDocument();
  }, 45_000);
});
