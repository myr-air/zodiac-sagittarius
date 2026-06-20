import {
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SagittariusApp,
} from "@/src/app/SagittariusApp";
import {
  TripApiError,
} from "@/src/trip/api-client";
import { seedTrip } from "@/src/trip/seed";
import type {
  PlanVariant,
  Trip,
} from "@/src/trip/types";
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

describe("Sagittarius cockpit API Trip Plans", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", appRoutes.home());
  });

  it("creates a Trip Plan through the API, then selects it without publishing", async () => {
    const user = userEvent.setup();
    const apiTrip = {
      ...tripWithPlans(),
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    const createdPlan: PlanVariant = {
      id: "plan-variant-api-created",
      tripId: apiTrip.id,
      name: "API Plan",
      kind: "draft",
      status: "draft",
      description: "",
      version: 1,
    };
    const apiClient = createApiClientForTrip(apiTrip, {
      createTripPlan: vi.fn().mockResolvedValue(createdPlan),
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

    await openItineraryHeaderControls(user);
    await user.click(await screen.findByRole("button", { name: "เพิ่มแผน" }));
    await user.type(screen.getByPlaceholderText("ตั้งชื่อแผน"), "API Plan");
    await user.click(screen.getByRole("button", { name: "สร้างแผน" }));

    await waitFor(() =>
      expect(apiClient.createTripPlan!).toHaveBeenCalledWith(
        apiTrip.id,
        "session-token",
        expect.objectContaining({
          name: "API Plan",
          status: "draft",
          creationMode: "blank",
          description: "",
        }),
      ),
    );
    expect(apiClient.setMainTripPlan!).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByLabelText("Trip Plan")).toHaveValue(createdPlan.id),
    );
  }, 45_000);

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

  it("sets the selected API Trip Plan as Main only from the explicit action", async () => {
    const user = userEvent.setup();
    const apiTrip = {
      ...tripWithPlans(),
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    const publishedTrip: Trip = {
      ...apiTrip,
      activePlanVariantId: "plan-variant-backup",
      mainTripPlanId: "plan-variant-backup",
      planVariants: [],
      tripPlans: [],
      version: (apiTrip.version ?? 0) + 1,
    };
    const apiClient = createApiClientForTrip(apiTrip, {
      setMainTripPlan: vi.fn().mockResolvedValue(publishedTrip),
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

    await openItineraryHeaderControls(user);
    await user.selectOptions(await screen.findByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    expect(apiClient.setMainTripPlan!).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "ใช้เป็นแผนหลัก" }));

    await waitFor(() =>
      expect(apiClient.setMainTripPlan!).toHaveBeenCalledWith(
        apiTrip.id,
        "plan-variant-backup",
        "session-token",
        expect.objectContaining({ clientMutationId: expect.any(String) }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Trip Plan")).toHaveValue(
        "plan-variant-backup",
      ),
    );
    const selector = screen.getByLabelText("Trip Plan") as HTMLSelectElement;
    const optionLabels = Array.from(selector.options).map(
      (option) => option.textContent,
    );
    expect(
      optionLabels.some(
        (label) => label?.includes("Rain Plan") && label.includes("หลัก"),
      ),
    ).toBe(true);
    expect(
      optionLabels.some(
        (label) => label?.includes("แผนหลัก") && label.includes("สำรอง"),
      ),
    ).toBe(true);
    expect(
      screen.getByRole("row", { name: /Rain plan gallery/i }),
    ).toBeInTheDocument();
  }, 45_000);

  it("reloads cockpit state when API Trip Plan publish hits a version conflict", async () => {
    const user = userEvent.setup();
    const apiTrip = {
      ...tripWithPlans(),
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    const reloadedPlan: PlanVariant = {
      id: "plan-variant-reloaded",
      tripId: apiTrip.id,
      name: "Reloaded Plan",
      kind: "draft",
      status: "draft",
      description: "",
      version: 3,
    };
    const reloadedTrip: Trip = {
      ...apiTrip,
      activePlanVariantId: reloadedPlan.id,
      mainTripPlanId: reloadedPlan.id,
      planVariants: [...apiTrip.planVariants, reloadedPlan],
      tripPlans: [...(apiTrip.tripPlans ?? apiTrip.planVariants), reloadedPlan],
      itineraryItems: [
        {
          ...apiTrip.itineraryItems[0],
          id: "item-reloaded-plan",
          planVariantId: reloadedPlan.id,
          activity: "Reloaded plan stop",
        },
      ],
      version: (apiTrip.version ?? 0) + 2,
    };
    const loadTrip = vi
      .fn()
      .mockResolvedValueOnce({
        trip: apiTrip,
        suggestions: [],
        tasks: [],
        stopNotes: [],
        expenseSummary: null,
      })
      .mockResolvedValueOnce({
        trip: reloadedTrip,
        suggestions: [],
        tasks: [],
        stopNotes: [],
        expenseSummary: null,
      })
      .mockResolvedValue({
        trip: reloadedTrip,
        suggestions: [],
        tasks: [],
        stopNotes: [],
        expenseSummary: null,
    });
    const apiClient = createApiClientForTrip(apiTrip, {
      loadTrip,
      setMainTripPlan: vi.fn().mockRejectedValue(
        new TripApiError({
          code: "version_conflict",
          message: "version conflict",
          status: 409,
        }),
      ),
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

    await openItineraryHeaderControls(user);
    await user.selectOptions(await screen.findByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    await user.click(screen.getByRole("button", { name: "ใช้เป็นแผนหลัก" }));

    expect(apiClient.setMainTripPlan!).toHaveBeenCalledWith(
      apiTrip.id,
      "plan-variant-backup",
      "session-token",
      expect.objectContaining({ clientMutationId: expect.any(String) }),
    );
    await waitFor(() => expect(loadTrip.mock.calls.length).toBeGreaterThanOrEqual(2));
    await waitFor(() =>
      expect(screen.getByLabelText("Trip Plan")).toHaveValue(
        reloadedPlan.id,
      ),
    );
    expect(
      screen.getByRole("row", { name: /Reloaded plan stop/i }),
    ).toBeInTheDocument();
  }, 45_000);
});
