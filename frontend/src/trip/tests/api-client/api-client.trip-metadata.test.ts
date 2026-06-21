import { describe, expect, it, vi } from "vitest";
import { createTripApiClient } from "../../api-client";
import { cockpitResponse, jsonResponse } from "../../testing/api-client-test-utils";

describe("Trip API client trip metadata routes", () => {
  it("patches trip metadata through the authenticated trip route", async () => {
    const patchedTrip = {
      ...cockpitResponse.trip,
      name: "Hong Kong revised",
      destinationLabel: "Hong Kong",
      countries: ["Hong Kong"],
      version: 2,
    };
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse(patchedTrip));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });
    const request = {
      clientMutationId: "trip-patch-1",
      expectedVersion: 1,
      name: "Hong Kong revised",
      destinationLabel: "Hong Kong",
      countries: ["Hong Kong"],
    };

    await expect(client.patchTrip(cockpitResponse.trip.id, "session-token", request)).resolves.toMatchObject({
      id: patchedTrip.id,
      name: "Hong Kong revised",
      destinationLabel: "Hong Kong",
      version: 2,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}`,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify(request),
      }),
    );
  });
});
