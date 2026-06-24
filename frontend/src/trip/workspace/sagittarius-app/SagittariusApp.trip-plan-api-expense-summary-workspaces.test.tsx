import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiTripWithPlans,
  createApiClientForTrip,
  renderApiSagittariusApp,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit API Trip Plan expense summary workspaces", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  for (const workspace of [
    {
      view: "settings",
      regionName: /Trip settings|ตั้งค่าทริป/i,
    },
    {
      view: "photos",
      regionName: /Photos & Albums|รูปภาพและอัลบั้ม/i,
    },
    {
      view: "bookings",
      regionName: /Bookings & Docs|การจองและเอกสาร/i,
    },
  ] as const) {
    it(`does not refresh API expense summary from the ${workspace.view} workspace`, async () => {
      const user = userEvent.setup();
      const apiTrip = apiTripWithPlans();
      const getExpenseSummary = vi.fn().mockResolvedValue({
        groupSpend: 0,
        netByMember: {},
        currentUserNetLabel: "settled",
        settlementSuggestions: [],
      });
      const apiClient = createApiClientForTrip(apiTrip, {
        getExpenseSummary,
      });

      await renderApiSagittariusApp(user, {
        initialView: workspace.view,
        apiClient,
      });

      expect(
        await screen.findByRole("region", { name: workspace.regionName }),
      ).toBeInTheDocument();
      expect(getExpenseSummary).not.toHaveBeenCalled();
    }, 45_000);
  }
});
