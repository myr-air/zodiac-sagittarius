import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { accountApiRoutes } from "@/src/account/api-routes";
import { fetchRequestUrl } from "@/src/testing/fetch-request-url";
import { jsonResponse } from "@/src/testing/json-response";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { seedTrip } from "@/src/trip/seed";
import {
  apiSeedTrip,
  createApiClientForTrip,
  installLocalStorageStub,
  persistTripParticipantSession,
  persistTrustedAccountSession,
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit overview API sessions", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("hydrates a persisted API session from the backend", async () => {
    installLocalStorageStub();
    const apiTrip = {
      ...apiSeedTrip(),
      name: "Persisted API Trip",
      joinPasswordHash: "",
    };
    persistTripParticipantSession(window.localStorage, {
      tripId: apiTrip.id,
      memberId: apiTrip.members[0].id,
      sessionToken: "persisted-session-token",
    });
    const apiClient = createApiClientForTrip(apiTrip);

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
        apiTrip.id,
        "persisted-session-token",
      ),
    );
    expect(
      await screen.findByRole("heading", { name: /Persisted API Trip/i }),
    ).toBeInTheDocument();
  });

  it("keeps a persisted trip member session when the account is not linked to the trip", async () => {
    const storage = installLocalStorageStub();
    persistTrustedAccountSession(storage, "unlinked-account-session");
    persistTripParticipantSession(storage, {
      memberId: seedTrip.members[1].id,
      sessionToken: "beam-member-session",
    });
    const apiTrip = {
      ...seedTrip,
      name: "Beam Temp Workspace",
      members: seedTrip.members.map((member) =>
        member.id === seedTrip.members[1].id
          ? { ...member, userId: null, claimPasswordHash: null }
          : member,
      ),
    };
    const apiClient = createApiClientForTrip(apiTrip);
    const accountTripMemberSessionsRoute =
      accountApiRoutes.accountTripMemberSessions(seedTrip.id);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const request = fetchRequestUrl(input);
        if (request.includes(accountTripMemberSessionsRoute)) {
          return jsonResponse(
            {
              code: "forbidden",
              message: "account is not linked to this trip",
            },
            403,
          );
        }
        return jsonResponse({}, 404);
      });

    try {
      render(
        <SagittariusApp
          requireJoin
          dataSource="api"
          routeTripId={seedTrip.id}
          apiClient={apiClient}
        />,
      );

      await waitFor(() =>
        expect(apiClient.loadTrip).toHaveBeenCalledWith(
          seedTrip.id,
          "beam-member-session",
        ),
      );
      expect(
        await screen.findByRole("heading", { name: /Beam Temp Workspace/i }),
      ).toBeInTheDocument();
      expect(storage.getItem(tripParticipantSessionStorageKey)).toBeNull();
      expect(
        window.sessionStorage.getItem(tripParticipantSessionStorageKey),
      ).toContain("beam-member-session");
      expect(fetchSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(accountTripMemberSessionsRoute),
        expect.anything(),
      );
    } finally {
      fetchSpy.mockRestore();
      storage.clear();
    }
  });
});
