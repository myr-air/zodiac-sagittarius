import { describe, expect, it, vi } from "vitest";
import type { AccountApiClient } from "@/src/account/api-client";
import { ACCOUNT_PROFILE_DEFAULT_AVATAR_COLOR } from "../../../model/account-profile-defaults";
import {
  finishEmailCodeLogin,
  finishEmailPasswordLogin,
  finishEmailRegistrationSetup,
  trustedDeviceForFlow,
} from "../email-login-auth-actions";

function createActionClient() {
  const session = {
    userId: "user-aom",
    sessionToken: "session-token",
    kind: "trusted" as const,
    trustedDeviceId: "device-current",
    createdAt: "2026-05-30T08:00:00.000Z",
    expiresAt: "2026-06-29T08:00:00.000Z",
  };
  return {
    session,
    client: {
      finishEmailLogin: vi.fn().mockResolvedValue(session),
      finishPasswordLogin: vi.fn().mockResolvedValue(session),
      updateSettings: vi.fn().mockResolvedValue({}),
    } as unknown as AccountApiClient,
  };
}

describe("email login auth actions", () => {
  it("keeps trusted-device selection only for login flows", () => {
    expect(trustedDeviceForFlow("login", false)).toBe(false);
    expect(trustedDeviceForFlow("login", true)).toBe(true);
    expect(trustedDeviceForFlow("register", false)).toBe(true);
  });

  it("finishes email code login with the canonical request payload", async () => {
    const { client } = createActionClient();

    await finishEmailCodeLogin({
      accountClient: client,
      activeFlow: "login",
      challenge: {
        challengeId: "challenge-id",
        expiresAt: "2026-05-30T09:00:00.000Z",
      },
      code: "123456",
      trustDevice: false,
    });

    expect(client.finishEmailLogin).toHaveBeenCalledWith({
      challengeId: "challenge-id",
      code: "123456",
      trustDevice: false,
      deviceLabel: "",
    });
  });

  it("finishes password login with normalized email and device policy", async () => {
    const { client } = createActionClient();

    await finishEmailPasswordLogin({
      accountClient: client,
      activeFlow: "login",
      normalizedEmail: "aom@example.test",
      password: "correct horse",
      trustDevice: true,
    });

    expect(client.finishPasswordLogin).toHaveBeenCalledWith({
      flow: "login",
      email: "aom@example.test",
      password: "correct horse",
      trustDevice: true,
      deviceLabel: "",
    });
  });

  it("updates registration profile after creating a password session", async () => {
    const { client, session } = createActionClient();

    await finishEmailRegistrationSetup({
      accountClient: client,
      displayName: "",
      fallbackName: "Traveler",
      locale: "th-TH",
      normalizedEmail: "aom@example.test",
      password: "correct horse",
    });

    expect(client.finishPasswordLogin).toHaveBeenCalledWith({
      flow: "register",
      email: "aom@example.test",
      password: "correct horse",
      trustDevice: true,
      deviceLabel: "",
    });
    expect(client.updateSettings).toHaveBeenCalledWith(session.sessionToken, {
      displayName: "aom",
      avatarColor: ACCOUNT_PROFILE_DEFAULT_AVATAR_COLOR,
      locale: "th-TH",
      timezone: expect.any(String),
    });
  });
});
