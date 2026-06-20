import { describe, expect, it, vi } from "vitest";
import { TripApiError } from "@/src/trip/api-client";
import { createAccountApiClient } from "./api-client";
import { jsonResponse } from "./api-client.test-support";

describe("Account API client auth routes", () => {
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

  it("runs passkey registration and login routes without a provider", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          challengeId: "passkey-challenge",
          challenge: "opaque",
          expiresAt: "2026-05-30T09:00:00.000Z",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: "passkey-id",
          nickname: "Aom MacBook",
          createdAt: "2026-05-30T08:00:00.000Z",
          lastUsedAt: null,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          challengeId: "login-challenge",
          challenge: "login-opaque",
          expiresAt: "2026-05-30T09:00:00.000Z",
          allowCredentials: [{ credentialId: "credential-id" }],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          userId: "user-aom",
          sessionToken: "passkey-session",
          kind: "temporary",
          trustedDeviceId: null,
          createdAt: "2026-05-30T08:00:00.000Z",
          expiresAt: "2026-05-31T08:00:00.000Z",
        }),
      );
    const client = createAccountApiClient({ fetchImpl });

    await expect(client.startPasskeyRegistration("account-session")).resolves.toMatchObject({
      challengeId: "passkey-challenge",
    });
    await expect(
      client.finishPasskeyRegistration("account-session", {
        challengeId: "passkey-challenge",
        credentialId: "credential-id",
        clientDataJson: "client-data",
        attestationObject: "attestation",
        nickname: "Aom MacBook",
      }),
    ).resolves.toMatchObject({ nickname: "Aom MacBook" });
    await expect(client.startPasskeyLogin("aom@example.test")).resolves.toMatchObject({
      allowCredentials: [{ credentialId: "credential-id" }],
    });
    await expect(
      client.finishPasskeyLogin({
        challengeId: "login-challenge",
        credentialId: "credential-id",
        clientDataJson: "client-data",
        authenticatorData: "authenticator-data",
        signature: "signature",
        trustDevice: false,
        deviceLabel: "",
      }),
    ).resolves.toMatchObject({ sessionToken: "passkey-session" });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "/api/v1/account/passkeys",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer account-session" }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      "/api/v1/auth/passkeys/options",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "aom@example.test" }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      4,
      "/api/v1/auth/passkeys/sessions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          challengeId: "login-challenge",
          credentialId: "credential-id",
          clientDataJson: "client-data",
          authenticatorData: "authenticator-data",
          signature: "signature",
          trustDevice: false,
          deviceLabel: "",
        }),
      }),
    );
  });

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
