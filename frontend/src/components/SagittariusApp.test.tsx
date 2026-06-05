import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SagittariusApp,
  resolveJoinPostAuthReturnTo,
  nextClientMutationId,
  nextLocalItemId,
  nextLocalStopNoteId,
  nextLocalSuggestionId,
  nextLocalTaskId,
  replaceSuggestionById,
} from "@/src/app/SagittariusApp";
import { TripApiError, type CreateExpenseApiRequest, type TripApiClient, type TripCockpit } from "@/src/trip/api-client";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { tripStorageKey } from "@/src/trip/repository";
import { seedTrip } from "@/src/trip/seed";
import { encodeTripId } from "@/src/trip/ids";
import type { ItineraryItem, StopNote, Suggestion, Trip, TripDailyBriefing, TripTask } from "@/src/trip/types";
import { appRoutes, encodeReturnTo } from "@/src/routes/app-routes";

function render(ui: ReactElement) {
  const result = renderWithI18n(ui, { locale: "th" });
  const originalRerender = result.rerender;

  return {
    ...result,
    rerender: (nextUi: ReactElement) => originalRerender(<I18nProvider initialLocale="th">{nextUi}</I18nProvider>),
  };
}

function getFirstStopDetailsButton(): HTMLElement {
  return screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i });
}

async function openFirstStopDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.click(getFirstStopDetailsButton());
}

describe("Sagittarius cockpit UI", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", "/");
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
    expect(screen.queryByRole("navigation", { name: /เมนูวางแผน Joii/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "HK-SZ-2025" } });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "seed-trip-pass" } });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), { target: { value: "traveler-pin" } });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    expect(await screen.findByRole("navigation", { name: /เมนูวางแผน Joii/i })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("region", { name: /Trip overview/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).not.toBeInTheDocument();
  }, 45_000);

  it("creates a local activity with resolved coordinates when place resolution is high confidence", async () => {
    const user = userEvent.setup();
    const placeResolver = vi.fn().mockResolvedValue({
      status: "resolved",
      candidates: [{
        name: "The Elements",
        address: "Austin Road West, Hong Kong",
        coordinates: { lat: 22.3049, lng: 114.1617 },
        mapLink: "https://www.openstreetmap.org/?mlat=22.3049&mlon=114.1617#map=17/22.3049/114.1617",
        confidence: 0.92,
        source: "nominatim",
        evidence: ["brave: The Elements"],
      }],
    });
    render(<SagittariusApp initialView="itinerary" placeResolver={placeResolver} />);

    await user.click(screen.getByRole("button", { name: "เพิ่มสถานที่ / กิจกรรม วันที่ 1" }));
    fireEvent.change(screen.getByLabelText("กิจกรรม"), { target: { value: "Dim Dim Sum" } });
    fireEvent.change(screen.getByLabelText("สถานที่"), { target: { value: "ติ่มซำ แถว Elements" } });
    await user.click(screen.getByRole("button", { name: "บันทึกกิจกรรม" }));

    await waitFor(() => expect(placeResolver).toHaveBeenCalledWith(expect.objectContaining({
      activity: "Dim Dim Sum",
      placeHint: "ติ่มซำ แถว Elements",
      destinationLabel: seedTrip.destinationLabel,
    })));
    expect(screen.getByDisplayValue("ติ่มซำ แถว Elements")).toBeInTheDocument();
  });

  it("asks the organizer to choose when place resolution is ambiguous", async () => {
    const user = userEvent.setup();
    const placeResolver = vi.fn().mockResolvedValue({
      status: "ambiguous",
      candidates: [
        {
          name: "The Elements",
          address: "Austin Road West, Hong Kong",
          coordinates: { lat: 22.3049, lng: 114.1617 },
          mapLink: "https://www.openstreetmap.org/?mlat=22.3049&mlon=114.1617#map=17/22.3049/114.1617",
          confidence: 0.78,
          source: "nominatim",
          evidence: ["brave: The Elements"],
        },
      ],
    });
    render(<SagittariusApp initialView="itinerary" placeResolver={placeResolver} />);

    await user.click(screen.getByRole("button", { name: "เพิ่มสถานที่ / กิจกรรม วันที่ 1" }));
    fireEvent.change(screen.getByLabelText("กิจกรรม"), { target: { value: "Dim Dim Sum" } });
    fireEvent.change(screen.getByLabelText("สถานที่"), { target: { value: "ติ่มซำ แถว Elements" } });
    await user.click(screen.getByRole("button", { name: "บันทึกกิจกรรม" }));

    expect(await screen.findByRole("button", { name: "เลือก The Elements" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "เลือก The Elements" }));
    await user.click(screen.getByRole("button", { name: "บันทึกกิจกรรม" }));

    expect(placeResolver).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("button", { name: "เลือกจุด Dim Dim Sum" })).toBeInTheDocument();
  });

  it("uses the API join route for canonical API trip access and replaces join history", async () => {
    const user = userEvent.setup();
    const replaceStateMock = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    const originalLocation = window.location;
    const safeReturnTo = `/trips/${encodeTripId(seedTrip.id)}/itinerary`;
    const locationMock = {
      ...originalLocation,
      pathname: "/join",
      search: `?rt=${encodeURIComponent(encodeReturnTo(safeReturnTo))}`,
      replace: vi.fn(),
    };
    const locationSpy = vi.spyOn(window, "location", "get").mockReturnValue(locationMock);
    const apiClient = createApiClientForTrip(seedTrip);
    render(<SagittariusApp accessMode="trip-access" requireJoin dataSource="api" apiClient={apiClient} />);

    fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "HK-SZ-2025" } });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "seed-trip-pass" } });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), { target: { value: "traveler-pin" } });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    expect(apiClient.joinTrip).toHaveBeenCalledWith({ joinId: "HK-SZ-2025", password: "seed-trip-pass" });
    expect(apiClient.loadTrip).toHaveBeenCalledWith(seedTrip.id, "session-token");
    expect(replaceStateMock).toHaveBeenCalledWith(null, "", safeReturnTo);
    expect(screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i })).toBeInTheDocument();

    locationSpy.mockRestore();
    replaceStateMock.mockRestore();
  }, 45_000);

  it.each([
    ["overview", appRoutes.tripOverview(seedTrip.id)],
    ["itinerary", appRoutes.tripItinerary(seedTrip.id)],
    ["map", appRoutes.tripMap(seedTrip.id)],
    ["timeline", appRoutes.tripTimeline(seedTrip.id)],
    ["members", appRoutes.tripMembers(seedTrip.id)],
    ["settings", appRoutes.tripSettings(seedTrip.id)],
  ] as const)("redirects unauthenticated trip %s routes to /join with encoded returnTo", async (_view, tripPath) => {
    const originalLocation = window.location;
    const locationMock = {
      ...originalLocation,
      pathname: tripPath,
      search: "",
      replace: vi.fn(),
    };
    const locationSpy = vi.spyOn(window, "location", "get").mockReturnValue(locationMock);

    render(<SagittariusApp accessMode="trip-access" requireJoin dataSource="api" routeTripId={seedTrip.id} />);

    await waitFor(() => expect(locationMock.replace).toHaveBeenCalledWith(appRoutes.join(undefined, tripPath)));
    expect(screen.queryByRole("heading", { name: /เข้าห้อง trip/i })).not.toBeInTheDocument();

    locationSpy.mockRestore();
  });

  it("lets a guest participant leave their local session and choose another identity", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<SagittariusApp requireJoin />);

    fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "HK-SZ-2025" } });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "seed-trip-pass" } });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), { target: { value: "traveler-pin" } });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    await user.click(screen.getByRole("button", { name: /เปลี่ยนตัวตน/i }));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Explorer Friend"));
    expect(screen.getByRole("main", { name: /Account access/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /เข้าห้อง trip/i })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /เมนูวางแผน Joii/i })).not.toBeInTheDocument();
  }, 45_000);

  it("persists guest participant claims across a fresh app mount", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    installLocalStorageStub();
    const { unmount } = render(<SagittariusApp requireJoin />);

    fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "HK-SZ-2025" } });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "seed-trip-pass" } });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), { target: { value: "traveler-pin" } });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));
    await user.click(screen.getByRole("button", { name: /เปลี่ยนตัวตน/i }));

    unmount();
    render(<SagittariusApp requireJoin />);

    fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "HK-SZ-2025" } });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "seed-trip-pass" } });
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

      if (request.includes("/api/v1/account/explorer")) {
        return new Response(
          JSON.stringify({
            upcomingTrips: 0,
            ownedTrips: 0,
            destinationCount: 0,
            nextTrip: null,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }

      if (request.includes("/api/v1/account/to-dos") || request.includes("/api/v1/account/vault")) {
        return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
      }

      return new Response(JSON.stringify({}), { status: 404, headers: { "content-type": "application/json" }, statusText: "not found" });
    });

    try {
      render(<SagittariusApp requireJoin dataSource="api" />);

      expect(await screen.findByText("User data stats และ session status")).toBeInTheDocument();
      expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
      expect(screen.getByRole("tab", { name: /^Account$/i })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tab", { name: /Temp access/i })).toHaveAttribute("aria-selected", "false");
      expect(screen.getByRole("link", { name: /^Settings$/i })).toHaveAttribute("href", "/portal/settings");
      expect(screen.queryByLabelText(/Trip ID/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /ส่งรหัส sign-in/i })).not.toBeInTheDocument();
      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(6));
    } finally {
      storage.clear();
      fetchSpy.mockRestore();
    }
  });

  it("keeps account portal routes in the portal even when a trip session is persisted", async () => {
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
    storage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "persisted-trip-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
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
        return new Response(JSON.stringify([{
          id: seedTrip.id,
          name: "Portal Trip",
          destinationLabel: "Hong Kong",
          countries: ["Hong Kong"],
          startDate: "2026-06-18",
          endDate: "2026-06-23",
          role: "owner",
          memberId: seedTrip.members[0].id,
          ownerMemberId: seedTrip.members[0].id,
          joinedAt: "2026-05-30T08:00:00.000Z",
          isOwner: true,
        }]), { status: 200, headers: { "content-type": "application/json" } });
      }

      if (request.includes("/api/v1/account/trip-stats")) {
        return new Response(JSON.stringify({ tripsTotal: 1, tripsOwned: 1, activeTrips: 1, tempClaimsCompleted: 0 }), { status: 200, headers: { "content-type": "application/json" } });
      }

      if (request.includes("/api/v1/account/explorer")) {
        return new Response(JSON.stringify({ upcomingTrips: 1, ownedTrips: 1, destinationCount: 1, nextTrip: null }), { status: 200, headers: { "content-type": "application/json" } });
      }

      if (request.includes("/api/v1/account/to-dos") || request.includes("/api/v1/account/vault")) {
        return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
      }

      return new Response(JSON.stringify({}), { status: 404, headers: { "content-type": "application/json" } });
    });

    try {
      render(<SagittariusApp accessMode="account-portal" portalSection="trips" requireJoin dataSource="api" apiClient={createApiClientForTrip(seedTrip)} />);

      expect(await screen.findByText("Portal Trip")).toBeInTheDocument();
      expect(screen.getByRole("navigation", { name: /Portal navigation/i })).toBeInTheDocument();
      expect(screen.queryByRole("navigation", { name: /เมนูวางแผน Joii/i })).not.toBeInTheDocument();
      expect(screen.queryByText("Command center")).not.toBeInTheDocument();
    } finally {
      storage.clear();
      fetchSpy.mockRestore();
    }
  });

  it("opens an account-linked trip route without asking for trip credentials", async () => {
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
    const apiClient = createApiClientForTrip(seedTrip);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const request = input instanceof Request ? input.url : String(input);

      if (request.includes(`/api/v1/account/trips/${seedTrip.id}/member-sessions`)) {
        return new Response(
          JSON.stringify({
            tripId: seedTrip.id,
            memberId: seedTrip.members[0].id,
            sessionToken: "account-member-session",
            createdAt: "2026-05-30T08:00:00.000Z",
            expiresAt: "2026-06-29T08:00:00.000Z",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }

      return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
    });

    try {
      render(<SagittariusApp accessMode="trip-access" requireJoin dataSource="api" routeTripId={seedTrip.id} apiClient={apiClient} />);

      expect(screen.getByRole("main", { name: /Opening trip/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/Trip ID/i)).not.toBeInTheDocument();
      await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledWith(seedTrip.id, "account-member-session"));
      expect(await screen.findByRole("navigation", { name: /เมนูวางแผน Joii/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /ภาพรวม/i })).toHaveAttribute("aria-current", "page");
      expect(screen.queryByLabelText(/Trip ID/i)).not.toBeInTheDocument();
      expect(window.localStorage.getItem(tripParticipantSessionStorageKey)).toContain("account-member-session");
      expect(window.sessionStorage.getItem(tripParticipantSessionStorageKey)).toBeNull();
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/account/trips/${seedTrip.id}/member-sessions`),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ Authorization: "Bearer playwright-account-session" }),
        }),
      );
    } finally {
      storage.clear();
      fetchSpy.mockRestore();
    }
  });

  it("keeps account state when account trip access check fails transiently", async () => {
    const storage = installLocalStorageStub();
    storage.setItem(
      "sagittarius-account-session",
      JSON.stringify({
        userId: "11111111-1111-1111-1111-111111111111",
        sessionToken: "transient-account-session",
        kind: "trusted",
        trustedDeviceId: "device-1",
        createdAt: "2026-05-30T10:00:00.000Z",
        expiresAt: "2030-01-01T10:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(seedTrip);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const request = input instanceof Request ? input.url : String(input);
      if (request.includes(`/api/v1/account/trips/${seedTrip.id}/member-sessions`)) {
        throw new Error("network down");
      }
      return new Response(JSON.stringify({}), { status: 404, headers: { "content-type": "application/json" } });
    });
    const originalLocation = window.location;
    const locationMock = {
      ...originalLocation,
      pathname: appRoutes.tripOverview(seedTrip.id),
      search: "",
      replace: vi.fn(),
    };
    const locationSpy = vi.spyOn(window, "location", "get").mockReturnValue(locationMock);

    try {
      render(<SagittariusApp accessMode="trip-access" requireJoin dataSource="api" routeTripId={seedTrip.id} apiClient={apiClient} />);

      await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/account/trips/${seedTrip.id}/member-sessions`),
        expect.anything(),
      ));
      expect(storage.getItem("sagittarius-account-session")).toContain("transient-account-session");
      expect(storage.getItem(tripParticipantSessionStorageKey)).toBeNull();
      expect(locationMock.replace).not.toHaveBeenCalledWith(expect.stringContaining("/join"));
    } finally {
      locationSpy.mockRestore();
      fetchSpy.mockRestore();
      storage.clear();
    }
  });

  it("switches trip workspace navigation without reloading the backend cockpit", async () => {
    const user = userEvent.setup();
    const shortTripId = encodeTripId(seedTrip.id);
    installLocalStorageStub();
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "persisted-trip-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    window.history.pushState(null, "", `/trips/${shortTripId}`);
    const apiClient = createApiClientForTrip(seedTrip);

    render(<SagittariusApp accessMode="trip-access" requireJoin dataSource="api" routeTripId={seedTrip.id} apiClient={apiClient} />);

    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole("link", { name: /แผนการเดินทาง/i }));

    expect(window.location.pathname).toBe(`/trips/${shortTripId}/itinerary`);
    expect(screen.getByRole("link", { name: /แผนการเดินทาง/i })).toHaveAttribute("aria-current", "page");
    expect(apiClient.loadTrip).toHaveBeenCalledTimes(1);
  });

  it("re-syncs workspace active link from popstate without extra loadTrip", async () => {
    installLocalStorageStub();
    const shortTripId = encodeTripId(seedTrip.id);
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "persisted-trip-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    window.history.pushState(null, "", `/trips/${shortTripId}`);
    const apiClient = createApiClientForTrip(seedTrip);

    render(<SagittariusApp accessMode="trip-access" requireJoin dataSource="api" routeTripId={seedTrip.id} apiClient={apiClient} />);

    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("link", { name: /ภาพรวม/i })).toHaveAttribute("aria-current", "page");

    act(() => {
      window.history.pushState(null, "", `/trips/${shortTripId}/itinerary`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => expect(screen.getByRole("link", { name: /แผนการเดินทาง/i })).toHaveAttribute("aria-current", "page"));
    expect(screen.getByRole("link", { name: /ภาพรวม/i })).not.toHaveAttribute("aria-current", "page");
    expect(apiClient.loadTrip).toHaveBeenCalledTimes(1);
  });

  it("opens an empty trip timeline without a selected itinerary item", async () => {
    installLocalStorageStub();
    const emptyTrip = {
      ...seedTrip,
      id: "019e83ac-ed69-7df3-9354-b27359800374",
      itineraryItems: [],
      members: [{ ...seedTrip.members[0], tripId: "019e83ac-ed69-7df3-9354-b27359800374" }],
    };
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: emptyTrip.id,
        memberId: emptyTrip.members[0].id,
        sessionToken: "empty-trip-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );

    render(<SagittariusApp accessMode="trip-access" initialView="timeline" requireJoin dataSource="api" routeTripId={emptyTrip.id} apiClient={createApiClientForTrip(emptyTrip)} />);

    expect(await screen.findByRole("region", { name: /ไทม์ไลน์ทริป/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ไทม์ไลน์/i })).toHaveAttribute("aria-current", "page");
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
      createExpense: vi.fn(),
      patchExpense: vi.fn(),
      deleteExpense: vi.fn(),
    };

    render(<SagittariusApp requireJoin dataSource="api" apiClient={apiClient} />);

    fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "HK-SZ-2025" } });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "seed-trip-pass" } });
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
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const request = input instanceof Request ? input.url : String(input);
      if (request.includes(`/api/v1/account/trips/${seedTrip.id}/member-sessions`)) {
        return new Response(JSON.stringify({ code: "forbidden", message: "account is not linked to this trip" }), {
          status: 403,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({}), { status: 404, headers: { "content-type": "application/json" } });
    });

    try {
      render(<SagittariusApp requireJoin dataSource="api" routeTripId={seedTrip.id} apiClient={apiClient} />);

      await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledWith(seedTrip.id, "beam-member-session"));
      expect(await screen.findByRole("heading", { name: /Beam Temp Workspace/i })).toBeInTheDocument();
      expect(storage.getItem(tripParticipantSessionStorageKey)).toContain("beam-member-session");
      expect(fetchSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/account/trips/${seedTrip.id}/member-sessions`),
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

    render(<SagittariusApp requireJoin dataSource="api" initialView="overview" apiClient={apiClient} />);

    await waitFor(() => expect(apiClient.listDailyBriefings).toHaveBeenCalledWith(apiTrip.id, "weather-session-token"));
    expect(await screen.findByRole("region", { name: /พยากรณ์อากาศรายวัน/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Rain 33° 28°/ }));
    expect(screen.getByRole("dialog", { name: /รายละเอียดพยากรณ์อากาศ/i })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Outfit advice override/i), "Pack a compact umbrella");
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

  it("patches trip countries when organizer changes the API trip destination", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const apiTrip = {
      ...seedTrip,
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: apiTrip.id,
        memberId: apiTrip.members[0].id,
        sessionToken: "settings-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const patchTrip = vi.fn().mockResolvedValue({
      ...apiTrip,
      destinationLabel: "Chiang Mai, Thailand",
      countries: ["Thailand"],
      version: 2,
    });
    const apiClient = createApiClientForTrip(apiTrip, { patchTrip });

    render(<SagittariusApp requireJoin dataSource="api" initialView="settings" apiClient={apiClient} />);

    const destinationInput = await screen.findByLabelText("ปลายทาง");
    await user.clear(destinationInput);
    await user.type(destinationInput, "Chiang Mai, Thailand");
    await user.click(screen.getByRole("button", { name: /Save changes/i }));

    await waitFor(() => expect(patchTrip).toHaveBeenCalledWith(
      apiTrip.id,
      "settings-session-token",
      expect.objectContaining({
        destinationLabel: "Chiang Mai, Thailand",
        countries: ["Thailand"],
      }),
    ));
  });

  it("redirects /join to the trip route when a persisted API session already exists", async () => {
    installLocalStorageStub();
    const replaceMock = vi.fn();
    const originalLocation = window.location;
    const locationMock = {
      ...originalLocation,
      pathname: "/join",
      search: "",
      replace: replaceMock,
    };
    const locationSpy = vi.spyOn(window, "location", "get").mockReturnValue(locationMock);
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

    render(<SagittariusApp accessMode="trip-access" requireJoin dataSource="api" apiClient={apiClient} />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith(`/trips/${encodeTripId(seedTrip.id)}`));
    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledWith(seedTrip.id, "persisted-join-session-token"));

    locationSpy.mockRestore();
  });

  it("falls back to trip route when /join returnTo points to /trips", async () => {
    installLocalStorageStub();
    const replaceMock = vi.fn();
    const originalLocation = window.location;
    const locationMock = {
      ...originalLocation,
      pathname: "/join",
      search: `?rt=${encodeURIComponent(encodeReturnTo("/trips"))}`,
      replace: replaceMock,
    };
    const locationSpy = vi.spyOn(window, "location", "get").mockReturnValue(locationMock);
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

    render(<SagittariusApp accessMode="trip-access" requireJoin dataSource="api" apiClient={apiClient} />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith(`/trips/${encodeTripId(seedTrip.id)}`));
    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledWith(seedTrip.id, "persisted-join-session-token"));

    locationSpy.mockRestore();
  });

  it("resolveJoinPostAuthReturnTo only accepts safe trip-scoped return targets", () => {
    const tripId = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
    expect(resolveJoinPostAuthReturnTo("/trips", tripId)).toBeNull();
    expect(resolveJoinPostAuthReturnTo(`/trips/${tripId}/itinerary`, tripId)).toBe(`/trips/${tripId}/itinerary`);
    expect(resolveJoinPostAuthReturnTo(`/trips/${tripId}?foo=1`, tripId)).toBe(`/trips/${tripId}?foo=1`);
    expect(resolveJoinPostAuthReturnTo(`/trips/018fc9c4-9cf0-7384-93ee-9bdc9c8d8f99/members`, tripId)).toBeNull();
    expect(resolveJoinPostAuthReturnTo("/settings", tripId)).toBe("/settings");
    expect(resolveJoinPostAuthReturnTo("/trips/AY9OgFeIfeCkXIpVXRf8LQ/itinerary", tripId)).toBe("/trips/AY9OgFeIfeCkXIpVXRf8LQ/itinerary");
  });

  it("keeps a persisted API session when the public route uses the canonical UUID", async () => {
    installLocalStorageStub();
    const apiTrip = {
      ...seedTrip,
      id: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f11",
      name: "Canonical Route API Trip",
      joinPasswordHash: "",
      members: [{
        ...seedTrip.members[0],
        id: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f22",
        tripId: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f11",
        claimPasswordHash: null,
      }],
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

    render(<SagittariusApp requireJoin dataSource="api" initialView="overview" routeTripId={apiTrip.id} apiClient={apiClient} />);

    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledWith(apiTrip.id, "canonical-route-session-token"));
    expect(await screen.findByRole("heading", { name: /Canonical Route API Trip/i })).toBeInTheDocument();
  });

  it("rejects a persisted API session when a canonical UUID route belongs to another trip", async () => {
    installLocalStorageStub();
    const replaceMock = vi.fn();
    const originalLocation = window.location;
    const locationMock = {
      ...originalLocation,
      pathname: "/trips/018fc9c4-9cf0-7384-93ee-9bdc9c8d8f99",
      search: "",
      replace: replaceMock,
    };
    const locationSpy = vi.spyOn(window, "location", "get").mockReturnValue(locationMock);

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

    render(<SagittariusApp requireJoin dataSource="api" initialView="overview" routeTripId="018fc9c4-9cf0-7384-93ee-9bdc9c8d8f99" apiClient={apiClient} />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith(`/join?rt=${encodeURIComponent(encodeReturnTo("/trips/018fc9c4-9cf0-7384-93ee-9bdc9c8d8f99"))}`));
    expect(apiClient.loadTrip).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(tripParticipantSessionStorageKey)).toBeNull();

    locationSpy.mockRestore();
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
    window.sessionStorage.setItem(
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
    window.sessionStorage.setItem(
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
    window.sessionStorage.setItem(
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

  it("recovers to access instead of hanging when persisted API hydration is unauthenticated", async () => {
    installLocalStorageStub();
    window.sessionStorage.setItem(
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
    vi.mocked(apiClient.loadTrip).mockRejectedValue(new TripApiError({
      code: "unauthenticated",
      message: "session expired",
      status: 401,
    }));

    render(<SagittariusApp requireJoin dataSource="api" initialView="overview" apiClient={apiClient} />);

    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledWith(seedTrip.id, "expired-session-token"));
    expect(await screen.findByRole("main", { name: /Account access/i })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/สิทธิ์ไม่ถูกต้อง/i);
    expect(window.sessionStorage.getItem(tripParticipantSessionStorageKey)).toBeNull();
  });

  it("keeps a persisted API session when hydration fails transiently", async () => {
    const storage = installLocalStorageStub();
    storage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "network-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(seedTrip);
    vi.mocked(apiClient.loadTrip).mockRejectedValue(new Error("network down"));

    render(<SagittariusApp requireJoin dataSource="api" routeTripId={seedTrip.id} initialView="overview" apiClient={apiClient} />);

    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledWith(seedTrip.id, "network-session-token"));
    expect(storage.getItem(tripParticipantSessionStorageKey)).toContain("network-session-token");
    expect(screen.queryByRole("main", { name: /Account access/i })).not.toBeInTheDocument();
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
      listDailyBriefings: vi.fn().mockResolvedValue([]),
      patchDailyBriefing: vi.fn(),
      patchTrip: vi.fn(),
      createPlanVariant: vi.fn(),
      patchPlanVariant: vi.fn(),
      publishPlanVariant: vi.fn(),
      createTask: vi.fn(),
      patchTask: vi.fn(),
      patchItineraryItem: vi.fn().mockResolvedValue(patchedItem),
      createItineraryItem: vi.fn(),
      deleteItineraryItem: vi.fn(),
      reorderItineraryItems: vi.fn(),
      importItinerary: vi.fn(),
      createSuggestion: vi.fn(),
      approveSuggestion: vi.fn().mockResolvedValue({ ...pendingSuggestion, status: "approved" }),
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
      createExpense: vi.fn(),
      patchExpense: vi.fn(),
      deleteExpense: vi.fn(),
    };

    render(<SagittariusApp requireJoin dataSource="api" initialView="itinerary" apiClient={apiClient} />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/^Trip password$/i), "seed-trip-pass");
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(await screen.findByRole("button", { name: /Demo Traveler/i }));
    await user.type(screen.getByLabelText(/ตั้งรหัสสำหรับ Demo Traveler/i), "owner-pin");
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    await openFirstStopDetails(user);
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

  it("edits itinerary duration inline through the API client after backend login", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const selectedItem = seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!;
    const ownerTrip = { ...seedTrip, joinPasswordHash: "" };
    const patchedItem = { ...selectedItem, durationMinutes: 90, version: selectedItem.version + 1 };
    const apiClient = createApiClientForTrip(ownerTrip, {
      patchItineraryItem: vi.fn().mockResolvedValue(patchedItem),
    });

    render(<SagittariusApp requireJoin dataSource="api" initialView="itinerary" apiClient={apiClient} />);

    await loginApiTrip(user);
    const row = await screen.findByRole("row", { name: /Dim Dim Sum/i });
    await user.click(within(row).getByRole("button", { name: /แก้ไขระยะเวลา Dim Dim Sum/i }));
    await user.click(within(screen.getByRole("dialog", { name: /แก้ไขระยะเวลา Dim Dim Sum/i })).getByRole("button", { name: /1 h 30 m/i }));

    await waitFor(() => expect(apiClient.patchItineraryItem).toHaveBeenCalledWith(
      ownerTrip.id,
      selectedItem.id,
      "session-token",
      expect.objectContaining({
        expectedVersion: selectedItem.version,
        patch: expect.objectContaining({ durationMinutes: 90 }),
      }),
    ));
  }, 45_000);

  it("reloads the latest API trip and clears auto overlap resolution when item versions conflict", async () => {
    const user = userEvent.setup();
    const day = "2026-06-18";
    const baseItem = seedTrip.itineraryItems.find((item) => item.day === day)!;
    const overlapMain = {
      ...baseItem,
      id: "item-overlap-main",
      day,
      startTime: "08:00",
      durationMinutes: 180,
      sortOrder: 100,
      activity: "API overlap main",
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: "main" as const,
      version: 4,
    };
    const overlapLater = {
      ...baseItem,
      id: "item-overlap-later",
      day,
      startTime: "08:30",
      durationMinutes: 60,
      sortOrder: 200,
      activity: "API overlap later",
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: "main" as const,
      version: 4,
    };
    const overlapTrip = { ...seedTrip, joinPasswordHash: "", itineraryItems: [overlapMain, overlapLater] };
    const resolvedTrip = {
      ...overlapTrip,
      itineraryItems: [
        { ...overlapMain, pathGroupId: "path-group-item-overlap-main", version: 5 },
        {
          ...overlapLater,
          pathGroupId: "path-group-item-overlap-main",
          pathId: "path-2026-06-18-sub-a",
          pathName: "Plan A",
          pathRole: "alternative" as const,
          version: 5,
        },
      ],
    };
    let patchConflicted = false;
    const loadTrip = vi.fn().mockImplementation(() =>
      Promise.resolve({
        trip: patchConflicted ? resolvedTrip : overlapTrip,
        suggestions: [],
        tasks: [],
        stopNotes: [],
        expenseSummary: null,
      })
    );
    const apiClient = createApiClientForTrip(overlapTrip, {
      loadTrip,
      patchItineraryItem: vi.fn().mockImplementationOnce(() => {
        patchConflicted = true;
        return Promise.reject(new TripApiError({ code: "version_conflict", message: "version conflict", status: 409 }));
      }),
    });

    render(<SagittariusApp requireJoin dataSource="api" initialView="itinerary" apiClient={apiClient} />);

    await loginApiTrip(user);
    const autoButton = await screen.findByRole("button", { name: /Auto fix overlaps for Day 1/i });
    await waitFor(() => expect(autoButton).toBeEnabled());
    await user.click(autoButton);

    await waitFor(() => expect(apiClient.patchItineraryItem).toHaveBeenCalledTimes(1));
    expect(loadTrip.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole("button", { name: /Auto fix overlaps for Day 1/i })).not.toBeInTheDocument();
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
      listDailyBriefings: vi.fn().mockResolvedValue([]),
      patchDailyBriefing: vi.fn(),
      patchTrip: vi.fn(),
      createPlanVariant: vi.fn(),
      patchPlanVariant: vi.fn(),
      publishPlanVariant: vi.fn(),
      createTask: vi.fn(),
      patchTask: vi.fn(),
      patchItineraryItem: vi.fn(),
      createItineraryItem: vi.fn(),
      deleteItineraryItem: vi.fn(),
      reorderItineraryItems: vi.fn(),
      importItinerary: vi.fn(),
      createSuggestion: vi.fn().mockResolvedValue(apiSuggestion),
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
      createExpense: vi.fn(),
      patchExpense: vi.fn(),
      deleteExpense: vi.fn(),
    };

    render(<SagittariusApp requireJoin dataSource="api" initialView="itinerary" apiClient={apiClient} />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/^Trip password$/i), "seed-trip-pass");
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(await screen.findByRole("button", { name: /Explorer Friend/i }));
    await user.type(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), "traveler-pin");
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));
    await openFirstStopDetails(user);
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

  it("deletes itinerary stops through the API client in API mode", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const selectedItem = seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!;
    const nextItem = seedTrip.itineraryItems.find((item) => item.id !== selectedItem.id)!;
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
    const apiClient = createApiClientForTrip(ownerTrip, {
      loadTrip: vi.fn().mockResolvedValue(cockpit),
      listDailyBriefings: vi.fn().mockResolvedValue([]),
      patchDailyBriefing: vi.fn(),
      deleteItineraryItem: vi.fn().mockResolvedValue({ ...selectedItem, version: selectedItem.version + 1 }),
    });

    render(<SagittariusApp requireJoin dataSource="api" initialView="itinerary" apiClient={apiClient} />);

    await loginApiTrip(user);
    await user.click(await screen.findByRole("button", { name: new RegExp(`เลือกจุด ${selectedItem.activity}`, "i") }));
    await user.click(screen.getByRole("button", { name: /แก้ไขรายละเอียด/i }));
    await user.click(screen.getByRole("button", { name: /ลบจุดนี้/i }));
    const dialog = screen.getByRole("dialog", { name: new RegExp(`ยืนยันการลบ ${selectedItem.activity}`, "i") });
    await user.click(within(dialog).getByRole("button", { name: /ลบกิจกรรม/i }));

    expect(apiClient.deleteItineraryItem).toHaveBeenCalledWith(ownerTrip.id, selectedItem.id, "session-token");
    expect(screen.queryByText(selectedItem.activity)).not.toBeInTheDocument();
    expect(screen.getAllByText(nextItem.activity).length).toBeGreaterThan(0);
  });

  it("keeps an itinerary stop when delete confirmation is cancelled", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const selectedItem = seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!;
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
    const apiClient = createApiClientForTrip(ownerTrip, {
      loadTrip: vi.fn().mockResolvedValue(cockpit),
      listDailyBriefings: vi.fn().mockResolvedValue([]),
      patchDailyBriefing: vi.fn(),
      deleteItineraryItem: vi.fn(),
    });

    render(<SagittariusApp requireJoin dataSource="api" initialView="itinerary" apiClient={apiClient} />);

    await loginApiTrip(user);
    await user.click(await screen.findByRole("button", { name: new RegExp(`เลือกจุด ${selectedItem.activity}`, "i") }));
    await user.click(screen.getByRole("button", { name: /แก้ไขรายละเอียด/i }));
    await user.click(screen.getByRole("button", { name: /ลบจุดนี้/i }));
    const dialog = screen.getByRole("dialog", { name: new RegExp(`ยืนยันการลบ ${selectedItem.activity}`, "i") });
    await user.click(within(dialog).getByRole("button", { name: /ไม่ลบ/i }));

    expect(apiClient.deleteItineraryItem).not.toHaveBeenCalled();
    expect(screen.getAllByText(selectedItem.activity).length).toBeGreaterThan(0);
  });

  it("exposes production write surfaces in API mode when backend routes exist", async () => {
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
    expect(screen.getAllByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })[0]).toBeEnabled();
    await openFirstStopDetails(user);

    const context = screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i });
    expect(within(context).getByLabelText(/เพิ่มโน้ตสำหรับจุดนี้/i)).toBeEnabled();
    expect(within(context).getByRole("button", { name: /บันทึกโน้ต/i })).toBeDisabled();
    await user.type(within(context).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Taxi");
    await user.type(within(context).getByLabelText(/จำนวนเงิน/i), "120");
    expect(within(context).getByRole("button", { name: /เพิ่ม\/แก้ไขค่าใช้จ่าย/i })).toBeEnabled();
    await user.click(within(context).getByRole("button", { name: /เพิ่ม\/แก้ไขค่าใช้จ่าย/i }));
    expect(within(context).getByRole("button", { name: /เพิ่ม\/แก้ไขค่าใช้จ่าย/i })).toBeDisabled();
    await user.type(within(context).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Taxi");
    await user.type(within(context).getByLabelText(/จำนวนเงิน/i), "120");
    expect(within(context).getByRole("button", { name: /เพิ่ม\/แก้ไขค่าใช้จ่าย/i })).toBeEnabled();
    unmount();
    window.localStorage.clear();
    window.sessionStorage.clear();

    const membersClient = createApiClientForTrip(ownerTrip);
    render(<SagittariusApp requireJoin dataSource="api" initialView="members" apiClient={membersClient} />);
    await loginApiTrip(user);

    expect(screen.getByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i })).toBeEnabled();
  });

  it("opens directly into the trip overview instead of a marketing landing page", () => {
    const { container } = render(<SagittariusApp />);
    const workspaceGrid = container.querySelector(".workspace-grid");
    const planningMain = container.querySelector(".planning-main");

    expect(screen.getAllByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i })).toBeInTheDocument();
    expect(screen.queryByRole("banner", { name: /Trip command bar/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/ศูนย์จัดการทริป/i).length).toBeGreaterThan(0);
    expect(workspaceGrid).toBeInTheDocument();
    expect(workspaceGrid).toContainElement(planningMain as HTMLElement);
    expect(planningMain).toContainElement(screen.getByRole("region", { name: /Trip overview/i }));
    expect(screen.getByRole("region", { name: /Trip overview/i })).toBeInTheDocument();
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

    const navigation = screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i });
    const railLinks = navigation.querySelector(".rail-links");
    expect(railLinks).not.toBeNull();
    const links = within(railLinks as HTMLElement).getAllByRole("link");

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      "ภาพรวม",
      "แผนการเดินทาง",
      "แผนที่",
      "ไทม์ไลน์",
      "สมาชิก",
      "Settings",
    ]);
    expect(within(navigation).getByRole("link", { name: /ภาพรวม/i })).toHaveClass("rail-link--active");
    expect(within(navigation).queryByRole("link", { name: /งบประมาณ/i })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: /รายการจอง/i })).not.toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: /^Settings$/ })).toBeInTheDocument();
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
    expect(within(timeline).getAllByText(/วันที่ 2/i).length).toBeGreaterThan(0);
  });

  it("renders trip members as their own workspace page", () => {
    const shortTripId = encodeTripId(seedTrip.id);
    render(<SagittariusApp initialView="members" />);

    const navigation = screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i });
    const membersLink = within(navigation).getByRole("link", { name: /สมาชิก/i });

    expect(membersLink).toHaveClass("rail-link--active");
    expect(membersLink).toHaveAttribute("href", `/trips/${shortTripId}/members`);
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
    expect(container.querySelector(".page-header")).toHaveTextContent("18–23 มิ.ย. 2026");
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
    expect(screen.queryByRole("navigation", { name: /เมนูวางแผน Joii/i })).not.toBeInTheDocument();
    expect(await screen.findByRole("navigation", { name: /เมนูวางแผน Joii/i })).toBeInTheDocument();
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

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/join/HK-SZ-2025"));
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

  it("keeps removed undo and redo controls out of the itinerary toolbar", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    expect(screen.queryByRole("button", { name: /เลิกทำ/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ทำซ้ำ/i })).not.toBeInTheDocument();
    await openFirstStopDetails(user);
    expect(screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).toBeInTheDocument();
  });

  it("keeps read-only forced actions from mutating itinerary or suggestions", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.selectOptions(screen.getByLabelText(/Role preview/i), "member-viewer");
    const addStopButton = screen.getAllByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })[0];
    (addStopButton as HTMLButtonElement).disabled = false;
    fireEvent.click(addStopButton);
    expect(screen.queryByRole("dialog", { name: /เพิ่มกิจกรรม/i })).not.toBeInTheDocument();

    const dataTransfer = createDataTransfer();
    dataTransfer.setData("text/plain", "missing-item");
    fireEvent.drop(screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i }).closest("tr")!, { dataTransfer });
    expect(screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i })).toBeInTheDocument();

    await openFirstStopDetails(user);
    const suggestButton = screen.getByRole("button", { name: /เสนอแก้ไข/i });
    (suggestButton as HTMLButtonElement).disabled = false;
    fireEvent.click(suggestButton);
    expect(screen.queryByText(/Viewer Guest suggested an update/i)).not.toBeInTheDocument();
  });

  it("can start on real route paths with the right surface first", () => {
    const { rerender } = render(<SagittariusApp initialView="map" />);

    const navigation = screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i });
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
    expect(screen.getByText(/6\/16 มีพิกัด/i)).toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 2/i }));
    await user.click(screen.getByRole("button", { name: /ยกเลิก/i }));
    expect(screen.queryByRole("dialog", { name: /เพิ่มกิจกรรม/i })).not.toBeInTheDocument();
  });

  it("collapses the left rail and keeps labels accessible", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /ย่อเมนู/i }));

    const nav = screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i });
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
    expect(getFirstStopDetailsButton()).toBeInTheDocument();

    await openFirstStopDetails(user);

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

    await openFirstStopDetails(user);

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

  it("opens context details for an alternative activity selected from the graph", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const mainItem = {
      ...seedTrip.itineraryItems[0],
      id: "graph-main-app",
      day: seedTrip.startDate,
      activity: "Graph app main",
      pathGroupId: "graph-app-group",
      pathRole: "main" as const,
    };
    const alternativeItem = {
      ...mainItem,
      id: "graph-alt-app",
      activity: "Graph app alternative",
      pathId: "path-2026-06-18-sub-a",
      pathName: "Plan A",
      pathRole: "alternative" as const,
    };
    storage.setItem(tripStorageKey, JSON.stringify({
      ...seedTrip,
      itineraryItems: [mainItem, alternativeItem],
    }));
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(await screen.findByRole("button", { name: /Graph app alternative on Plan A/i }));

    const context = screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i });
    expect(within(context).getByRole("heading", { name: /Graph app alternative/i })).toBeInTheDocument();
  });

  it("closes the right context drawer when clicking outside it", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    await openFirstStopDetails(user);
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");

    await user.click(screen.getByRole("region", { name: /ตารางแผนการเดินทาง/i }));

    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "closed");
    expect(screen.queryByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).not.toBeInTheDocument();
  });

  it("keeps the context drawer mounted during the close animation and ignores non-element document events", async () => {
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    fireEvent.click(getFirstStopDetailsButton());
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

    fireEvent.click(getFirstStopDetailsButton());
    fireEvent.click(screen.getByRole("row", { name: /เปิดรายละเอียดของ Victoria Peak/i }));

    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");
    expect(within(screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).getByRole("heading", { name: /Dim Dim Sum/i })).toBeInTheDocument();
  });

  it("keeps the right context drawer open when clicking inside it", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    await openFirstStopDetails(user);
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

    expect(screen.getByRole("button", { name: /Import/i })).toBeEnabled();

    await user.selectOptions(screen.getByLabelText(/Role preview/i), "member-viewer");

    expect(screen.getByRole("button", { name: /Import/i })).toBeDisabled();
    expect(screen.getByText(/ต้องมีสิทธิ์ผู้จัดทริปจึงจะแก้ไขได้/i)).toBeInTheDocument();
  });

  it("lets travelers submit a suggestion instead of directly editing a stop", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.selectOptions(screen.getByLabelText(/Role preview/i), "member-nam");
    await openFirstStopDetails(user);
    await user.click(screen.getByRole("button", { name: /เสนอแก้ไข/i }));

    expect(screen.getByText(/คำแนะนำ \(3\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Explorer Friend เสนอการปรับแผน/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ปรับเวลาอัตโนมัติ/i })).toBeDisabled();
  });

  it("uses the stop workspace for notes, booking prep, and suggestion review", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await openFirstStopDetails(user);

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

    await openFirstStopDetails(user);

    const context = screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i });
    await user.click(within(context).getByRole("tab", { name: /ข้อเสนอ/i }));
    expect(within(context).getAllByText(/ร้านนี้ได้รับคะแนนสูง 4\.3\/5/i).length).toBeGreaterThan(0);

    await user.click(within(context).getByRole("tab", { name: /การจอง/i }));
    expect(within(context).getByText(/ยืนยันคิว Dim Dim Sum/i)).toBeInTheDocument();
  });

  it("adds a new itinerary stop from a day action", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 2/i }));

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
    expect(await screen.findByRole("button", { name: /เลือกจุด Coffee break at K11 Musea/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Coffee break at K11 Musea on Plan A/i })).toBeInTheDocument();
    expect(within(screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i })).getByRole("heading", { name: /Coffee break at K11 Musea/i })).toBeInTheDocument();
  });

  it("manually promotes an overlapping stop to the main plan from edit details", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 2/i }));

    let dialog = screen.getByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    await user.clear(within(dialog).getByLabelText(/^เวลา$/i));
    await user.type(within(dialog).getByLabelText(/^เวลา$/i), "16:45");
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(within(dialog).getByLabelText(/กิจกรรม/i), "Manual main coffee");
    await user.clear(within(dialog).getByLabelText(/สถานที่/i));
    await user.type(within(dialog).getByLabelText(/สถานที่/i), "K11 Musea");
    await user.clear(within(dialog).getByLabelText(/^ชั่วโมง$/i));
    await user.type(within(dialog).getByLabelText(/^ชั่วโมง$/i), "0");
    await user.selectOptions(within(dialog).getByLabelText(/^นาที$/i), "45");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกกิจกรรม/i }));

    await user.click(await screen.findByRole("button", { name: /เลือกจุด Manual main coffee/i }));
    await user.click(screen.getByRole("button", { name: /แก้ไขรายละเอียด/i }));

    dialog = screen.getByRole("dialog", { name: /แก้ไขรายละเอียด/i });
    await user.selectOptions(within(dialog).getByLabelText("แผน"), "main");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกการแก้ไข/i }));

    expect(await screen.findByRole("button", { name: /เลือกจุด Manual main coffee/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Manual main coffee on Main/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /เดินเล่นย่าน Central.*on Plan A/i })).toBeInTheDocument();
  });

  it("promotes another stop when the current main stop is manually moved to a new plan", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 2/i }));

    let dialog = screen.getByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    await user.clear(within(dialog).getByLabelText(/^เวลา$/i));
    await user.type(within(dialog).getByLabelText(/^เวลา$/i), "16:45");
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(within(dialog).getByLabelText(/กิจกรรม/i), "Promoted after demote coffee");
    await user.clear(within(dialog).getByLabelText(/สถานที่/i));
    await user.type(within(dialog).getByLabelText(/สถานที่/i), "K11 Musea");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกกิจกรรม/i }));

    expect(await screen.findByRole("button", { name: /เลือกจุด Promoted after demote coffee/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /ปิดรายละเอียด/i }));
    await user.click(screen.getByRole("button", { name: /เลือกจุด เดินเล่นย่าน Central/i }));
    await user.click(screen.getByRole("button", { name: /แก้ไขรายละเอียด/i }));

    dialog = screen.getByRole("dialog", { name: /แก้ไขรายละเอียด/i });
    await user.selectOptions(within(dialog).getByLabelText("แผน"), "path-2026-06-19-sub-b");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกการแก้ไข/i }));

    expect(screen.getByRole("button", { name: /เลือกจุด Promoted after demote coffee/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Promoted after demote coffee on Main/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /เดินเล่นย่าน Central.*on Plan B/i })).toBeInTheDocument();
  });

  it("keeps a generated day plan visible in the graph and selectable from the matching day path selector", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 2/i }));

    const dialog = screen.getByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    await user.clear(within(dialog).getByLabelText(/^เวลา$/i));
    await user.type(within(dialog).getByLabelText(/^เวลา$/i), "16:45");
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(within(dialog).getByLabelText(/กิจกรรม/i), "Day filter coffee");
    await user.clear(within(dialog).getByLabelText(/สถานที่/i));
    await user.type(within(dialog).getByLabelText(/สถานที่/i), "K11 Musea");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกกิจกรรม/i }));

    expect(await screen.findByRole("button", { name: /เลือกจุด Day filter coffee/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Day filter coffee on Plan A/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /กรองแผน|แสดงตัวกรอง/i }));
    expect(screen.getByLabelText("Plan A")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Path for Day 2/i }));
    await user.click(within(screen.getByRole("listbox", { name: /Path for Day 2/i })).getByRole("option", { name: "Plan A" }));

    expect(await screen.findByRole("button", { name: /เลือกจุด Day filter coffee/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Path for Day 2/i })).toHaveTextContent("Plan A");
    expect(screen.getByRole("button", { name: /เลือกจุด เดินเล่นย่าน Central/i })).toBeInTheDocument();
  });

  it("adds a new itinerary stop into the selected item's day", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /เลือกจุด เช็คเอาท์จากโรงแรม/i }));
    await user.click(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 3/i }));

    const dialog = screen.getByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    await user.clear(within(dialog).getByLabelText(/^เวลา$/i));
    await user.type(within(dialog).getByLabelText(/^เวลา$/i), "16:45");
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(within(dialog).getByLabelText(/กิจกรรม/i), "Shenzhen late tea");
    await user.clear(within(dialog).getByLabelText(/สถานที่/i));
    await user.type(within(dialog).getByLabelText(/สถานที่/i), "Shenzhen Garden");
    await user.selectOptions(within(dialog).getByLabelText(/^นาที$/i), "30");
    await user.clear(within(dialog).getByLabelText(/การเดินทาง/i));
    await user.type(within(dialog).getByLabelText(/การเดินทาง/i), "เดิน");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกกิจกรรม/i }));

    expect(screen.queryByRole("dialog", { name: /เพิ่มกิจกรรม/i })).not.toBeInTheDocument();

    const stopButtons = screen.getAllByRole("button", { name: /^เลือกจุด / });
    const labels = stopButtons.map((button) => button.getAttribute("aria-label") ?? "");

    expect(labels.find((label) => label.includes("เช็คเอาท์จากโรงแรม"))).not.toBeUndefined();
    expect(labels.find((label) => label.includes("เข้าพักโรงแรมที่ Shenzhen"))).not.toBeUndefined();
    expect(labels.find((label) => label.includes("Shenzhen late tea"))).not.toBeUndefined();

    const checkoutIndex = labels.findIndex((label) => label.includes("เช็คเอาท์จากโรงแรม"));
    const shenzhenHotelIndex = labels.findIndex((label) => label.includes("เข้าพักโรงแรมที่ Shenzhen"));
    const lateTeaIndex = labels.findIndex((label) => label.includes("Shenzhen late tea"));

    expect(lateTeaIndex).toBeGreaterThan(shenzhenHotelIndex);
    expect(lateTeaIndex).toBeGreaterThan(checkoutIndex);
    expect(checkoutIndex).toBeGreaterThan(-1);
    expect(shenzhenHotelIndex).toBeGreaterThan(-1);
  });

  it("uses trip first day when no selected item is available and keeps sort order increasing", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const emptyTrip = {
      ...seedTrip,
      id: "019e83ac-ed69-7df3-9354-b27359800374",
      itineraryItems: [],
      members: [{ ...seedTrip.members[0], tripId: "019e83ac-ed69-7df3-9354-b27359800374" }],
    };
    storage.setItem(tripStorageKey, JSON.stringify(emptyTrip));

    render(<SagittariusApp initialView="itinerary" />);

    expect(await screen.findByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 1/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 1/i }));

    let dialog = screen.getByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    await user.clear(within(dialog).getByLabelText(/^เวลา$/i));
    await user.type(within(dialog).getByLabelText(/^เวลา$/i), "16:30");
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(within(dialog).getByLabelText(/กิจกรรม/i), "Evening check-in stop");
    await user.clear(within(dialog).getByLabelText(/สถานที่/i));
    await user.type(within(dialog).getByLabelText(/สถานที่/i), "Harbourfront Lounge");
    await user.clear(within(dialog).getByLabelText(/การเดินทาง/i));
    await user.type(within(dialog).getByLabelText(/การเดินทาง/i), "แท็กซี่");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกกิจกรรม/i }));
    expect(screen.queryByRole("dialog", { name: /เพิ่มกิจกรรม/i })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("วันที่ 1")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 1/i }));

    dialog = screen.getByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    await user.clear(within(dialog).getByLabelText(/^เวลา$/i));
    await user.type(within(dialog).getByLabelText(/^เวลา$/i), "08:00");
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(within(dialog).getByLabelText(/กิจกรรม/i), "Morning market visit");
    await user.clear(within(dialog).getByLabelText(/สถานที่/i));
    await user.type(within(dialog).getByLabelText(/สถานที่/i), "Mong Kok Market");
    await user.clear(within(dialog).getByLabelText(/การเดินทาง/i));
    await user.type(within(dialog).getByLabelText(/การเดินทาง/i), "MTR");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกกิจกรรม/i }));
    expect(screen.queryByRole("dialog", { name: /เพิ่มกิจกรรม/i })).not.toBeInTheDocument();

    const stopButtons = screen.getAllByRole("button", { name: /^เลือกจุด / });
    expect(stopButtons).toHaveLength(2);
    expect(stopButtons[0]).toHaveAccessibleName(/เลือกจุด Evening check-in stop/i);
    expect(stopButtons[1]).toHaveAccessibleName(/เลือกจุด Morning market visit/i);
  });

  it("edits the selected stop", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await openFirstStopDetails(user);
    await user.click(screen.getByRole("button", { name: /แก้ไขรายละเอียด/i }));

    const dialog = screen.getByRole("dialog", { name: /แก้ไขรายละเอียด/i });
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(within(dialog).getByLabelText(/กิจกรรม/i), "Dim Dim Sum revised");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกการแก้ไข/i }));

    const context = screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i });
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

function installSessionStorageStub() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    value: storage,
  });
  return storage;
}

async function loginApiTrip(user: ReturnType<typeof userEvent.setup>) {
  fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "HK-SZ-2025" } });
  fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "seed-trip-pass" } });
  await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
  await user.click(await screen.findByRole("button", { name: /Demo Traveler/i }));
  fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Demo Traveler/i), { target: { value: "owner-pin" } });
  await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));
}

function createApiClientForTrip(trip: Trip, overrides: Partial<TripApiClient> = {}): TripApiClient {
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
    listDailyBriefings: vi.fn().mockResolvedValue([]),
    patchDailyBriefing: vi.fn(),
    patchTrip: vi.fn(),
    createPlanVariant: vi.fn(),
    patchPlanVariant: vi.fn(),
    publishPlanVariant: vi.fn(),
    createTask: vi.fn(),
    patchTask: vi.fn(),
    createItineraryItem: vi.fn(),
    patchItineraryItem: vi.fn(),
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
    createExpense: vi.fn().mockImplementation((_tripId: string, _sessionToken: string, request: CreateExpenseApiRequest) =>
      Promise.resolve({
        id: "new-expense-id",
        title: request.title,
        amount: request.amountMinor ? request.amountMinor / 100 : 0,
        amountMinor: request.amountMinor || 0,
        paidBy: request.paidBy,
        splits: request.splits || {},
        category: request.category || "general",
        itineraryItemId: request.itineraryItemId || null,
        version: 1,
      }),
    ),
    patchExpense: vi.fn(),
    deleteExpense: vi.fn(),
    ...overrides,
  };
}

function dailyBriefingFixture(tripId: string, date: string): TripDailyBriefing {
  return {
    tripId,
    date,
    locationKey: "destination:hong-kong",
    locationLabel: "Hong Kong",
    coordinates: null,
    weather: {
      conditionCode: "rain",
      conditionLabel: "Rain",
      temperatureMaxCelsius: 33,
      temperatureMinCelsius: 28,
      humidityPercent: 82,
      windSpeedKph: 16,
      rainChancePercent: 64,
      meta: { source: "Open-Meteo", sourceUrl: null, fetchedAt: "2026-06-04T00:00:00Z", expiresAt: "2026-06-04T06:00:00Z", confidence: "high", unavailableReason: null },
    },
    holiday: null,
    festival: null,
    facts: null,
    outfitAdvice: { title: "Outfit advice", body: "Light shirt and compact umbrella.", meta: { source: "Sagittarius", sourceUrl: null, fetchedAt: null, expiresAt: null, confidence: "medium", unavailableReason: null } },
    manualOverrides: {},
    updatedAt: "2026-06-04T00:00:00Z",
    version: 1,
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
