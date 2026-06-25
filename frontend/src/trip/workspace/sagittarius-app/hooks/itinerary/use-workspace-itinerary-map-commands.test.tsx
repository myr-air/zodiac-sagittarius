import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { buildTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { PlaceResolutionCandidate, PlaceResolutionResponse } from "@/src/trip/types";
import { useWorkspaceItineraryMapCommands } from "./use-workspace-itinerary-map-commands";

const candidate: PlaceResolutionCandidate = {
  name: "Hong Kong International Airport",
  address: "Chek Lap Kok, Hong Kong",
  coordinates: { lat: 22.308, lng: 113.9185 },
  mapLink: "https://maps.example.test/hkg",
  confidence: 0.92,
  source: "test",
  evidence: [],
};

describe("useWorkspaceItineraryMapCommands", () => {
  it("tries all transit location hints before skipping a map coordinate lookup", async () => {
    const item = buildTripFixtureItineraryItem({
      activity: "Airport transfer",
      activityType: "travel",
      coordinates: undefined,
      details: { from: "Suvarnabhumi Airport", to: "HKG" },
      place: "Hong Kong Airport",
    });
    const resolver = vi.fn(async (request): Promise<PlaceResolutionResponse> => {
      if (request.placeHint === "Hong Kong Airport") {
        return { status: "resolved", candidates: [candidate] };
      }
      return { status: "unresolved", candidates: [] };
    });
    const updateItineraryItemInline = vi.fn(async () => undefined);
    const { result } = renderHook(() =>
      useWorkspaceItineraryMapCommands({
        canEdit: true,
        effectivePlaceResolver: resolver,
        nextClientMutationId: (purpose) => `${purpose}-${resolver.mock.calls.length + 1}`,
        trip: seedTrip,
        updateItineraryItemInline,
      }),
    );

    let resolutionResult;
    await act(async () => {
      resolutionResult = await result.current.resolveMissingMapCoordinates([item]);
    });

    expect(resolutionResult).toEqual({
      attempted: 1,
      failed: 0,
      resolved: 1,
      skipped: 0,
    });
    expect(resolver.mock.calls.map(([request]) => request.placeHint)).toEqual([
      "HKG",
      "Hong Kong Airport",
    ]);
    expect(updateItineraryItemInline).toHaveBeenCalledWith(item.id, {
      address: candidate.address,
      coordinates: candidate.coordinates,
      mapLink: candidate.mapLink,
    });
  });
});
