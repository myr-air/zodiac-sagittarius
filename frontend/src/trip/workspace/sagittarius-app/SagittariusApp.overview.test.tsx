import {
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SagittariusApp,
} from "@/src/app/SagittariusApp";
import {
  type TripApiClient,
  type TripCockpit,
} from "@/src/trip/api-client";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { seedTrip } from "@/src/trip/seed";
import {
  appRoutes,
} from "@/src/trip/workspace/sagittarius-app/support";
import {
  createApiClientForTrip,
  dailyBriefingFixture,
  installLocalStorageStub,
  installSessionStorageStub,
  render,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit overview", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", appRoutes.home());
  });

  it("creates overview tasks through the API client after backend login", async () => {
    const user = userEvent.setup();
    const ownerTrip = {
      ...seedTrip,
      joinPasswordHash: "",
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    const cockpit: TripCockpit = {
      trip: ownerTrip,
      suggestions: [],
      tasks: [],
      stopNotes: [],
      expenseSummary: null,
    };
    const apiClient: TripApiClient = {
      joinTrip: vi.fn().mockResolvedValue({
        trip: {
          id: ownerTrip.id,
          name: ownerTrip.name,
          destinationLabel: ownerTrip.destinationLabel,
          startDate: ownerTrip.startDate,
          endDate: ownerTrip.endDate,
          joinId: ownerTrip.joinId,
          activePlanVariantId: ownerTrip.activePlanVariantId,
          ownerMemberId: ownerTrip.members[0].id,
          version: 1,
        },
        claimableMembers: [
          {
            id: ownerTrip.members[0].id,
            tripId: ownerTrip.id,
            displayName: ownerTrip.members[0].displayName,
            role: "owner",
            accessStatus: "active",
            presence: "offline",
            color: ownerTrip.members[0].color,
            userId: null,
            claimedAt: null,
            lastSeenAt: null,
          },
        ],
        joinSessionToken: "join-session-token",
        expiresAt: "2026-05-29T00:20:00.000Z",
      }),
      claimMember: vi.fn().mockResolvedValue({
        tripId: ownerTrip.id,
        memberId: ownerTrip.members[0].id,
        sessionToken: "session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
      loginMember: vi.fn(),
      logout: vi.fn(),
      loadTrip: vi.fn().mockResolvedValue(cockpit),
      listDailyBriefings: vi.fn().mockResolvedValue([]),
      patchDailyBriefing: vi.fn(),
      patchTrip: vi.fn(),
      createPlanVariant: vi.fn(),
      patchPlanVariant: vi.fn(),
      publishPlanVariant: vi.fn(),
      createTask: vi.fn().mockResolvedValue({
        id: "task-api-created",
        title: "แลกเงิน HKD",
        status: "open",
        visibility: "shared",
        kind: "prep",
        createdBy: ownerTrip.members[0].id,
        assigneeId: ownerTrip.members[0].id,
        relatedItemId: null,
        version: 1,
      }),
      patchTask: vi.fn().mockResolvedValue({
        id: "task-api-created",
        title: "แลกเงิน HKD",
        status: "done",
        visibility: "shared",
        kind: "prep",
        createdBy: ownerTrip.members[0].id,
        assigneeId: null,
        relatedItemId: null,
        version: 2,
      }),
      patchItineraryItem: vi.fn(),
      createItineraryItem: vi.fn(),
      deleteItineraryItem: vi.fn(),
      reorderItineraryItems: vi.fn(),
      importItinerary: vi.fn(),
      createSuggestion: vi.fn(),
      approveSuggestion: vi.fn(),
      rejectSuggestion: vi.fn(),
      createStopNote: vi.fn(),
      patchStopNote: vi.fn(),
      deleteStopNote: vi.fn(),
      listMembers: vi.fn(),
      updatePresence: vi.fn(),
      createMember: vi.fn(),
      patchMember: vi.fn(),
      resetMemberClaim: vi.fn(),
      getExpenseSummary: vi.fn(),
      recordExpenseReminder: vi.fn(),
      createExpense: vi.fn(),
      patchExpense: vi.fn(),
      deleteExpense: vi.fn(),
      createBookingDoc: vi.fn(),
      patchBookingDoc: vi.fn(),
      deleteBookingDoc: vi.fn(),
      createPhotoAlbum: vi.fn(),
      patchPhotoAlbum: vi.fn(),
      deletePhotoAlbum: vi.fn(),
    };

    render(
      <SagittariusApp requireJoin dataSource="api" apiClient={apiClient} />,
    );

    fireEvent.change(screen.getByLabelText(/Trip ID/i), {
      target: { value: "HK-SZ-2025" },
    });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), {
      target: { value: "seed-trip-pass" },
    });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(
      await screen.findByRole("button", { name: /Demo Traveler/i }),
    );
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Demo Traveler/i), {
      target: { value: "owner-pin" },
    });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    const tasks = await screen.findByRole("region", {
      name: /เช็กลิสต์ของทริป/i,
    });
    await user.click(
      within(tasks).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }),
    );
    const taskDialog = screen.getByRole("dialog", { name: /เพิ่มเช็กลิสต์/i });
    await user.type(
      within(taskDialog).getByLabelText(/เพิ่มเช็กลิสต์/i),
      "แลกเงิน HKD",
    );
    await user.selectOptions(
      within(taskDialog).getByLabelText(/เก็บไว้ที่/i),
      "shared",
    );
    await user.click(
      within(taskDialog).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }),
    );

    expect(apiClient.createTask).toHaveBeenCalledWith(
      ownerTrip.id,
      "session-token",
      expect.objectContaining({
        title: "แลกเงิน HKD",
        visibility: "shared",
        assigneeId: null,
      }),
    );
    expect(within(tasks).getByText(/แลกเงิน HKD/i)).toBeInTheDocument();

    await user.click(
      within(tasks).getByRole("checkbox", { name: /แลกเงิน HKD/i }),
    );

    expect(apiClient.patchTask).toHaveBeenCalledWith(
      ownerTrip.id,
      "task-api-created",
      "session-token",
      expect.objectContaining({
        expectedVersion: 1,
        patch: { status: "done" },
      }),
    );
  }, 45_000);

  it("hydrates a persisted API session from the backend", async () => {
    installLocalStorageStub();
    const apiTrip = {
      ...seedTrip,
      name: "Persisted API Trip",
      joinPasswordHash: "",
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: apiTrip.id,
        memberId: apiTrip.members[0].id,
        sessionToken: "persisted-session-token",
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
    storage.setItem(
      "sagittarius-account-session",
      JSON.stringify({
        userId: "11111111-1111-1111-1111-111111111111",
        sessionToken: "unlinked-account-session",
        kind: "trusted",
        trustedDeviceId: "device-1",
        createdAt: "2026-05-30T10:00:00.000Z",
        expiresAt: "2030-01-01T10:00:00.000Z",
      }),
    );
    storage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[1].id,
        sessionToken: "beam-member-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
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
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const request = input instanceof Request ? input.url : String(input);
        if (
          request.includes(
            `/api/v1/account/trips/${seedTrip.id}/member-sessions`,
          )
        ) {
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
        expect.stringContaining(
          `/api/v1/account/trips/${seedTrip.id}/member-sessions`,
        ),
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
      ...seedTrip,
      name: "Weather API Trip",
      joinPasswordHash: "",
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    const briefing = dailyBriefingFixture(apiTrip.id, "2026-07-12");
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: apiTrip.id,
        memberId: apiTrip.members[0].id,
        sessionToken: "weather-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
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

  it("shows fallback daily weather briefings in the local overview", async () => {
    render(<SagittariusApp initialView="overview" />);

    const forecast = await screen.findByRole("region", {
      name: /พยากรณ์อากาศรายวัน/i,
    });
    expect(
      within(forecast).queryByText(/ยังไม่มีข้อมูลพยากรณ์อากาศ/i),
    ).not.toBeInTheDocument();
    expect(
      within(forecast).getAllByRole("button", { name: /Forecast pending/i })
        .length,
    ).toBeGreaterThan(0);
  });

  it("opens directly into the trip overview instead of a marketing landing page", () => {
    const { container } = render(<SagittariusApp />);
    const workspaceGrid = container.querySelector(".workspace-grid");
    const planningMain = container.querySelector(".planning-main");

    expect(
      screen.getAllByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i })
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("banner", { name: /Trip command bar/i }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/ศูนย์จัดการทริป/i).length).toBeGreaterThan(0);
    expect(workspaceGrid).toBeInTheDocument();
    expect(workspaceGrid).toContainElement(planningMain as HTMLElement);
    expect(container.querySelector(".workspace-shell")).toHaveClass("max-[1199px]:min-h-[calc(100dvh-48px)]");
    expect(planningMain).toHaveClass("max-[1199px]:min-h-[calc(100dvh-48px)]", "max-[1199px]:bg-(--color-surface)");
    expect(planningMain).toContainElement(
      screen.getByRole("region", { name: /Trip overview/i }),
    );
    expect(
      screen.getByRole("region", { name: /Trip overview/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryAllByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i }),
    ).toHaveLength(0);
    expect(
      screen.queryByRole("button", { name: /เปิดรายละเอียด/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /เลิกทำ/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ทำซ้ำ/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /More actions/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /แผนที่เส้นทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/hero/i)).not.toBeInTheDocument();
  });

  it("manages trip tasks from the overview checklist", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp />);

    expect(
      screen.getByRole("region", { name: /ความพร้อมของทริป/i }),
    ).toBeInTheDocument();
    const tasks = screen.getByRole("region", { name: /เช็กลิสต์ของทริป/i });
    expect(within(tasks).getByRole("button", { name: /ของฉัน/i })).toHaveClass(
      "overview-task-filter--active",
    );
    expect(within(tasks).getAllByText(/ส่วนตัว/i).length).toBeGreaterThan(0);
    expect(within(tasks).getAllByText(/แชร์ในทริป/i).length).toBeGreaterThan(0);
    expect(
      within(tasks).getByRole("checkbox", { name: /ซื้อ eSIM/i }),
    ).not.toBeChecked();

    const addTaskButton = within(tasks).getByRole("button", {
      name: /เพิ่มเช็กลิสต์/i,
    });
    expect(addTaskButton.textContent?.trim()).toBe("+");
    await user.click(addTaskButton);

    const taskDialog = screen.getByRole("dialog", { name: /เพิ่มเช็กลิสต์/i });
    await user.type(
      within(taskDialog).getByLabelText(/เพิ่มเช็กลิสต์/i),
      "แลกเงิน HKD",
    );
    await user.selectOptions(
      within(taskDialog).getByLabelText(/เก็บไว้ที่/i),
      "shared",
    );
    await user.selectOptions(
      within(taskDialog).getByLabelText(/ให้ใครดูแล/i),
      "member-nam",
    );
    await user.click(
      within(taskDialog).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }),
    );

    expect(
      screen.queryByRole("dialog", { name: /เพิ่มเช็กลิสต์/i }),
    ).not.toBeInTheDocument();

    const newTask = within(tasks).getByRole("listitem", {
      name: /แลกเงิน HKD/i,
    });
    expect(within(newTask).getByText(/Explorer Friend/i)).toBeInTheDocument();
    expect(within(newTask).getByText(/แชร์ในทริป/i)).toBeInTheDocument();

    await user.click(
      within(newTask).getByRole("checkbox", { name: /แลกเงิน HKD/i }),
    );
    expect(
      within(newTask).getByRole("checkbox", { name: /แลกเงิน HKD/i }),
    ).toBeChecked();

    await user.click(within(tasks).getByRole("button", { name: /เสร็จแล้ว/i }));

    expect(within(tasks).getByText(/แลกเงิน HKD/i)).toBeInTheDocument();
    expect(within(tasks).queryByText(/ซื้อ eSIM/i)).not.toBeInTheDocument();

    await user.click(
      within(tasks).getByRole("button", { name: /แชร์ในทริป/i }),
    );
    expect(within(tasks).getByText(/จอง Peak Tram/i)).toBeInTheDocument();

    await user.click(within(tasks).getByRole("button", { name: /ของฉัน/i }));
    await user.click(within(tasks).getByRole("button", { name: /ทุกสถานะ/i }));
    expect(within(tasks).getByText(/ซื้อ eSIM/i)).toBeInTheDocument();
    expect(within(tasks).queryByText(/จอง Peak Tram/i)).not.toBeInTheDocument();
  });
});
