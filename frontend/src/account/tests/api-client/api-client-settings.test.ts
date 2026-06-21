import { describe, expect, it, vi } from "vitest";
import { createAccountApiClient } from "../../api-client";
import { accountProfile, jsonResponse } from "../../testing/support/api-client-test-utils";

describe("Account API client settings routes", () => {
  it("loads and updates account settings with bearer auth", async () => {
    const updatedSettings = {
      profile: {
        ...accountProfile,
        displayName: "Aom Updated",
        avatarColor: "#abcdef",
        locale: "en-US",
        timezone: "Asia/Tokyo",
      },
      passkeys: [],
      trustedDevices: [],
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ profile: accountProfile, passkeys: [], trustedDevices: [] }))
      .mockResolvedValueOnce(jsonResponse(updatedSettings));
    const client = createAccountApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.loadSettings("account-session")).resolves.toMatchObject({ profile: accountProfile });
    await expect(
      client.updateSettings("account-session", {
        displayName: "Aom Updated",
        avatarColor: "#abcdef",
        locale: "en-US",
        timezone: "Asia/Tokyo",
      }),
    ).resolves.toEqual(updatedSettings);

    for (const call of fetchImpl.mock.calls) {
      expect(call[1]?.headers).toMatchObject({ Authorization: "Bearer account-session" });
    }
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/api/v1/account",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          displayName: "Aom Updated",
          avatarColor: "#abcdef",
          locale: "en-US",
          timezone: "Asia/Tokyo",
        }),
      }),
    );
  });
});
