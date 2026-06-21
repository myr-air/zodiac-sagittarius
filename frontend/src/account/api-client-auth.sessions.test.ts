import { describe, expect, it, vi } from "vitest";
import { TripApiError } from "@/src/trip/api-client";
import { createAccountApiClient } from "./api-client";
import { jsonResponse } from "./testing/support/api-client-test-utils";

describe("Account API client session auth routes", () => {
  it("revokes trusted devices, logs out, and preserves backend error details", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ code: "invalid_credentials", message: "bad code" }, 401));
    const client = createAccountApiClient({ fetchImpl });

    await expect(client.revokeTrustedDevice("account-session", "device/with space")).resolves.toBeUndefined();
    await expect(client.logout("account-session")).resolves.toBeUndefined();
    await expect(client.startEmailLogin("bad@example.test")).rejects.toMatchObject({
      code: "invalid_credentials",
      message: "bad code",
      status: 401,
    });
    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "/api/v1/account/trusted-devices/device%2Fwith%20space",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({ Authorization: "Bearer account-session" }),
      }),
    );
  });

  it("uses fallback error details when the backend returns malformed errors", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response("not-json", { status: 502 }));
    const client = createAccountApiClient({ fetchImpl });
    const request = client.loadSettings("account-session");

    await expect(request).rejects.toBeInstanceOf(TripApiError);
    await expect(request).rejects.toMatchObject({
      code: "request_failed",
      message: "request failed with 502",
      status: 502,
    });
  });
});
