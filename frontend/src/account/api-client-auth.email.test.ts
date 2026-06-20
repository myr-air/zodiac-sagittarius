import { describe, expect, it, vi } from "vitest";
import { createAccountApiClient } from "./api-client";
import { jsonResponse } from "./api-client.test-support";

describe("Account API client email auth routes", () => {
  it("starts and finishes provider-free email login through stable v1 routes", async () => {
    const loginStart = {
      challengeId: "login-challenge",
      expiresAt: "2026-05-30T09:00:00.000Z",
    };
    const accountSession = {
      userId: "user-aom",
      sessionToken: "account-session",
      kind: "trusted" as const,
      trustedDeviceId: "device-laptop",
      createdAt: "2026-05-30T08:00:00.000Z",
      expiresAt: "2026-06-29T08:00:00.000Z",
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(loginStart))
      .mockResolvedValueOnce(jsonResponse(accountSession));
    const client = createAccountApiClient({
      baseUrl: "https://api.example.test/",
      fetchImpl,
    });

    await expect(client.startEmailLogin("aom@example.test")).resolves.toEqual(loginStart);
    await expect(
      client.finishEmailLogin({
        challengeId: loginStart.challengeId,
        code: "123456",
        trustDevice: true,
        deviceLabel: "MacBook",
      }),
    ).resolves.toEqual(accountSession);

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/api/v1/auth/email/challenges",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "aom@example.test" }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/api/v1/auth/email/sessions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          challengeId: loginStart.challengeId,
          code: "123456",
          trustDevice: true,
          deviceLabel: "MacBook",
        }),
      }),
    );
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1]?.body))).not.toHaveProperty("devCode");
  });
});
