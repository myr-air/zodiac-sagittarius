import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { seedTrip } from "@/src/trip/seed";
import { appRoutes, encodeReturnTo, tripRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import {
  createApiClientForTrip,
  installLocalStorageStub,
  installSessionStorageStub,
  render,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit session restore routes", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", appRoutes.home());
  });

  it("redirects /join to the trip route when a persisted API session already exists", async () => {
    installLocalStorageStub();
    const replaceMock = vi.fn();
    const originalLocation = window.location;
    const locationMock = {
      ...originalLocation,
      pathname: appRoutes.join(),
      search: "",
      replace: replaceMock,
    };
    const locationSpy = vi
      .spyOn(window, "location", "get")
      .mockReturnValue(locationMock);
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "persisted-join-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(seedTrip);

    render(
      <SagittariusApp
        accessMode="trip-access"
        requireJoin
        dataSource="api"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith(
        appRoutes.tripOverview(seedTrip.id),
      ),
    );
    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        seedTrip.id,
        "persisted-join-session-token",
      ),
    );

    locationSpy.mockRestore();
  });

  it("falls back to trip route when /join returnTo points to /trips", async () => {
    installLocalStorageStub();
    const replaceMock = vi.fn();
    const originalLocation = window.location;
    const locationMock = {
      ...originalLocation,
      pathname: appRoutes.join(),
      search: `?rt=${encodeURIComponent(encodeReturnTo(appRoutes.trips()))}`,
      replace: replaceMock,
    };
    const locationSpy = vi
      .spyOn(window, "location", "get")
      .mockReturnValue(locationMock);
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "persisted-join-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(seedTrip);

    render(
      <SagittariusApp
        accessMode="trip-access"
        requireJoin
        dataSource="api"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith(
        appRoutes.tripOverview(seedTrip.id),
      ),
    );
    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        seedTrip.id,
        "persisted-join-session-token",
      ),
    );

    locationSpy.mockRestore();
  });

  it("keeps a persisted API session when the public route uses the canonical UUID", async () => {
    installLocalStorageStub();
    const apiTrip = {
      ...seedTrip,
      id: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f11",
      name: "Canonical Route API Trip",
      joinPasswordHash: "",
      members: [
        {
          ...seedTrip.members[0],
          id: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f22",
          tripId: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f11",
          claimPasswordHash: null,
        },
      ],
    };
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: apiTrip.id,
        memberId: apiTrip.members[0].id,
        sessionToken: "canonical-route-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(apiTrip);

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="overview"
        routeTripId={apiTrip.id}
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        apiTrip.id,
        "canonical-route-session-token",
      ),
    );
    expect(
      await screen.findByRole("heading", { name: /Canonical Route API Trip/i }),
    ).toBeInTheDocument();
  });

  it("rejects a persisted API session when a canonical UUID route belongs to another trip", async () => {
    installLocalStorageStub();
    const replaceMock = vi.fn();
    const originalLocation = window.location;
    const locationMock = {
      ...originalLocation,
      pathname: tripRoutes.base("018fc9c4-9cf0-7384-93ee-9bdc9c8d8f99"),
      search: "",
      replace: replaceMock,
    };
    const locationSpy = vi
      .spyOn(window, "location", "get")
      .mockReturnValue(locationMock);

    const apiClient = createApiClientForTrip(seedTrip);
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f11",
        memberId: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f22",
        sessionToken: "other-trip-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="overview"
        routeTripId="018fc9c4-9cf0-7384-93ee-9bdc9c8d8f99"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith(
        appRoutes.join(undefined, tripRoutes.base("018fc9c4-9cf0-7384-93ee-9bdc9c8d8f99")),
      ),
    );
    expect(apiClient.loadTrip).not.toHaveBeenCalled();
    expect(
      window.sessionStorage.getItem(tripParticipantSessionStorageKey),
    ).toBeNull();

    locationSpy.mockRestore();
  });
});
