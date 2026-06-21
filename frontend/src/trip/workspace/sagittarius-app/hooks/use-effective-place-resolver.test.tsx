import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEffectivePlaceResolver } from "./use-effective-place-resolver";
import type { PlaceResolver } from "@/src/trip/places";
import type { TripApiClient } from "@/src/trip/api-client";
import type {
  PlaceResolutionRequest,
  PlaceResolutionResponse,
  TripParticipantSession,
} from "@/src/trip/types";

const participantSession: TripParticipantSession = {
  tripId: "trip-hk",
  memberId: "member-aom",
  sessionToken: "api-session-token",
  createdAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2026-01-02T00:00:00.000Z",
};

const request: PlaceResolutionRequest = {
  clientMutationId: "place-1",
  activity: "Dim sum",
  placeHint: "Central",
  destinationLabel: "Hong Kong",
  countries: ["HK"],
  day: "2026-01-10",
};

const response: PlaceResolutionResponse = {
  status: "unresolved",
  candidates: [],
};

describe("useEffectivePlaceResolver", () => {
  it("prefers an explicit resolver over API session wiring", async () => {
    const explicitResolver = vi.fn<PlaceResolver>(async () => response);
    const apiResolvePlace = vi.fn<NonNullable<TripApiClient["resolvePlace"]>>();

    const { result } = renderHook(() =>
      useEffectivePlaceResolver({
        apiClient: { resolvePlace: apiResolvePlace },
        participantSession,
        placeResolver: explicitResolver,
        tripId: "trip-hk",
      }),
    );

    await expect(result.current?.(request)).resolves.toBe(response);
    expect(explicitResolver).toHaveBeenCalledWith(request);
    expect(apiResolvePlace).not.toHaveBeenCalled();
  });

  it("wraps the API place resolver with trip and participant session context", async () => {
    const apiResolvePlace = vi.fn<NonNullable<TripApiClient["resolvePlace"]>>(
      async () => response,
    );

    const { result } = renderHook(() =>
      useEffectivePlaceResolver({
        apiClient: { resolvePlace: apiResolvePlace },
        participantSession,
        tripId: "trip-hk",
      }),
    );

    await expect(result.current?.(request)).resolves.toBe(response);
    expect(apiResolvePlace).toHaveBeenCalledWith(
      "trip-hk",
      "api-session-token",
      request,
    );
  });

  it("stays disabled until API place resolution has a participant session", () => {
    const apiResolvePlace = vi.fn<NonNullable<TripApiClient["resolvePlace"]>>();

    const { result } = renderHook(() =>
      useEffectivePlaceResolver({
        apiClient: { resolvePlace: apiResolvePlace },
        participantSession: null,
        tripId: "trip-hk",
      }),
    );

    expect(result.current).toBeNull();
  });
});
