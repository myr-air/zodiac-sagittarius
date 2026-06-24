import { vi } from "vitest";
import { accountApiRoutes } from "@/src/account/api-routes";
import type {
  AccountExplorerSummary,
  AccountTripStats,
  AccountTripSummary,
} from "@/src/account/api-client";
import { jsonResponse } from "@/src/testing/json-response";
import type { TripParticipantSession } from "@/src/trip/types";

export function mockAccountPortalApiFetch({
  trips = [],
  tripStats = {
    tripsTotal: trips.length,
    tripsOwned: trips.filter((trip) => trip.isOwner).length,
    activeTrips: trips.length,
    tempClaimsCompleted: 0,
  },
  explorer = {
    upcomingTrips: trips.length,
    ownedTrips: trips.filter((trip) => trip.isOwner).length,
    destinationCount: trips.length ? 1 : 0,
    nextTrip: null,
  },
}: {
  trips?: AccountTripSummary[];
  tripStats?: AccountTripStats;
  explorer?: AccountExplorerSummary;
} = {}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const request = input instanceof Request ? input.url : String(input);

    if (
      request.includes("/api/v1/account") &&
      !request.includes("/api/v1/account/trips") &&
      !request.includes("/api/v1/account/trip-stats")
    ) {
      return jsonResponse({
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
      });
    }

    if (request.includes("/api/v1/account/trips")) {
      return jsonResponse(trips);
    }

    if (request.includes("/api/v1/account/trip-stats")) {
      return jsonResponse(tripStats);
    }

    if (request.includes("/api/v1/account/explorer")) {
      return jsonResponse(explorer);
    }

    if (
      request.includes("/api/v1/account/to-dos") ||
      request.includes("/api/v1/account/vault")
    ) {
      return jsonResponse([]);
    }

    return jsonResponse({}, 404);
  });
}

export function mockAccountTripMemberSessionFetch({
  tripId,
  memberSession,
  fallbackBody = [],
  fallbackStatus = 200,
}: {
  tripId: string;
  memberSession: TripParticipantSession;
  fallbackBody?: unknown;
  fallbackStatus?: number;
}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const request = input instanceof Request ? input.url : String(input);

    if (request.includes(accountApiRoutes.accountTripMemberSessions(tripId))) {
      return jsonResponse(memberSession);
    }

    return jsonResponse(fallbackBody, fallbackStatus);
  });
}

export function mockRejectedAccountTripMemberSessionFetch(
  tripId: string,
  error: Error,
) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const request = input instanceof Request ? input.url : String(input);

    if (request.includes(accountApiRoutes.accountTripMemberSessions(tripId))) {
      throw error;
    }

    return jsonResponse({}, 404);
  });
}
