import { describe, expect, it, vi } from "vitest";
import { createTripApiClient } from "../../api-client";
import { jsonResponse } from "./api-client.test-support";

describe("Trip API client transport errors", () => {
  it("surfaces backend errors without leaking transport details into UI code", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ code: "invalid_credentials", message: "invalid credentials" }, 401));
    const client = createTripApiClient({ baseUrl: "", fetchImpl });

    await expect(client.joinTrip({ joinId: "bad", password: "wrong" })).rejects.toMatchObject({
      code: "invalid_credentials",
      message: "invalid credentials",
      status: 401,
    });
  });

  it("uses fallback error details when the backend returns a malformed error body", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response("not-json", { status: 502 }));
    const client = createTripApiClient({ fetchImpl });

    await expect(client.joinTrip({ joinId: "HK-SZ-2025", password: "seed-trip-pass" })).rejects.toMatchObject({
      code: "request_failed",
      message: "request failed with 502",
      status: 502,
    });
  });

  it("uses default fetch and fills partial backend error bodies", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ code: "forbidden" }, 403));
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchImpl as unknown as typeof fetch;
    try {
      const client = createTripApiClient();

      await expect(client.joinTrip({ joinId: "HK-SZ-2025", password: "seed-trip-pass" })).rejects.toMatchObject({
        code: "forbidden",
        message: "request failed with 403",
        status: 403,
      });

      expect(fetchImpl).toHaveBeenCalledWith(
        "/api/v1/trip-join-sessions",
        expect.objectContaining({ method: "POST" }),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("fills missing backend error codes while preserving messages", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ message: "not allowed" }, 403));
    const client = createTripApiClient({ fetchImpl });

    await expect(client.joinTrip({ joinId: "HK-SZ-2025", password: "seed-trip-pass" })).rejects.toMatchObject({
      code: "request_failed",
      message: "not allowed",
      status: 403,
    });
  });
});
