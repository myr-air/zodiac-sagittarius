import {
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { accountApiRoutes } from "@/src/account/api-routes";
import { accountSessionStorageKey } from "@/src/account/session-storage";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { seedTrip } from "@/src/trip/seed";
import { appRoutes } from "@/src/routes/app-routes";
import {
  createApiClientForTrip,
  installLocalStorageStub,
  mockWindowLocation,
  mockAccountTripMemberSessionFetch,
  mockRejectedAccountTripMemberSessionFetch,
  persistTrustedAccountSession,
  renderApiTripAccessSagittariusApp,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit account trip access", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("opens an account-linked trip route without asking for trip credentials", async () => {
    const storage = installLocalStorageStub();
    persistTrustedAccountSession(storage);
    const apiClient = createApiClientForTrip(seedTrip);
    const accountTripMemberSessionsRoute =
      accountApiRoutes.accountTripMemberSessions(seedTrip.id);
    const fetchSpy = mockAccountTripMemberSessionFetch({
      tripId: seedTrip.id,
      memberSession: {
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "account-member-session",
        createdAt: "2026-05-30T08:00:00.000Z",
        expiresAt: "2027-06-29T08:00:00.000Z",
      },
    });

    try {
      renderApiTripAccessSagittariusApp({
        routeTripId: seedTrip.id,
        apiClient,
      });

      expect(
        screen.getByRole("main", { name: /Opening trip/i }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/Trip ID/i)).not.toBeInTheDocument();
      await waitFor(() =>
        expect(apiClient.loadTrip).toHaveBeenCalledWith(
          seedTrip.id,
          "account-member-session",
        ),
      );
      expect(
        await screen.findByRole("navigation", { name: /เมนูวางแผน Joii/i }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/Trip ID/i)).not.toBeInTheDocument();
      expect(
        window.localStorage.getItem(tripParticipantSessionStorageKey),
      ).toBeNull();
      expect(
        window.sessionStorage.getItem(tripParticipantSessionStorageKey),
      ).toContain("account-member-session");
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining(accountTripMemberSessionsRoute),
        expect.objectContaining({
          credentials: "include",
          method: "POST",
          headers: expect.not.objectContaining({ Authorization: expect.any(String) }),
        }),
      );
    } finally {
      storage.clear();
      fetchSpy.mockRestore();
    }
  });

  it("keeps account state when account trip access check fails transiently", async () => {
    const storage = installLocalStorageStub();
    persistTrustedAccountSession(storage, "transient-account-session");
    const apiClient = createApiClientForTrip(seedTrip);
    const accountTripMemberSessionsRoute =
      accountApiRoutes.accountTripMemberSessions(seedTrip.id);
    const fetchSpy = mockRejectedAccountTripMemberSessionFetch(
      seedTrip.id,
      new Error("network down"),
    );
    const { locationSpy, replaceMock } = mockWindowLocation({
      pathname: appRoutes.tripOverview(seedTrip.id),
      search: "",
    });

    try {
      renderApiTripAccessSagittariusApp({
        routeTripId: seedTrip.id,
        apiClient,
      });

      await waitFor(() =>
        expect(fetchSpy).toHaveBeenCalledWith(
          expect.stringContaining(accountTripMemberSessionsRoute),
          expect.anything(),
        ),
      );
      expect(storage.getItem(accountSessionStorageKey)).toBeNull();
      expect(
        window.sessionStorage.getItem(accountSessionStorageKey),
      ).toBeNull();
      expect(storage.getItem(tripParticipantSessionStorageKey)).toBeNull();
      expect(replaceMock).not.toHaveBeenCalledWith(
        expect.stringContaining(appRoutes.join()),
      );
    } finally {
      locationSpy.mockRestore();
      fetchSpy.mockRestore();
      storage.clear();
    }
  });
});
