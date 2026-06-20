import {
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SagittariusApp,
} from "@/src/app/SagittariusApp";
import { seedTrip } from "@/src/trip/seed";
import {
  appRoutes,
} from "@/src/trip/workspace/sagittarius-app/support";
import {
  createApiClientForTrip,
  installLocalStorageStub,
  installSessionStorageStub,
  loginApiTrip,
  openItineraryHeaderControls,
  render,
  tripWithPlans,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit API Trip Plan expense summaries", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", appRoutes.home());
  });

  it("refreshes API expense summary for the selected Trip Plan without publishing", async () => {
    const user = userEvent.setup();
    const apiTrip = {
      ...tripWithPlans(),
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    const getExpenseSummary = vi.fn().mockImplementation(
      (
        _tripId: string,
        _sessionToken: string,
        tripPlanId?: string | null,
      ) =>
        Promise.resolve({
          groupSpend: tripPlanId === "plan-variant-backup" ? 88 : 42,
          netByMember: {},
          currentUserNetLabel: "settled",
          settlementSuggestions: [],
        }),
    );
    const apiClient = createApiClientForTrip(apiTrip, {
      getExpenseSummary,
      setMainTripPlan: vi.fn(),
    });

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="itinerary"
        apiClient={apiClient}
      />,
    );
    await loginApiTrip(user);

    await waitFor(() =>
      expect(getExpenseSummary).toHaveBeenCalledWith(
        apiTrip.id,
        "session-token",
        apiTrip.activePlanVariantId,
      ),
    );
    await openItineraryHeaderControls(user);
    await user.selectOptions(await screen.findByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);

    await waitFor(() =>
      expect(getExpenseSummary).toHaveBeenCalledWith(
        apiTrip.id,
        "session-token",
        "plan-variant-backup",
      ),
    );
    expect(apiClient.setMainTripPlan!).not.toHaveBeenCalled();
  }, 45_000);

  it("waits for a loaded API Trip Plan before refreshing the expense summary", async () => {
    const user = userEvent.setup();
    const draftTrip = tripWithPlans();
    const backendMainPlanId = "018f4e82-3000-7c00-b111-000000000001";
    const backendBackupPlanId = "018f4e82-3000-7c00-b111-000000000002";
    const planIdMap = new Map([
      [draftTrip.activePlanVariantId, backendMainPlanId],
      ["plan-variant-backup", backendBackupPlanId],
    ]);
    const apiTrip = {
      ...draftTrip,
      activePlanVariantId: backendMainPlanId,
      mainTripPlanId: backendMainPlanId,
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
      planVariants: draftTrip.planVariants.map((plan) => ({
        ...plan,
        id: planIdMap.get(plan.id) ?? plan.id,
      })),
      tripPlans: draftTrip.tripPlans?.map((plan) => ({
        ...plan,
        id: planIdMap.get(plan.id) ?? plan.id,
      })),
      itineraryItems: draftTrip.itineraryItems.map((item) => ({
        ...item,
        planVariantId: planIdMap.get(item.planVariantId) ?? item.planVariantId,
      })),
    };
    const getExpenseSummary = vi.fn().mockResolvedValue({
      groupSpend: 42,
      netByMember: {},
      currentUserNetLabel: "settled",
      settlementSuggestions: [],
    });
    const apiClient = createApiClientForTrip(apiTrip, {
      getExpenseSummary,
    });

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="itinerary"
        apiClient={apiClient}
      />,
    );
    await loginApiTrip(user);

    await waitFor(() =>
      expect(getExpenseSummary).toHaveBeenCalledWith(
        apiTrip.id,
        "session-token",
        backendMainPlanId,
      ),
    );
    expect(getExpenseSummary).not.toHaveBeenCalledWith(
      apiTrip.id,
      "session-token",
      seedTrip.activePlanVariantId,
    );
  }, 45_000);

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
      const apiTrip = {
        ...tripWithPlans(),
        members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
      };
      const getExpenseSummary = vi.fn().mockResolvedValue({
        groupSpend: 0,
        netByMember: {},
        currentUserNetLabel: "settled",
        settlementSuggestions: [],
      });
      const apiClient = createApiClientForTrip(apiTrip, {
        getExpenseSummary,
      });

      render(
        <SagittariusApp
          requireJoin
          dataSource="api"
          initialView={workspace.view}
          apiClient={apiClient}
        />,
      );
      await loginApiTrip(user);

      expect(
        await screen.findByRole("region", { name: workspace.regionName }),
      ).toBeInTheDocument();
      expect(getExpenseSummary).not.toHaveBeenCalled();
    }, 45_000);
  }
});
