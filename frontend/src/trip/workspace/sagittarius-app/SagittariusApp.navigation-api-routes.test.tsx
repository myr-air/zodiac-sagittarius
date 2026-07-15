import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { appRoutes } from "@/src/routes/app-routes";
import {
  createApiClientForTrip,
  installApiSession,
  renderApiTripAccessSagittariusApp,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit navigation API routes", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("switches trip workspace navigation without reloading the backend cockpit", async () => {
    const user = userEvent.setup();
    installApiSession();
    window.history.pushState(null, "", appRoutes.tripOverview(seedTrip.id));
    const apiClient = createApiClientForTrip(seedTrip);

    renderApiTripAccessSagittariusApp({
      routeTripId: seedTrip.id,
      apiClient,
    });

    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole("link", { name: /แผนการเดินทาง/i }));

    expect(window.location.pathname).toBe(appRoutes.tripItinerary(seedTrip.id));
    expect(
      screen.getByRole("link", { name: /แผนการเดินทาง/i }),
    ).toHaveAttribute("aria-current", "page");
    expect(apiClient.loadTrip).toHaveBeenCalledTimes(1);
  });

  it("re-syncs workspace active link from popstate without extra loadTrip", async () => {
    installApiSession();
    window.history.pushState(null, "", appRoutes.tripItinerary(seedTrip.id));
    const apiClient = createApiClientForTrip(seedTrip);

    renderApiTripAccessSagittariusApp({
      routeTripId: seedTrip.id,
      apiClient,
    });

    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("link", { name: /แผนการเดินทาง/i })).toHaveAttribute(
      "aria-current",
      "page",
    );

    act(() => {
      window.history.pushState(null, "", appRoutes.tripTimeline(seedTrip.id));
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: /ไทม์ไลน์/i }),
      ).toHaveAttribute("aria-current", "page"),
    );
    expect(screen.getByRole("link", { name: /แผนการเดินทาง/i })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(apiClient.loadTrip).toHaveBeenCalledTimes(1);
  });
});
