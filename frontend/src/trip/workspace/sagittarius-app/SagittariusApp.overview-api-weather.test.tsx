import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import {
  apiSeedTrip,
  createApiClientForTrip,
  dailyBriefingFixture,
  installLocalStorageStub,
  persistTripParticipantSession,
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit overview API weather briefings", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
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
