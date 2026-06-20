import { describe, expect, it, vi } from "vitest";
import { createTripApiClient } from "./api-client";
import { cockpitResponse, jsonResponse } from "./api-client.test-support";

describe("Trip API import routes", () => {
  it("posts itinerary import content to the backend normalizer route", async () => {
    const document = {
      schema: "joii.itinerary.export",
      version: 1,
      source: "ai",
      exportedAt: "2026-06-04T12:00:00.000Z",
      trip: {
        id: cockpitResponse.trip.id,
        name: cockpitResponse.trip.name,
        destinationLabel: cockpitResponse.trip.destinationLabel,
        startDate: cockpitResponse.trip.startDate,
        endDate: cockpitResponse.trip.endDate,
        activePlanVariantId: cockpitResponse.trip.activePlanVariantId,
      },
      items: [],
      records: {
        expenses: [
          {
            id: "import-expense",
            tripId: cockpitResponse.trip.id,
            tripPlanId: cockpitResponse.trip.activePlanVariantId,
            title: "Imported ticket receipt",
            amount: 120,
            paidBy: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
            splits: { "018f4e81-77a4-7b8f-b3bd-0d0f493ac561": 120 },
            category: "tickets",
            itineraryItemId: "import-flight-block",
          },
        ],
        bookingDocs: [],
        stopNotes: [],
        tasks: [],
      },
    };
    const normalizedDocument = {
      ...document,
      trip: {
        ...document.trip,
        mainTripPlanId: cockpitResponse.trip.activePlanVariantId,
        planVariants: [],
        tripPlans: [],
        partySize: undefined,
        defaultTimezone: undefined,
      },
    };
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse(document));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.importItinerary(cockpitResponse.trip.id, "session-token", {
      fileName: "notes.md",
      contentType: "text/markdown",
      mode: "auto",
      content: "09:00 breakfast at Central",
    })).resolves.toEqual(normalizedDocument);

    expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/itinerary-imports`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify({
          fileName: "notes.md",
          contentType: "text/markdown",
          mode: "auto",
          content: "09:00 breakfast at Central",
        }),
      }),
    );
  });

  it("resolves place candidates through the trip-scoped place route", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({
      status: "resolved",
      candidates: [{
        name: "The Elements",
        address: "Austin Road West, Hong Kong",
        coordinates: { lat: 22.3049, lng: 114.1617 },
        mapLink: "https://www.openstreetmap.org/?mlat=22.3049000&mlon=114.1617000#map=17/22.3049000/114.1617000",
        confidence: 0.92,
        source: "nominatim",
        evidence: ["brave: The Elements"],
      }],
    }));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    expect(client.resolvePlace).toBeDefined();
    const result = await client.resolvePlace!(cockpitResponse.trip.id, "session-token", {
      clientMutationId: "resolve-web-1",
      activity: "Dim Dim Sum",
      placeHint: "ติ่มซำ แถว Elements",
      destinationLabel: "Hong Kong + Shenzhen",
      countries: ["HK"],
      day: "2026-06-19",
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/places/resolve`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify({
          clientMutationId: "resolve-web-1",
          activity: "Dim Dim Sum",
          placeHint: "ติ่มซำ แถว Elements",
          destinationLabel: "Hong Kong + Shenzhen",
          countries: ["HK"],
          day: "2026-06-19",
        }),
      }),
    );
    expect(result.status).toBe("resolved");
    expect(result.candidates[0].coordinates).toEqual({ lat: 22.3049, lng: 114.1617 });
  });
});
