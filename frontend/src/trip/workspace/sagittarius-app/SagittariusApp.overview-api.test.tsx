import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { accountApiRoutes } from "@/src/account/api-routes";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { seedTrip } from "@/src/trip/seed";
import {
  apiSeedTrip,
  createApiClientForTrip,
  dailyBriefingFixture,
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
        const request = input instanceof Request ? input.url : String(input);
        if (request.includes(accountTripMemberSessionsRoute)) {
          return new Response(
            JSON.stringify({
              code: "forbidden",
              message: "account is not linked to this trip",
            }),
            {
              status: 403,
              headers: { "content-type": "application/json" },
            },
          );
        }
        return new Response(JSON.stringify({}), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
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

  it("loads daily weather briefings into overview and saves organizer overrides", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const apiTrip = {
      ...apiSeedTrip(),
      name: "Weather API Trip",
      joinPasswordHash: "",
    };
    const briefing = dailyBriefingFixture(apiTrip.id, "2026-07-12");
    persistTripParticipantSession(window.localStorage, {
      tripId: apiTrip.id,
      memberId: apiTrip.members[0].id,
      sessionToken: "weather-session-token",
    });
    const apiClient = createApiClientForTrip(apiTrip, {
      listDailyBriefings: vi.fn().mockResolvedValue([briefing]),
      patchDailyBriefing: vi.fn().mockResolvedValue({
        ...briefing,
        manualOverrides: { outfitAdvice: "Pack a compact umbrella" },
        version: 2,
      }),
    });

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="overview"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(apiClient.listDailyBriefings).toHaveBeenCalledWith(
        apiTrip.id,
        "weather-session-token",
      ),
    );
    expect(
      await screen.findByRole("region", { name: /พยากรณ์อากาศรายวัน/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Rain 33° 28°/ }));
    expect(
      screen.getByRole("region", { name: /รายละเอียดพยากรณ์อากาศ/i }),
    ).toBeInTheDocument();
    await user.type(
      screen.getByLabelText(/Outfit advice override|คำแนะนำการแต่งตัว/i),
      "Pack a compact umbrella",
    );
    await user.click(screen.getByRole("button", { name: /บันทึก/i }));

    expect(apiClient.patchDailyBriefing).toHaveBeenCalledWith(
      apiTrip.id,
      "2026-07-12",
      "weather-session-token",
      expect.objectContaining({
        expectedVersion: 1,
        outfitAdvice: "Pack a compact umbrella",
      }),
    );
  });
});
