import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { TripApiError } from "@/src/trip/api-client";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { seedTrip } from "@/src/trip/seed";
import {
  createApiClientForTrip,
  installApiSession,
  installLocalStorageStub,
  persistTripParticipantSession,
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit session restore failures", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("recovers to access instead of hanging when persisted API hydration is unauthenticated", async () => {
    installLocalStorageStub();
    installApiSession({
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
