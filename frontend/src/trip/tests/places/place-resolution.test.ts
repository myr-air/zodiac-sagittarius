import { describe, expect, it, vi } from "vitest";
import {
  buildMapPlaceResolutionRequest,
  buildMapLink,
  locationFieldsFromCandidate,
  mapResolutionActivity,
  mapResolutionPlaceHint,
  readItineraryDetailString,
  resolveStopPlace,
} from "@/src/trip/places";
import { seedTrip } from "@/src/trip/seed";
import { buildTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { PlaceResolutionCandidate } from "@/src/trip/types";

const candidate: PlaceResolutionCandidate = {
  name: "M+ Museum",
  address: "West Kowloon Cultural District",
  coordinates: { lat: 22.3027, lng: 114.1599 },
  mapLink: "https://maps.example.com/mplus",
  confidence: 0.93,
  source: "test",
  evidence: ["name"],
};

describe("place resolution helpers", () => {
  it("builds map links and reads itinerary detail strings", () => {
    expect(buildMapLink("M+ Museum Hong Kong")).toBe(
      "https://maps.google.com/?q=M%2B%20Museum%20Hong%20Kong",
    );
    expect(buildMapLink("")).toBe("");
    expect(readItineraryDetailString({ mode: " flight ", count: 2 }, "mode"))
      .toBe("flight");
    expect(readItineraryDetailString({ count: 2 }, "count")).toBe("");
  });

  it("derives map resolution activity and place hints for travel rows", () => {
    const item = buildTripFixtureItineraryItem({
      activity: "Airport transfer",
      activityType: "travel",
      place: "Hong Kong Airport",
      details: { from: "BKK", to: "HKG" },
    });

    expect(mapResolutionPlaceHint(item)).toBe("HKG");
    expect(mapResolutionActivity(item)).toBe("Airport transfer from BKK to HKG");
  });

  it("builds map place resolution requests for itinerary rows", () => {
    const item = buildTripFixtureItineraryItem({
      activity: "Airport transfer",
      activityType: "travel",
      day: "2026-06-18",
      place: "Hong Kong Airport",
      details: { from: "BKK", to: "HKG" },
    });

    expect(
      buildMapPlaceResolutionRequest(item, seedTrip, {
        clientMutationId: "mutation-map-place-resolve",
        placeHint: "HKG",
      }),
    ).toEqual({
      clientMutationId: "mutation-map-place-resolve",
      activity: "Airport transfer from BKK to HKG",
      placeHint: "HKG",
      destinationLabel: seedTrip.destinationLabel,
      countries: Array.from(
        new Set(
          [seedTrip.originCountryCode, ...(seedTrip.countries ?? [])].filter(
            (country): country is string => Boolean(country),
          ),
        ),
      ),
      day: "2026-06-18",
    });
  });

  it("uses explicit map links or candidate fields for location updates", () => {
    expect(
      locationFieldsFromCandidate(candidate, "M+ Museum", "https://maps.example.com/custom"),
    ).toEqual({
      address: candidate.address,
      coordinates: candidate.coordinates,
      mapLink: "https://maps.example.com/custom",
    });
    expect(locationFieldsFromCandidate(null, "M+ Museum")).toEqual({
      address: "M+ Museum",
      coordinates: undefined,
      mapLink: "https://maps.google.com/?q=M%2B%20Museum",
    });
  });

  it("resolves stop places through the injected resolver", async () => {
    const nextClientMutationId = vi.fn((prefix: string) => `${prefix}-1`);
    const resolver = vi.fn(async () => ({
      status: "resolved" as const,
      candidates: [candidate],
    }));

    await expect(
      resolveStopPlace(
        {
          activity: "Museum visit",
          day: seedTrip.startDate,
          place: "M+ Museum",
        },
        seedTrip,
        resolver,
        nextClientMutationId,
      ),
    ).resolves.toEqual({ candidate, state: null });
    expect(resolver).toHaveBeenCalledWith(
      expect.objectContaining({
        clientMutationId: "place-resolve-1",
        activity: "Museum visit",
        placeHint: "M+ Museum",
        destinationLabel: seedTrip.destinationLabel,
        countries: seedTrip.countries,
      }),
    );
  });

  it("returns UI resolution states for ambiguous, unresolved, and failed responses", async () => {
    const nextClientMutationId = (prefix: string) => `${prefix}-1`;

    await expect(
      resolveStopPlace(
        { activity: "Museum visit", day: seedTrip.startDate, place: "M+ Museum" },
        seedTrip,
        async () => ({ status: "ambiguous", candidates: [candidate] }),
        nextClientMutationId,
      ),
    ).resolves.toEqual({
      candidate: null,
      state: { state: "ambiguous", candidates: [candidate] },
    });
    await expect(
      resolveStopPlace(
        { activity: "Museum visit", day: seedTrip.startDate, place: "M+ Museum" },
        seedTrip,
        async () => ({ status: "unresolved", candidates: [] }),
        nextClientMutationId,
      ),
    ).resolves.toEqual({
      candidate: null,
      state: { state: "unresolved", candidates: [] },
    });
    await expect(
      resolveStopPlace(
        { activity: "Museum visit", day: seedTrip.startDate, place: "M+ Museum" },
        seedTrip,
        async () => {
          throw new Error("resolver down");
        },
        nextClientMutationId,
      ),
    ).resolves.toEqual({
      candidate: null,
      state: { state: "unresolved", candidates: [] },
    });
  });
});
