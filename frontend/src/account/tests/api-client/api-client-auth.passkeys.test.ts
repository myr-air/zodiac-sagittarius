import { describe, expect, it, vi } from "vitest";
import { createAccountApiClient } from "../../api-client";
import { jsonResponse } from "../../testing/support/api-client-test-utils";

describe("Account API client passkey auth routes", () => {
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
});
