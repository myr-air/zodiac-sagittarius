import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SagittariusApp,
  nextClientMutationId,
  nextLocalItemId,
  nextLocalStopNoteId,
  nextLocalSuggestionId,
  nextLocalTaskId,
  replaceSuggestionById,
} from "@/src/app/SagittariusApp";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import type { ItineraryItem, StopNote, Suggestion, Trip, TripTask } from "@/src/trip/types";

function render(ui: ReactElement) {
  const result = renderWithI18n(ui, { locale: "th" });
  const originalRerender = result.rerender;

  return {
    ...result,
    rerender: (nextUi: ReactElement) => originalRerender(<I18nProvider initialLocale="th">{nextUi}</I18nProvider>),
  };
}

describe("Sagittarius cockpit UI", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  it("generates collision-free local ids and falls back when randomUUID is unavailable", () => {
    expect(nextLocalTaskId([{ id: "task-local-1" }, { id: "task-local-2" }] as TripTask[])).toBe("task-local-3");
    expect(nextLocalTaskId([{ id: "task-local-1" }, { id: "task-local-3" }] as TripTask[])).toBe("task-local-4");
    expect(nextLocalItemId([{ id: "item-local-1" }, { id: "item-local-3" }] as ItineraryItem[], "item-local")).toBe("item-local-4");
    expect(nextLocalSuggestionId([{ id: "suggestion-local-1" }, { id: "suggestion-local-3" }] as Suggestion[])).toBe("suggestion-local-4");
    expect(nextLocalStopNoteId([{ id: "note-local-1" }, { id: "note-local-2" }] as StopNote[])).toBe("note-local-3");
    expect(nextLocalStopNoteId([{ id: "note-local-1" }, { id: "note-local-3" }] as StopNote[])).toBe("note-local-4");
    expect(replaceSuggestionById(
      [{ id: "suggestion-a", status: "pending" }, { id: "suggestion-b", status: "pending" }] as Suggestion[],
      "suggestion-b",
      { id: "suggestion-b", status: "approved" } as Suggestion,
    )).toEqual([{ id: "suggestion-a", status: "pending" }, { id: "suggestion-b", status: "approved" }]);

    vi.stubGlobal("crypto", {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-29T00:00:00.000Z"));
    expect(nextClientMutationId("task")).toBe(`task-${Date.now().toString(36)}`);
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("can require trip participant authentication before opening the cockpit", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp requireJoin />);

    expect(screen.getByRole("main", { name: /Account access/i })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /เมนูวางแผน Sagittarius/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "DEMO-TRIP" } });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "demo-trip-pass" } });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), { target: { value: "traveler-pin" } });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    expect(screen.getByRole("navigation", { name: /เมนูวางแผน Sagittarius/i })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("region", { name: /Trip overview/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).not.toBeInTheDocument();
  }, 45_000);

  it("lets demo credentials enter through the canonical API join route without calling the backend", async () => {
    const user = userEvent.setup();
    const apiClient = createApiClientForTrip(seedTrip);
    render(<SagittariusApp accessMode="trip-access" requireJoin dataSource="api" apiClient={apiClient} />);

    fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "DEMO-TRIP" } });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "demo-trip-pass" } });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), { target: { value: "traveler-pin" } });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    expect(apiClient.joinTrip).not.toHaveBeenCalled();
    expect(apiClient.loadTrip).not.toHaveBeenCalled();
    expect(screen.getByRole("navigation", { name: /เมนูวางแผน Sagittarius/i })).toBeInTheDocument();
  }, 45_000);

  it("lets a guest participant leave their local session and choose another identity", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<SagittariusApp requireJoin />);

    fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "DEMO-TRIP" } });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "demo-trip-pass" } });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), { target: { value: "traveler-pin" } });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    await user.click(screen.getByRole("button", { name: /เปลี่ยนตัวตน/i }));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Explorer Friend"));
    expect(screen.getByRole("main", { name: /Account access/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /เข้าห้อง trip/i })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /เมนูวางแผน Sagittarius/i })).not.toBeInTheDocument();
  }, 45_000);

  it("persists guest participant claims across a fresh app mount", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    installLocalStorageStub();
    const { unmount } = render(<SagittariusApp requireJoin />);

    fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "DEMO-TRIP" } });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "demo-trip-pass" } });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), { target: { value: "traveler-pin" } });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));
    await user.click(screen.getByRole("button", { name: /เปลี่ยนตัวตน/i }));

    unmount();
    render(<SagittariusApp requireJoin />);

    fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "DEMO-TRIP" } });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "demo-trip-pass" } });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));

    expect(screen.getByLabelText(/รหัสของ Explorer Friend/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i)).not.toBeInTheDocument();
  });

  it("does not restore temporary or expired account sessions from local storage", async () => {
    const storage = installLocalStorageStub();
    storage.setItem(
      "sagittarius-account-session",
      JSON.stringify({
        userId: "user-temp",
        sessionToken: "temporary-account-token",
        kind: "temporary",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2099-06-28T00:00:00.000Z",
      }),
    );

    const { unmount } = render(<SagittariusApp requireJoin />);

    expect(screen.getByRole("tab", { name: /Temp access/i })).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(storage.getItem("sagittarius-account-session")).toBeNull());

    unmount();
    storage.setItem(
      "sagittarius-account-session",
      JSON.stringify({
        userId: "user-expired",
        sessionToken: "expired-account-token",
        kind: "trusted",
        createdAt: "2020-05-29T00:00:00.000Z",
        expiresAt: "2020-06-28T00:00:00.000Z",
      }),
    );

    render(<SagittariusApp requireJoin />);

    expect(screen.getByRole("tab", { name: /Temp access/i })).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(storage.getItem("sagittarius-account-session")).toBeNull());
  });

  it("hydrates a trusted account session on startup and renders account mode", async () => {
    const storage = installLocalStorageStub();
    storage.setItem(
      "sagittarius-account-session",
      JSON.stringify({
        userId: "11111111-1111-1111-1111-111111111111",
        sessionToken: "playwright-account-session",
        kind: "trusted",
        trustedDeviceId: "device-1",
        createdAt: "2026-05-30T10:00:00.000Z",
        expiresAt: "2030-01-01T10:00:00.000Z",
      }),
    );

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const request = input instanceof Request ? input.url : String(input);

      if (request.includes("/api/v1/account") && !request.includes("/api/v1/account/trips") && !request.includes("/api/v1/account/trip-stats")) {
        return new Response(
          JSON.stringify({
            profile: {
              id: "11111111-1111-1111-1111-111111111111",
              displayName: "Aom",
              avatarColor: "#0f766e",
              locale: "en-US",
              timezone: "UTC",
              primaryEmail: "aom@example.com",
            },
            passkeys: [],
            trustedDevices: [],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }

      if (request.includes("/api/v1/account/trips")) {
        return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
      }

      if (request.includes("/api/v1/account/trip-stats")) {
        return new Response(
          JSON.stringify({
            tripsTotal: 0,
            tripsOwned: 0,
            activeTrips: 0,
            tempClaimsCompleted: 0,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({}), { status: 404, headers: { "content-type": "application/json" }, statusText: "not found" });
    });

    try {
      render(<SagittariusApp requireJoin dataSource="api" />);

      expect(await screen.findByText("Profile & settings")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /^Account$/i })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tab", { name: /Temp access/i })).toHaveAttribute("aria-selected", "false");
      expect(screen.getByRole("button", { name: /Start passkey setup/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/Trip ID/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /ส่งรหัส login/i })).not.toBeInTheDocument();
      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(3));
    } finally {
      storage.clear();
      fetchSpy.mockRestore();
    }
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
      createSuggestion: vi.fn(),
      approveSuggestion: vi.fn(),
      rejectSuggestion: vi.fn(),
    };

    render(<SagittariusApp requireJoin dataSource="api" apiClient={apiClient} />);

    fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "HK-SZ-2025" } });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "dim-sum-run" } });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(await screen.findByRole("button", { name: /Demo Traveler/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Demo Traveler/i), { target: { value: "owner-pin" } });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    const tasks = await screen.findByRole("region", { name: /เช็กลิสต์ของทริป/i });
    await user.click(within(tasks).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }));
    const taskDialog = screen.getByRole("dialog", { name: /เพิ่มเช็กลิสต์/i });
    await user.type(within(taskDialog).getByLabelText(/เพิ่มเช็กลิสต์/i), "แลกเงิน HKD");
    await user.selectOptions(within(taskDialog).getByLabelText(/เก็บไว้ที่/i), "shared");
    await user.click(within(taskDialog).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }));

    expect(apiClient.createTask).toHaveBeenCalledWith(
      ownerTrip.id,
      "session-token",
      expect.objectContaining({ title: "แลกเงิน HKD", visibility: "shared", assigneeId: null }),
    );
    expect(within(tasks).getByText(/แลกเงิน HKD/i)).toBeInTheDocument();

    await user.click(within(tasks).getByRole("checkbox", { name: /แลกเงิน HKD/i }));

    expect(apiClient.patchTask).toHaveBeenCalledWith(
      ownerTrip.id,
      "task-api-created",
      "session-token",
      expect.objectContaining({ expectedVersion: 1, patch: { status: "done" } }),
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

    render(<SagittariusApp requireJoin dataSource="api" initialView="overview" apiClient={apiClient} />);

    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledWith(apiTrip.id, "persisted-session-token"));
    expect(await screen.findByRole("heading", { name: /Persisted API Trip/i })).toBeInTheDocument();
  });

  it("hydrates a persisted API session before the backend trip is in local state", async () => {
    installLocalStorageStub();
    const apiTrip = {
      ...seedTrip,
      id: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f11",
      name: "Account Created API Trip",
      joinId: "ACCOUNT-CREATED",
      joinPasswordHash: "",
      members: [{
        ...seedTrip.members[0],
        id: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f22",
        tripId: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f11",
        displayName: "Account Owner",
        claimPasswordHash: null,
      }],
    };
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: apiTrip.id,
        memberId: apiTrip.members[0].id,
        sessionToken: "account-created-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(apiTrip);

    render(<SagittariusApp requireJoin dataSource="api" initialView="members" apiClient={apiClient} />);

    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledWith(apiTrip.id, "account-created-session-token"));
    expect(await screen.findByRole("heading", { name: /Account Created API Trip/i })).toBeInTheDocument();
  });

  it("renders the same access choice before restoring a persisted account session", () => {
    installLocalStorageStub();
    window.localStorage.setItem(
      "sagittarius-account-session",
      JSON.stringify({
        userId: "11111111-1111-1111-1111-111111111111",
        sessionToken: "persisted-account-session",
        kind: "trusted",
        trustedDeviceId: "device-1",
        createdAt: "2026-05-30T10:00:00.000Z",
        expiresAt: "2030-01-01T10:00:00.000Z",
      }),
    );

    render(<SagittariusApp requireJoin dataSource="api" apiClient={createApiClientForTrip(seedTrip)} />);

    expect(screen.getByRole("tab", { name: /^Temp access$/i })).toHaveClass("account-tab--active");
    expect(screen.getByRole("heading", { name: /เข้าห้อง trip/i })).toBeInTheDocument();
  });

  it("ignores late API hydration when the app unmounts during a persisted session load", async () => {
    installLocalStorageStub();
    const deferred = createDeferred<TripCockpit>();
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "slow-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(seedTrip);
    vi.mocked(apiClient.loadTrip).mockReturnValue(deferred.promise);

    const { unmount } = render(<SagittariusApp requireJoin dataSource="api" initialView="overview" apiClient={apiClient} />);

    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledWith(seedTrip.id, "slow-session-token"));
    unmount();
    await act(async () => {
      deferred.resolve({ trip: { ...seedTrip, name: "Too Late Trip" }, suggestions: [], tasks: [], stopNotes: [], expenseSummary: null });
      await deferred.promise;
    });

    expect(screen.queryByText(/Too Late Trip/i)).not.toBeInTheDocument();
  });

  it("recovers to access instead of hanging when persisted API hydration fails", async () => {
    installLocalStorageStub();
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "expired-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(seedTrip);
    vi.mocked(apiClient.loadTrip).mockRejectedValue(new Error("session expired"));

    render(<SagittariusApp requireJoin dataSource="api" initialView="overview" apiClient={apiClient} />);

    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledWith(seedTrip.id, "expired-session-token"));
    expect(await screen.findByRole("main", { name: /Account access/i })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/โหลดข้อมูลทริปไม่สำเร็จ/i);
    expect(window.localStorage.getItem(tripParticipantSessionStorageKey)).toBeNull();
  });

  it("edits itinerary stops and resolves suggestions through the API client after backend login", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const selectedItem = seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!;
    const ownerTrip = {
      ...seedTrip,
      joinPasswordHash: "",
      members: seedTrip.members.slice(0, 2).map((member) => ({ ...member, claimPasswordHash: null })),
    };
    const pendingSuggestion = {
      id: "suggestion-api-review",
      tripId: ownerTrip.id,
      proposerId: ownerTrip.members[1].id,
      type: "edit" as const,
      targetItemId: selectedItem.id,
      planVariantId: selectedItem.planVariantId,
      proposedPatch: { note: "Book ahead from API" },
      sourceVersion: selectedItem.version,
      status: "pending" as const,
      createdAt: "2026-05-29T00:00:00.000Z",
    };
    const patchedItem = {
      ...selectedItem,
      activity: "Dim Dim Sum API revised",
      updatedAt: "2026-05-29T00:00:00.000Z",
      version: selectedItem.version + 1,
    };
    const cockpit: TripCockpit = {
      trip: ownerTrip,
      suggestions: [pendingSuggestion],
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
        claimableMembers: ownerTrip.members.map((member) => ({
          id: member.id,
          tripId: ownerTrip.id,
          displayName: member.displayName,
          role: member.role,
          accessStatus: "active",
          presence: member.presence,
          color: member.color,
          userId: null,
          claimedAt: null,
          lastSeenAt: null,
        })),
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
      createTask: vi.fn(),
      patchTask: vi.fn(),
      patchItineraryItem: vi.fn().mockResolvedValue(patchedItem),
      createSuggestion: vi.fn(),
      approveSuggestion: vi.fn().mockResolvedValue({ ...pendingSuggestion, status: "approved" }),
      rejectSuggestion: vi.fn(),
    };

    render(<SagittariusApp requireJoin dataSource="api" initialView="itinerary" apiClient={apiClient} />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/^Trip password$/i), "dim-sum-run");
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(await screen.findByRole("button", { name: /Demo Traveler/i }));
    await user.type(screen.getByLabelText(/ตั้งรหัสสำหรับ Demo Traveler/i), "owner-pin");
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    await user.click(await screen.findByRole("button", { name: /เปิดรายละเอียด/i }));
    await user.click(screen.getByRole("button", { name: /แก้ไขรายละเอียด/i }));
    const dialog = screen.getByRole("dialog", { name: /แก้ไขรายละเอียด/i });
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(within(dialog).getByLabelText(/กิจกรรม/i), "Dim Dim Sum API revised");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกการแก้ไข/i }));

    expect(apiClient.patchItineraryItem).toHaveBeenCalledWith(
      ownerTrip.id,
      selectedItem.id,
      "session-token",
      expect.objectContaining({
        expectedVersion: selectedItem.version,
        patch: expect.objectContaining({ activity: "Dim Dim Sum API revised" }),
      }),
    );
    expect(within(screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).getByRole("heading", { name: /Dim Dim Sum API revised/i })).toBeInTheDocument();

    const context = screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i });
    await user.click(within(context).getByRole("tab", { name: /ข้อเสนอ/i }));
    await user.click(within(context).getByRole("button", { name: /อนุมัติ Book ahead from API/i }));

    expect(apiClient.approveSuggestion).toHaveBeenCalledWith(ownerTrip.id, pendingSuggestion.id, "session-token");
    expect(within(context).queryByText(/Book ahead from API/i)).not.toBeInTheDocument();
  }, 45_000);

  it("creates traveler suggestions through the API client after backend login", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const selectedItem = seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!;
    const traveler = { ...seedTrip.members.find((member) => member.id === "member-nam")!, claimPasswordHash: null };
    const travelerTrip = { ...seedTrip, joinPasswordHash: "", members: [traveler] };
    const cockpit: TripCockpit = {
      trip: travelerTrip,
      suggestions: [],
      tasks: [],
      stopNotes: [],
      expenseSummary: null,
    };
    const apiSuggestion = {
      id: "suggestion-api-created",
      tripId: travelerTrip.id,
      proposerId: traveler.id,
      type: "edit" as const,
      targetItemId: selectedItem.id,
      planVariantId: selectedItem.planVariantId,
      proposedPatch: { activity: selectedItem.activity },
      sourceVersion: selectedItem.version,
      status: "pending" as const,
      createdAt: "2026-05-29T00:00:00.000Z",
    };
    const apiClient: TripApiClient = {
      joinTrip: vi.fn().mockResolvedValue({
        trip: {
          id: travelerTrip.id,
          name: travelerTrip.name,
          destinationLabel: travelerTrip.destinationLabel,
          startDate: travelerTrip.startDate,
          endDate: travelerTrip.endDate,
          joinId: travelerTrip.joinId,
          activePlanVariantId: travelerTrip.activePlanVariantId,
          ownerMemberId: traveler.id,
          version: 1,
        },
        claimableMembers: [{
          id: traveler.id,
          tripId: travelerTrip.id,
          displayName: traveler.displayName,
          role: traveler.role,
          accessStatus: "active",
          presence: traveler.presence,
          color: traveler.color,
          userId: null,
          claimedAt: null,
          lastSeenAt: null,
        }],
        joinSessionToken: "join-session-token",
        expiresAt: "2026-05-29T00:20:00.000Z",
      }),
      claimMember: vi.fn().mockResolvedValue({
        tripId: travelerTrip.id,
        memberId: traveler.id,
        sessionToken: "traveler-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
      loginMember: vi.fn(),
      logout: vi.fn(),
      loadTrip: vi.fn().mockResolvedValue(cockpit),
      createTask: vi.fn(),
      patchTask: vi.fn(),
      patchItineraryItem: vi.fn(),
      createSuggestion: vi.fn().mockResolvedValue(apiSuggestion),
      approveSuggestion: vi.fn(),
      rejectSuggestion: vi.fn(),
    };

    render(<SagittariusApp requireJoin dataSource="api" initialView="itinerary" apiClient={apiClient} />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/^Trip password$/i), "dim-sum-run");
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(await screen.findByRole("button", { name: /Explorer Friend/i }));
    await user.type(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), "traveler-pin");
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));
    await user.click(await screen.findByRole("button", { name: /เปิดรายละเอียด/i }));
    await user.click(screen.getByRole("button", { name: /เสนอแก้ไข/i }));

    expect(apiClient.createSuggestion).toHaveBeenCalledWith(
      travelerTrip.id,
      "traveler-session-token",
      expect.objectContaining({
        type: "edit",
        targetItemId: selectedItem.id,
        sourceVersion: selectedItem.version,
        proposedPatch: { activity: selectedItem.activity },
      }),
    );
    expect(screen.getByText(/Explorer Friend เสนอการปรับแผน/i)).toBeInTheDocument();
  });

  it("keeps future write-only surfaces read-only in API mode until backend routes exist", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const ownerTrip = {
      ...seedTrip,
      joinPasswordHash: "",
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    const itineraryClient = createApiClientForTrip(ownerTrip);
    const { unmount } = render(<SagittariusApp requireJoin dataSource="api" initialView="itinerary" apiClient={itineraryClient} />);

    await loginApiTrip(user);
    expect(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).toBeDisabled();
    await user.click(await screen.findByRole("button", { name: /เปิดรายละเอียด/i }));

    const context = screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i });
    expect(within(context).getByLabelText(/เพิ่มโน้ตสำหรับจุดนี้/i)).toBeDisabled();
    expect(within(context).getByRole("button", { name: /บันทึกโน้ต/i })).toBeDisabled();
    expect(within(context).getByRole("button", { name: /เพิ่ม\/แก้ไขค่าใช้จ่าย/i })).toBeDisabled();
    unmount();
    window.localStorage.clear();

    const membersClient = createApiClientForTrip(ownerTrip);
    render(<SagittariusApp requireJoin dataSource="api" initialView="members" apiClient={membersClient} />);
    await loginApiTrip(user);

    expect(screen.getByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i })).toBeDisabled();
  });

  it("opens directly into the trip overview instead of a marketing landing page", () => {
    const { container } = render(<SagittariusApp />);
    const workspaceGrid = container.querySelector(".workspace-grid");
    const planningMain = container.querySelector(".planning-main");

    expect(screen.getAllByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation", { name: /เมนูวางแผน Sagittarius/i })).toBeInTheDocument();
    expect(screen.queryByRole("banner", { name: /Trip command bar/i })).not.toBeInTheDocument();
    expect(container.querySelector(".page-header")).toHaveTextContent("ศูนย์จัดการทริป");
    expect(workspaceGrid).toBeInTheDocument();
    expect(workspaceGrid).toContainElement(planningMain as HTMLElement);
    expect(planningMain).toContainElement(screen.getByRole("region", { name: /Trip overview/i }));
    expect(screen.getByRole("region", { name: /Trip overview/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /ศูนย์จัดการทริป/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /เปิดรายละเอียด/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /เลิกทำ/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ทำซ้ำ/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /More actions/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /แผนที่เส้นทาง/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/hero/i)).not.toBeInTheDocument();
  });

  it("manages trip tasks from the overview checklist", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp />);

    expect(screen.getByRole("region", { name: /ความพร้อมของทริป/i })).toBeInTheDocument();
    const tasks = screen.getByRole("region", { name: /เช็กลิสต์ของทริป/i });
    expect(within(tasks).getByRole("button", { name: /ของฉัน/i })).toHaveClass("overview-task-filter--active");
    expect(within(tasks).getAllByText(/ส่วนตัว/i).length).toBeGreaterThan(0);
    expect(within(tasks).getAllByText(/แชร์ในทริป/i).length).toBeGreaterThan(0);
    expect(within(tasks).getByRole("checkbox", { name: /ซื้อ eSIM/i })).not.toBeChecked();

    const addTaskButton = within(tasks).getByRole("button", { name: /เพิ่มเช็กลิสต์/i });
    expect(addTaskButton.textContent?.trim()).toBe("+");
    await user.click(addTaskButton);

    const taskDialog = screen.getByRole("dialog", { name: /เพิ่มเช็กลิสต์/i });
    await user.type(within(taskDialog).getByLabelText(/เพิ่มเช็กลิสต์/i), "แลกเงิน HKD");
    await user.selectOptions(within(taskDialog).getByLabelText(/เก็บไว้ที่/i), "shared");
    await user.selectOptions(within(taskDialog).getByLabelText(/ให้ใครดูแล/i), "member-nam");
    await user.click(within(taskDialog).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }));

    expect(screen.queryByRole("dialog", { name: /เพิ่มเช็กลิสต์/i })).not.toBeInTheDocument();

    const newTask = within(tasks).getByRole("listitem", { name: /แลกเงิน HKD/i });
    expect(within(newTask).getByText(/Explorer Friend/i)).toBeInTheDocument();
    expect(within(newTask).getByText(/แชร์ในทริป/i)).toBeInTheDocument();

    await user.click(within(newTask).getByRole("checkbox", { name: /แลกเงิน HKD/i }));
    expect(within(newTask).getByRole("checkbox", { name: /แลกเงิน HKD/i })).toBeChecked();

    await user.click(within(tasks).getByRole("button", { name: /เสร็จแล้ว/i }));

    expect(within(tasks).getByText(/แลกเงิน HKD/i)).toBeInTheDocument();
    expect(within(tasks).queryByText(/ซื้อ eSIM/i)).not.toBeInTheDocument();

    await user.click(within(tasks).getByRole("button", { name: /แชร์ในทริป/i }));
    expect(within(tasks).getByText(/จอง Peak Tram/i)).toBeInTheDocument();

    await user.click(within(tasks).getByRole("button", { name: /ของฉัน/i }));
    await user.click(within(tasks).getByRole("button", { name: /ทุกสถานะ/i }));
    expect(within(tasks).getByText(/ซื้อ eSIM/i)).toBeInTheDocument();
    expect(within(tasks).queryByText(/จอง Peak Tram/i)).not.toBeInTheDocument();
  });

  it("keeps the left navigation simple and only links to implemented views", () => {
    render(<SagittariusApp />);

    const navigation = screen.getByRole("navigation", { name: /เมนูวางแผน Sagittarius/i });
    const railLinks = navigation.querySelector(".rail-links");
    expect(railLinks).not.toBeNull();
    const links = within(railLinks as HTMLElement).getAllByRole("link");

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      "ภาพรวม",
      "แผนการเดินทาง",
      "แผนที่",
      "ไทม์ไลน์",
      "สมาชิก",
    ]);
    expect(within(navigation).getByRole("link", { name: /ภาพรวม/i })).toHaveClass("rail-link--active");
    expect(within(navigation).queryByRole("link", { name: /งบประมาณ/i })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: /รายการจอง/i })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: /ตั้งค่า/i })).not.toBeInTheDocument();
  });

  it("matches the dense planning cockpit skeleton from the reference", () => {
    render(<SagittariusApp initialView="itinerary" />);

    expect(screen.queryByRole("banner", { name: /Trip command bar/i })).not.toBeInTheDocument();
    expect(document.querySelector(".page-header")).toHaveTextContent("แผนการเดินทาง");
    expect(screen.getByRole("link", { name: /แผนการเดินทาง/i })).toHaveClass("rail-link--active");
    expect(screen.queryByRole("tablist", { name: /Planning views/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Smart Itinerary Table/i })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /^เวลา$/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /แผนที่ \/ ลิงก์/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /ตั้งค่าตาราง/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Duplicate Dim Dim Sum/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /More actions for Dim Dim Sum/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Plan variant/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Selected day/i)).not.toBeInTheDocument();
  }, 10_000);

  it("renders only the surface that belongs to the current URL view", () => {
    const { rerender } = render(<SagittariusApp initialView="itinerary" />);

    expect(screen.getByRole("region", { name: /ตารางแผนการเดินทาง/i })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /แผนที่เส้นทาง/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i })).not.toBeInTheDocument();

    rerender(<SagittariusApp initialView="map" />);

    const map = screen.getByRole("region", { name: /แผนที่เส้นทาง/i });
    expect(screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /เปิดรายละเอียด/i })).not.toBeInTheDocument();
    expect(within(map).getByRole("button", { name: /ทุกวัน/i })).toBeInTheDocument();
    expect(within(map).getByRole("button", { name: /วันที่ 2/i })).toBeInTheDocument();
    expect(within(map).queryByRole("button", { name: /โหลด OpenFreeMap/i })).not.toBeInTheDocument();
    expect(within(map).queryByRole("button", { name: /Select map stop Victoria Peak/i })).not.toBeInTheDocument();
    expect(within(map).queryByRole("button", { name: /Select route stop Dim Dim Sum/i })).not.toBeInTheDocument();

    rerender(<SagittariusApp initialView="timeline" />);

    const timeline = screen.getByRole("region", { name: /ไทม์ไลน์ทริป/i });

    expect(screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /แผนที่เส้นทาง/i })).not.toBeInTheDocument();
    expect(within(timeline).getByRole("button", { name: /เลือกจุดในไทม์ไลน์ Dim Dim Sum/i })).toBeInTheDocument();
    expect(within(timeline).getAllByText(/Hong Kong City Day/i).length).toBeGreaterThan(0);
  });

  it("renders trip members as their own workspace page", () => {
    render(<SagittariusApp initialView="members" />);

    const navigation = screen.getByRole("navigation", { name: /เมนูวางแผน Sagittarius/i });
    const membersLink = within(navigation).getByRole("link", { name: /สมาชิก/i });

    expect(membersLink).toHaveClass("rail-link--active");
    expect(membersLink).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen/members");
    expect(screen.getByRole("region", { name: /สมาชิกทริป/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /People and presence/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /สมาชิกในทริป/i })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /แผนที่เส้นทาง/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i })).not.toBeInTheDocument();
  });

  it("renders members with a single page header and without itinerary-only controls", () => {
    const { container } = render(<SagittariusApp initialView="members" />);
    const workspaceGrid = container.querySelector(".workspace-grid");
    const planningMain = container.querySelector(".planning-main");

    expect(screen.queryByRole("banner", { name: /Trip command bar/i })).not.toBeInTheDocument();
    expect(container.querySelector(".page-header")).toHaveTextContent("Hong Kong + Shenzhen Trip");
    expect(container.querySelector(".page-header")).toHaveTextContent("15–20 พ.ค. 2025");
    expect(workspaceGrid).toBeInTheDocument();
    expect(workspaceGrid).toHaveAttribute("data-command-bar", "hidden");
    expect(workspaceGrid).toContainElement(planningMain as HTMLElement);
    expect(planningMain).toContainElement(screen.getByRole("region", { name: /สมาชิกทริป/i }));
    expect(screen.queryByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /เปิดรายละเอียด/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /เลิกทำ/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ทำซ้ำ/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /More actions/i })).not.toBeInTheDocument();
  });

  it("shows the current member as confirmed on the members page", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="members" />);

    const currentMemberRow = screen.getByText(/Demo Traveler \(คุณ\)/i).closest(".person-row");
    expect(currentMemberRow).not.toBeNull();
    expect(within(currentMemberRow as HTMLElement).getByText(/ยืนยันแล้ว/i)).toBeInTheDocument();
    expect(within(currentMemberRow as HTMLElement).queryByText(/รอเข้าร่วม/i)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^สถานะ$/i), "pending");

    expect(screen.queryByText(/Demo Traveler \(คุณ\)/i)).not.toBeInTheDocument();
  });

  it("starts hydration from the join gate even when a remembered participant session exists", async () => {
    installLocalStorageStub();
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: "member-aom",
        sessionToken: "local_hydration_test",
        createdAt: "2026-05-28T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );

    render(<SagittariusApp initialView="members" requireJoin />);

    expect(screen.getByRole("main", { name: /Account access/i })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /เมนูวางแผน Sagittarius/i })).not.toBeInTheDocument();
    expect(await screen.findByRole("navigation", { name: /เมนูวางแผน Sagittarius/i })).toBeInTheDocument();
  });

  it("filters trip members and can reset an empty member search", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="members" />);

    await user.type(screen.getByLabelText(/ค้นหาสมาชิก/i), "Family");

    const membersPage = screen.getByRole("region", { name: /สมาชิกทริป/i });
    expect(within(membersPage).getByRole("button", { name: /ปิดสิทธิ์ Family Member/i })).toBeInTheDocument();
    expect(within(membersPage).queryByText(/Travel Mate/i)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^สิทธิ์$/i), "organizer");

    expect(screen.getByText(/ไม่พบสมาชิกที่ตรงกับตัวกรอง/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /ล้างตัวกรอง/i })[0]);

    expect(screen.getByRole("button", { name: /ปิดสิทธิ์ Travel Mate/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i })).toBeInTheDocument();
  });

  it("copies the trip invite link from the members command center", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<SagittariusApp initialView="members" />);

    await user.click(screen.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/join/DEMO-TRIP"));
    expect(screen.getByText(/คัดลอกแล้ว/i)).toBeInTheDocument();
  });

  it("creates new members from the members command center", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="members" />);

    await user.click(screen.getByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i }));
    await user.type(screen.getByLabelText(/ชื่อสมาชิกใหม่/i), "New Cousin");
    await user.selectOptions(screen.getByLabelText(/สิทธิ์สมาชิกใหม่/i), "viewer");
    await user.click(screen.getByRole("button", { name: /บันทึกสมาชิก/i }));

    const newMemberRow = screen.getAllByText("New Cousin")[0].closest(".person-row");
    expect(newMemberRow).not.toBeNull();
    expect(within(newMemberRow as HTMLElement).getByText(/ดูได้/i)).toBeInTheDocument();
    expect(within(newMemberRow as HTMLElement).getByText(/รอเข้าร่วม/i)).toBeInTheDocument();
  });

  it("manages member roles, access, claim reset, and current member password from the app state", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const prompt = vi.spyOn(window, "prompt").mockReturnValue("owner-new-pin");
    render(<SagittariusApp initialView="members" />);

    await user.selectOptions(screen.getByLabelText(/Role for Explorer Friend/i), "organizer");
    expect(screen.getByText("Explorer Friend").closest(".person-row")).toHaveTextContent("ผู้จัดทริป");

    await user.click(screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i }));
    expect(screen.getByRole("button", { name: /เปิดสิทธิ์ Explorer Friend/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /เปิดสิทธิ์ Explorer Friend/i }));
    expect(screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i }));

    expect(prompt).toHaveBeenCalledWith(expect.stringContaining("Demo Traveler"));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Explorer Friend"));

    prompt.mockRestore();
    confirm.mockRestore();
  });

  it("resets a claimed non-owner member loaded from a persisted draft", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const storage = installLocalStorageStub();
    storage.setItem("sagittarius:trip-draft", JSON.stringify({
      ...seedTrip,
      members: seedTrip.members.map((member) =>
        member.id === "member-beam"
          ? { ...member, claimPasswordHash: "local_hash_old", claimedAt: "2026-05-28T00:00:00.000Z" }
          : member,
      ),
    }));

    render(<SagittariusApp initialView="members" />);

    await user.click(await screen.findByRole("button", { name: /รีเซ็ตรหัสผ่าน Travel Mate/i }));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Travel Mate"));
    await waitFor(() => expect(screen.queryByRole("button", { name: /รีเซ็ตรหัสผ่าน Travel Mate/i })).not.toBeInTheDocument());

    confirm.mockRestore();
  });

  it("cleans corrupt persisted drafts and participant sessions before opening", async () => {
    const storage = installLocalStorageStub();
    storage.setItem("sagittarius:trip-draft", "{");
    storage.setItem(tripParticipantSessionStorageKey, "{");

    render(<SagittariusApp requireJoin />);

    await waitFor(() => {
      expect(storage.getItem("sagittarius:trip-draft")).toBeNull();
      expect(storage.getItem(tripParticipantSessionStorageKey)).toBeNull();
    });
    expect(screen.getByRole("main", { name: /Account access/i })).toBeInTheDocument();
  });

  it("keeps undo and redo harmless when there is no history", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    const undoButton = screen.getByRole("button", { name: /เลิกทำ/i });
    const redoButton = screen.getByRole("button", { name: /ทำซ้ำ/i });
    expect(undoButton).toBeDisabled();
    expect(redoButton).toBeDisabled();
    (undoButton as HTMLButtonElement).disabled = false;
    (redoButton as HTMLButtonElement).disabled = false;
    fireEvent.click(undoButton);
    fireEvent.click(redoButton);
    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));
    expect(screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).toBeInTheDocument();
  });

  it("keeps read-only forced actions from mutating itinerary or suggestions", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.selectOptions(screen.getByLabelText(/Role preview/i), "member-viewer");
    const addStopButton = screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i });
    (addStopButton as HTMLButtonElement).disabled = false;
    fireEvent.click(addStopButton);
    expect(screen.queryByRole("dialog", { name: /เพิ่มกิจกรรม/i })).not.toBeInTheDocument();

    const dataTransfer = createDataTransfer();
    dataTransfer.setData("text/plain", "missing-item");
    fireEvent.drop(screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i }).closest("tr")!, { dataTransfer });
    expect(screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));
    const suggestButton = screen.getByRole("button", { name: /เสนอแก้ไข/i });
    (suggestButton as HTMLButtonElement).disabled = false;
    fireEvent.click(suggestButton);
    expect(screen.queryByText(/Viewer Guest suggested an update/i)).not.toBeInTheDocument();
  });

  it("can start on real route paths with the right surface first", () => {
    const { rerender } = render(<SagittariusApp initialView="map" />);

    const navigation = screen.getByRole("navigation", { name: /เมนูวางแผน Sagittarius/i });
    expect(within(navigation).getByRole("link", { name: /แผนที่/i })).toHaveClass("rail-link--active");
    expect(document.querySelector(".planning-main")?.firstElementChild).toHaveClass("route-map-panel");
    expect(screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i })).not.toBeInTheDocument();

    rerender(<SagittariusApp initialView="timeline" />);

    expect(within(navigation).getByRole("link", { name: /ไทม์ไลน์/i })).toHaveClass("rail-link--active");
    expect(document.querySelector(".planning-main")?.firstElementChild).toHaveClass("timeline-panel");
    expect(screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /แผนที่เส้นทาง/i })).not.toBeInTheDocument();
  });

  it("uses timeline selections for details while map day filters stay local", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SagittariusApp initialView="timeline" />);

    await user.click(within(screen.getByRole("region", { name: /ไทม์ไลน์ทริป/i })).getByRole("button", { name: /เลือกจุดในไทม์ไลน์ Victoria Peak/i }));
    expect(within(screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).getByRole("heading", { name: /Victoria Peak/i })).toBeInTheDocument();

    unmount();
    render(<SagittariusApp initialView="map" />);

    expect(screen.queryByRole("button", { name: /เปิดรายละเอียด/i })).not.toBeInTheDocument();
    await user.click(within(screen.getByRole("region", { name: /แผนที่เส้นทาง/i })).getByRole("button", { name: /วันที่ 2/i }));
    expect(screen.queryByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).not.toBeInTheDocument();
    expect(screen.getByText(/6\/15 จุดที่แสดง/i)).toBeInTheDocument();
  });

  it("toggles timeline details and closes the context rail from its own control", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SagittariusApp initialView="timeline" />);

    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));
    expect(screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /ปิดรายละเอียด/i }));
    expect(screen.queryByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).not.toBeInTheDocument();

    unmount();
    render(<SagittariusApp initialView="itinerary" />);
    await user.click(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i }));
    await user.click(screen.getByRole("button", { name: /ยกเลิก/i }));
    expect(screen.queryByRole("dialog", { name: /เพิ่มกิจกรรม/i })).not.toBeInTheDocument();
  });

  it("collapses the left rail and keeps labels accessible", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /ย่อเมนู/i }));

    const nav = screen.getByRole("navigation", { name: /เมนูวางแผน Sagittarius/i });
    expect(nav).toHaveAttribute("data-collapsed", "true");
    expect(screen.getByRole("button", { name: /ขยายเมนู/i })).toHaveAttribute("aria-expanded", "false");

    await user.click(screen.getByRole("button", { name: /ขยายเมนู/i }));

    expect(nav).toHaveAttribute("data-collapsed", "false");
    expect(screen.getByRole("button", { name: /ย่อเมนู/i })).toHaveAttribute("aria-expanded", "true");
  }, 45_000);

  it("starts with the right context drawer hidden so the table can expand", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    expect(screen.queryByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).not.toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "closed");
    expect(screen.getByRole("button", { name: /เปิดรายละเอียด/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));

    expect(screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");
  });

  it("opens the right context drawer when selecting a row while details are hidden", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "closed");

    await user.click(screen.getByRole("button", { name: /เลือกจุด Victoria Peak/i }));

    const context = screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i });
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");
    expect(within(context).getByRole("heading", { name: /Victoria Peak/i })).toBeInTheDocument();
  });

  it("keeps trip member management out of the right context drawer", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));

    const context = screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i });
    expect(within(context).queryByRole("region", { name: /People and presence/i })).not.toBeInTheDocument();
    expect(within(context).queryByRole("heading", { name: /สมาชิกและสถานะ/i })).not.toBeInTheDocument();
  });

  it("uses selected table row to drive the right context rail", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /เลือกจุด Victoria Peak/i }));

    const context = screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i });
    expect(within(context).getByRole("heading", { name: /Victoria Peak/i })).toBeInTheDocument();
    expect(within(context).getAllByText(/The Peak Tram/i).length).toBeGreaterThan(0);
  });

  it("opens details from the explicit itinerary row selection control", async () => {
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "closed");

    fireEvent.click(screen.getByRole("button", { name: /เลือกจุด Victoria Peak/i }));

    const context = screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i });
    expect(within(context).getByRole("heading", { name: /Victoria Peak/i })).toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");
  });

  it("closes the right context drawer when clicking outside it", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");

    await user.click(screen.getByRole("region", { name: /ตารางแผนการเดินทาง/i }));

    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "closed");
    expect(screen.queryByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).not.toBeInTheDocument();
  });

  it("keeps the context drawer mounted during the close animation and ignores non-element document events", async () => {
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    fireEvent.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));
    expect(await screen.findByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).toBeInTheDocument();

    document.dispatchEvent(new Event("click"));
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");

    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByRole("region", { name: /ตารางแผนการเดินทาง/i }));
      expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "closed");
      expect(container.querySelector(".context-rail")).toHaveAttribute("data-state", "closed");

      act(() => {
        vi.advanceTimersByTime(900);
      });
      expect(screen.queryByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not close the context drawer for clicks that originate on itinerary rows", () => {
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    fireEvent.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));
    fireEvent.click(screen.getByRole("row", { name: /เปิดรายละเอียดของ Victoria Peak/i }));

    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");
    expect(within(screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).getByRole("heading", { name: /Dim Dim Sum/i })).toBeInTheDocument();
  });

  it("keeps the right context drawer open when clicking inside it", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));
    const context = screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i });

    await user.click(context);

    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");
    expect(screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).toBeInTheDocument();
  });

  it("collapses and expands day groups", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /ย่อ วันที่ 2/i }));

    expect(screen.queryByRole("button", { name: /เลือกจุด Dim Dim Sum/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /เลือกจุด Victoria Peak/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ขยาย วันที่ 2/i }));

    expect(screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /เลือกจุด Victoria Peak/i })).toBeInTheDocument();
  });

  it("reorders itinerary rows with drag and drop", () => {
    render(<SagittariusApp initialView="itinerary" />);

    const dataTransfer = createDataTransfer();
    const victoriaSelectBefore = screen.getByRole("button", { name: /เลือกจุด Victoria Peak/i });
    const dimDimSelectBefore = screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i });
    expect(dimDimSelectBefore.compareDocumentPosition(victoriaSelectBefore) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.dragStart(screen.getByRole("button", { name: /ลาก Victoria Peak/i }), { dataTransfer });
    fireEvent.dragOver(screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i }), { dataTransfer });
    fireEvent.drop(screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i }), { dataTransfer });

    const victoriaSelectAfter = screen.getByRole("button", { name: /เลือกจุด Victoria Peak/i });
    const dimDimSelectAfter = screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i });
    expect(victoriaSelectAfter.compareDocumentPosition(dimDimSelectAfter) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows a drop preview before placing a dragged itinerary row", () => {
    render(<SagittariusApp initialView="itinerary" />);

    const dataTransfer = createDataTransfer();
    const victoriaRow = screen.getByRole("button", { name: /เลือกจุด Victoria Peak/i }).closest("tr");
    const dimDimRow = screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i }).closest("tr");

    fireEvent.dragStart(screen.getByRole("button", { name: /ลาก Victoria Peak/i }), { dataTransfer });
    fireEvent.dragOver(dimDimRow!, { dataTransfer });

    expect(victoriaRow).toHaveClass("data-row--dragging");
    expect(dimDimRow).toHaveClass("data-row--drop-target");

    fireEvent.drop(dimDimRow!, { dataTransfer });

    expect(dimDimRow).not.toHaveClass("data-row--drop-target");
  });

  it("changes edit affordances by role capability", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    expect(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).toBeEnabled();

    await user.selectOptions(screen.getByLabelText(/Role preview/i), "member-viewer");

    expect(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).toBeDisabled();
    expect(screen.getByText(/ต้องมีสิทธิ์ผู้จัดทริปจึงจะแก้ไขได้/i)).toBeInTheDocument();
  });

  it("lets travelers submit a suggestion instead of directly editing a stop", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.selectOptions(screen.getByLabelText(/Role preview/i), "member-nam");
    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));
    await user.click(screen.getByRole("button", { name: /เสนอแก้ไข/i }));

    expect(screen.getByText(/คำแนะนำ \(3\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Explorer Friend เสนอการปรับแผน/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ปรับเวลาอัตโนมัติ/i })).toBeDisabled();
  });

  it("uses the stop workspace for notes, booking prep, and suggestion review", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));

    const context = screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i });
    expect(within(context).getByRole("tab", { name: /โน้ต/i })).toHaveAttribute("aria-selected", "true");
    expect(within(context).getByRole("tab", { name: /การจอง/i })).toBeInTheDocument();
    expect(within(context).getByRole("tab", { name: /ข้อเสนอ/i })).toBeInTheDocument();
    expect(within(context).getByRole("region", { name: /โน้ตของจุดนี้/i })).toBeInTheDocument();

    await user.type(within(context).getByLabelText(/เพิ่มโน้ตสำหรับจุดนี้/i), "ถามร้านว่ามีโต๊ะริมหน้าต่างไหม");
    await user.click(within(context).getByRole("button", { name: /บันทึกโน้ต/i }));
    expect(within(context).getByText(/ถามร้านว่ามีโต๊ะริมหน้าต่างไหม/i)).toBeInTheDocument();

    await user.click(within(context).getByRole("tab", { name: /การจอง/i }));
    expect(within(context).getByRole("region", { name: /การจองและการเตรียมตัวของจุดนี้/i })).toBeInTheDocument();
    expect(within(context).getByText(/จองล่วงหน้าแนะนำ/i)).toBeInTheDocument();

    await user.click(within(context).getByRole("tab", { name: /ข้อเสนอ/i }));
    expect(within(context).getByRole("region", { name: /ตรวจข้อเสนอ/i })).toBeInTheDocument();
    await user.click(within(context).getByRole("button", { name: /อนุมัติ ร้านนี้ได้รับคะแนนสูง/i }));
    expect(within(context).queryByText(/ร้านนี้ได้รับคะแนนสูง 4.3\/5 จาก 8,332 รีวิว/i)).not.toBeInTheDocument();

    await user.click(within(context).getByRole("button", { name: /ปฏิเสธ แนะนำให้จองคิวล่วงหน้า/i }));
    expect(within(context).queryByText(/แนะนำให้จองคิวล่วงหน้า โดยเฉพาะช่วงสุดสัปดาห์/i)).not.toBeInTheDocument();
  });

  it("renders fixture-backed suggestions and tasks in planning views", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));

    const context = screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i });
    await user.click(within(context).getByRole("tab", { name: /ข้อเสนอ/i }));
    expect(within(context).getAllByText(/ร้านนี้ได้รับคะแนนสูง 4\.3\/5/i).length).toBeGreaterThan(0);

    await user.click(within(context).getByRole("tab", { name: /การจอง/i }));
    expect(within(context).getByText(/ยืนยันคิว Dim Dim Sum/i)).toBeInTheDocument();
  });

  it("adds a new itinerary stop from the header action", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i }));

    const dialog = screen.getByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    await user.clear(within(dialog).getByLabelText(/^เวลา$/i));
    await user.type(within(dialog).getByLabelText(/^เวลา$/i), "16:45");
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(within(dialog).getByLabelText(/กิจกรรม/i), "Coffee break at K11 Musea");
    await user.clear(within(dialog).getByLabelText(/สถานที่/i));
    await user.type(within(dialog).getByLabelText(/สถานที่/i), "K11 Musea");
    await user.clear(within(dialog).getByLabelText(/^ชั่วโมง$/i));
    await user.type(within(dialog).getByLabelText(/^ชั่วโมง$/i), "0");
    await user.selectOptions(within(dialog).getByLabelText(/^นาที$/i), "45");
    await user.clear(within(dialog).getByLabelText(/การเดินทาง/i));
    await user.type(within(dialog).getByLabelText(/การเดินทาง/i), "เดิน");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกกิจกรรม/i }));

    expect(screen.queryByRole("dialog", { name: /เพิ่มกิจกรรม/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /เลือกจุด Coffee break at K11 Musea/i })).toBeInTheDocument();
    expect(within(screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).getByRole("heading", { name: /Coffee break at K11 Musea/i })).toBeInTheDocument();
  });

  it("edits the selected stop and supports undo redo", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));
    await user.click(screen.getByRole("button", { name: /แก้ไขรายละเอียด/i }));

    const dialog = screen.getByRole("dialog", { name: /แก้ไขรายละเอียด/i });
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(within(dialog).getByLabelText(/กิจกรรม/i), "Dim Dim Sum revised");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกการแก้ไข/i }));

    const context = screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i });
    expect(within(context).getByRole("heading", { name: /Dim Dim Sum revised/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /เลิกทำ/i }));
    expect(within(context).getByRole("heading", { name: /Dim Dim Sum ที่ Tim Ho Wan/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ทำซ้ำ/i }));
    expect(within(context).getByRole("heading", { name: /Dim Dim Sum revised/i })).toBeInTheDocument();
  });
});

function createDataTransfer() {
  const values = new Map<string, string>();

  return {
    dropEffect: "move",
    effectAllowed: "move",
    getData: (type: string) => values.get(type) ?? "",
    setData: (type: string, value: string) => values.set(type, value),
  };
}

function installLocalStorageStub() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  return storage;
}

async function loginApiTrip(user: ReturnType<typeof userEvent.setup>) {
  fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "HK-SZ-2025" } });
  fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "dim-sum-run" } });
  await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
  await user.click(await screen.findByRole("button", { name: /Demo Traveler/i }));
  fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Demo Traveler/i), { target: { value: "owner-pin" } });
  await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));
}

function createApiClientForTrip(trip: Trip): TripApiClient {
  const cockpit: TripCockpit = {
    trip,
    suggestions: [],
    tasks: [],
    stopNotes: [],
    expenseSummary: null,
  };

  return {
    joinTrip: vi.fn().mockResolvedValue({
      trip: {
        id: trip.id,
        name: trip.name,
        destinationLabel: trip.destinationLabel,
        startDate: trip.startDate,
        endDate: trip.endDate,
        joinId: trip.joinId,
        activePlanVariantId: trip.activePlanVariantId,
        ownerMemberId: trip.members[0].id,
        version: 1,
      },
      claimableMembers: trip.members.map((member) => ({
        id: member.id,
        tripId: trip.id,
        displayName: member.displayName,
        role: member.role,
        accessStatus: member.accessStatus ?? "active",
        presence: member.presence,
        color: member.color,
        userId: member.userId ?? null,
        claimedAt: member.claimedAt ?? null,
        lastSeenAt: member.lastSeenAt ?? null,
      })),
      joinSessionToken: "join-session-token",
      expiresAt: "2026-05-29T00:20:00.000Z",
    }),
    claimMember: vi.fn().mockResolvedValue({
      tripId: trip.id,
      memberId: trip.members[0].id,
      sessionToken: "session-token",
      createdAt: "2026-05-29T00:00:00.000Z",
      expiresAt: "2026-06-28T00:00:00.000Z",
    }),
    loginMember: vi.fn(),
    logout: vi.fn(),
    loadTrip: vi.fn().mockResolvedValue(cockpit),
    createTask: vi.fn(),
    patchTask: vi.fn(),
    patchItineraryItem: vi.fn(),
    createSuggestion: vi.fn(),
    approveSuggestion: vi.fn(),
    rejectSuggestion: vi.fn(),
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });
  return { promise, reject, resolve };
}
