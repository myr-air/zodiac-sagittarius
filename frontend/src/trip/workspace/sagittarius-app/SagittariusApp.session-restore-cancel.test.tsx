import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import type { TripCockpit } from "@/src/trip/api-client";
import { seedTrip } from "@/src/trip/seed";
import {
  createApiClientForTrip,
  createDeferred,
  installApiSession,
  installLocalStorageStub,
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit session restore cancellation", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("ignores late API hydration when the app unmounts during a persisted session load", async () => {
    installLocalStorageStub();
    const deferred = createDeferred<TripCockpit>();
    installApiSession({
      sessionToken: "slow-session-token",
    });
    const apiClient = createApiClientForTrip(seedTrip);
    vi.mocked(apiClient.loadTrip).mockReturnValue(deferred.promise);

    const { unmount } = render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="overview"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        seedTrip.id,
        "slow-session-token",
      ),
    );
    unmount();
    await act(async () => {
      deferred.resolve({
        trip: { ...seedTrip, name: "Too Late Trip" },
        suggestions: [],
        tasks: [],
        stopNotes: [],
        expenseSummary: null,
      });
      await deferred.promise;
    });

    expect(screen.queryByText(/Too Late Trip/i)).not.toBeInTheDocument();
  });
});
