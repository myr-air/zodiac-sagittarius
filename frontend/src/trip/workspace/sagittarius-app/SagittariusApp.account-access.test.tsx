import {
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SagittariusApp,
} from "@/src/app/SagittariusApp";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { seedTrip } from "@/src/trip/seed";
import {
  optionalTrailingSlashPattern,
  portalRoutes,
  appRoutes,
} from "@/src/trip/workspace/sagittarius-app/support";
import {
  createApiClientForTrip,
  installLocalStorageStub,
  installSessionStorageStub,
  render,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit account access", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", appRoutes.home());
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

    expect(screen.getByRole("tab", { name: /Temp access/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await waitFor(() =>
      expect(storage.getItem("sagittarius-account-session")).toBeNull(),
    );

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

    expect(screen.getByRole("tab", { name: /Temp access/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await waitFor(() =>
      expect(storage.getItem("sagittarius-account-session")).toBeNull(),
    );
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

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const request = input instanceof Request ? input.url : String(input);

        if (
          request.includes("/api/v1/account") &&
          !request.includes("/api/v1/account/trips") &&
          !request.includes("/api/v1/account/trip-stats")
        ) {
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
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
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

        if (
          request.includes("/api/v1/account/to-dos") ||
          request.includes("/api/v1/account/vault")
        ) {
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response(JSON.stringify({}), {
          status: 404,
          headers: { "content-type": "application/json" },
          statusText: "not found",
        });
      });

    try {
      render(<SagittariusApp requireJoin dataSource="api" />);

      expect(
        await screen.findByText("User data stats และ session status"),
      ).toBeInTheDocument();
      expect(screen.getAllByText(/Dashboard|แดชบอร์ด/).length).toBeGreaterThan(
        0,
      );
      expect(screen.getByRole("tab", { name: /^Account$/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByRole("tab", { name: /Temp access/i })).toHaveAttribute(
        "aria-selected",
        "false",
      );
      expect(
        screen.getByRole("link", { name: /^Settings$|^ตั้งค่า$/i }),
      ).toHaveAttribute(
        "href",
        expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.settings)),
      );
      expect(screen.queryByLabelText(/Trip ID/i)).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /ส่งรหัส sign-in/i }),
      ).not.toBeInTheDocument();
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
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const request = input instanceof Request ? input.url : String(input);

        if (
          request.includes("/api/v1/account") &&
          !request.includes("/api/v1/account/trips") &&
          !request.includes("/api/v1/account/trip-stats")
        ) {
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
          return new Response(
            JSON.stringify([
              {
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
              },
            ]),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        if (request.includes("/api/v1/account/trip-stats")) {
          return new Response(
            JSON.stringify({
              tripsTotal: 1,
              tripsOwned: 1,
              activeTrips: 1,
              tempClaimsCompleted: 0,
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        if (request.includes("/api/v1/account/explorer")) {
          return new Response(
            JSON.stringify({
              upcomingTrips: 1,
              ownedTrips: 1,
              destinationCount: 1,
              nextTrip: null,
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        if (
          request.includes("/api/v1/account/to-dos") ||
          request.includes("/api/v1/account/vault")
        ) {
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response(JSON.stringify({}), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      });

    try {
      render(
        <SagittariusApp
          accessMode="account-portal"
          portalSection="trips"
          requireJoin
          dataSource="api"
          apiClient={createApiClientForTrip(seedTrip)}
        />,
      );

      expect(await screen.findByText("Portal Trip")).toBeInTheDocument();
      expect(
        screen.getByRole("navigation", { name: /Portal navigation/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("navigation", { name: /เมนูวางแผน Joii/i }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Command center")).not.toBeInTheDocument();
    } finally {
      storage.clear();
      fetchSpy.mockRestore();
    }
  });

});
