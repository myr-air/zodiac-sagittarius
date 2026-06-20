import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import {
  TripApiError,
  type TripCockpit,
} from "@/src/trip/api-client";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { seedTrip } from "@/src/trip/seed";
import {
  createApiClientForTrip,
  createDeferred,
  installLocalStorageStub,
  persistTripParticipantSession,
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit session restore", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("hydrates a persisted API session before the backend trip is in local state", async () => {
    installLocalStorageStub();
    const apiTrip = {
      ...seedTrip,
      id: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f11",
      name: "Account Created API Trip",
      joinId: "ACCOUNT-CREATED",
      joinPasswordHash: "",
      members: [
        {
          ...seedTrip.members[0],
          id: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f22",
          tripId: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f11",
          displayName: "Account Owner",
          claimPasswordHash: null,
        },
      ],
    };
    persistTripParticipantSession(window.sessionStorage, {
      tripId: apiTrip.id,
      memberId: apiTrip.members[0].id,
      sessionToken: "account-created-session-token",
    });
    const apiClient = createApiClientForTrip(apiTrip);

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="members"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        apiTrip.id,
        "account-created-session-token",
      ),
    );
    expect(
      await screen.findByRole("heading", { name: /Account Created API Trip/i }),
    ).toBeInTheDocument();
  });

  it("ignores late API hydration when the app unmounts during a persisted session load", async () => {
    installLocalStorageStub();
    const deferred = createDeferred<TripCockpit>();
    persistTripParticipantSession(window.sessionStorage, {
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

  it("recovers to access instead of hanging when persisted API hydration is unauthenticated", async () => {
    installLocalStorageStub();
    persistTripParticipantSession(window.sessionStorage, {
      sessionToken: "expired-session-token",
    });
    const apiClient = createApiClientForTrip(seedTrip);
    vi.mocked(apiClient.loadTrip).mockRejectedValue(
      new TripApiError({
        code: "unauthenticated",
        message: "session expired",
        status: 401,
      }),
    );

    render(
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
        "expired-session-token",
      ),
    );
    expect(
      await screen.findByRole("main", { name: /Account access/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/สิทธิ์ไม่ถูกต้อง/i);
    expect(
      window.sessionStorage.getItem(tripParticipantSessionStorageKey),
    ).toBeNull();
  });

  it("keeps a persisted API session when hydration fails transiently", async () => {
    const storage = installLocalStorageStub();
    persistTripParticipantSession(storage, {
      sessionToken: "network-session-token",
    });
    const apiClient = createApiClientForTrip(seedTrip);
    vi.mocked(apiClient.loadTrip).mockRejectedValue(new Error("network down"));

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        routeTripId={seedTrip.id}
        initialView="overview"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        seedTrip.id,
        "network-session-token",
      ),
    );
    expect(storage.getItem(tripParticipantSessionStorageKey)).toBeNull();
    expect(
      window.sessionStorage.getItem(tripParticipantSessionStorageKey),
    ).toContain("network-session-token");
    expect(
      screen.queryByRole("main", { name: /Account access/i }),
    ).not.toBeInTheDocument();
  });
});
