import { describe, expect, it, vi } from "vitest";
import { TripApiError } from "@/src/trip/api-client";
import { createAccountApiClient } from "./api-client";

describe("Account API client", () => {
  it("starts and finishes provider-free email login through stable v1 routes", async () => {
    const loginStart = { challengeId: "login-challenge", expiresAt: "2026-05-30T09:00:00.000Z" };
    const accountSession = {
      userId: "user-aom",
      sessionToken: "account-session",
      kind: "trusted" as const,
      createdAt: "2026-05-30T08:00:00.000Z",
      expiresAt: "2026-06-29T08:00:00.000Z",
    };
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse(loginStart)).mockResolvedValueOnce(jsonResponse(accountSession));
    const client = createAccountApiClient({ baseUrl: "https://api.example.test/", fetchImpl });

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
      "https://api.example.test/v1/account/email-login/start",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "aom@example.test" }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/v1/account/email-login/finish",
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
      "https://api.example.test/v1/account/settings",
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

  it("loads trip history and stats with bearer auth", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([accountTrip]))
      .mockResolvedValueOnce(jsonResponse({ tripsTotal: 1, tripsOwned: 1, activeTrips: 1, tempClaimsCompleted: 0 }));
    const client = createAccountApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.listTrips("account-session")).resolves.toEqual([accountTrip]);
    await expect(client.loadStats("account-session")).resolves.toMatchObject({ tripsOwned: 1 });

    for (const call of fetchImpl.mock.calls) {
      expect(call[1]?.headers).toMatchObject({ Authorization: "Bearer account-session" });
    }
  });

  it("creates account-owned trips, claims temp members, and transfers owner", async () => {
    const createResponse = {
      trip: {
        id: "trip-id",
        name: "Seoul Spring",
        destinationLabel: "Seoul",
        startDate: "2026-06-01",
        endDate: "2026-06-05",
        joinId: "SEOUL-2026",
        activePlanVariantId: "plan-main",
        ownerMemberId: "member-owner",
        version: 1,
      },
      ownerMemberId: "member-owner",
      memberSession: {
        tripId: "trip-id",
        memberId: "member-owner",
        sessionToken: "member-session",
        createdAt: "2026-05-30T08:00:00.000Z",
        expiresAt: "2026-06-29T08:00:00.000Z",
      },
    };
    const request = {
      name: "Seoul Spring",
      destinationLabel: "Seoul",
      startDate: "2026-06-01",
      endDate: "2026-06-05",
      ownerDisplayName: "Aom",
      joinId: "SEOUL-2026",
      joinPassword: "spring-password",
    };
    const ownerTransfer = {
      tripId: "trip/with space",
      previousOwnerMemberId: "member-owner",
      newOwnerMemberId: "member/aom",
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(createResponse, 201))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse(ownerTransfer));
    const client = createAccountApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.createTrip("account-session", request)).resolves.toEqual(createResponse);
    await expect(client.claimMember("account-session", "trip/with space", "member/aom", "member-session")).resolves.toBeUndefined();
    await expect(client.transferOwner("account-session", "trip/with space", "member/aom")).resolves.toEqual(ownerTransfer);

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/v1/account/trips",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer account-session" }),
        body: JSON.stringify(request),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/v1/account/trips/trip%2Fwith%20space/members/member%2Faom/claim",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer account-session" }),
        body: JSON.stringify({ memberSessionToken: "member-session" }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      "https://api.example.test/v1/account/trips/trip%2Fwith%20space/owner-transfer",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer account-session" }),
        body: JSON.stringify({ targetMemberId: "member/aom" }),
      }),
    );
  });

  it("starts passkey registration, revokes trusted devices, logs out, and preserves backend error details", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ challengeId: "passkey-challenge", challenge: "opaque", expiresAt: "2026-05-30T09:00:00.000Z" }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ code: "invalid_credentials", message: "bad code" }, 401));
    const client = createAccountApiClient({ fetchImpl });

    await expect(client.startPasskeyRegistration("account-session")).resolves.toMatchObject({ challengeId: "passkey-challenge" });
    await expect(client.revokeTrustedDevice("account-session", "device/with space")).resolves.toBeUndefined();
    await expect(client.logout("account-session")).resolves.toBeUndefined();
    await expect(client.startEmailLogin("bad@example.test")).rejects.toMatchObject({
      code: "invalid_credentials",
      message: "bad code",
      status: 401,
    });
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "/v1/account/trusted-devices/device%2Fwith%20space",
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

const accountProfile = {
  id: "user-aom",
  displayName: "Aom",
  avatarColor: "#0f766e",
  locale: "th-TH",
  timezone: "Asia/Bangkok",
  primaryEmail: "aom@example.test",
};

const accountTrip = {
  id: "trip-id",
  name: "Seoul Spring",
  destinationLabel: "Seoul",
  startDate: "2026-06-01",
  endDate: "2026-06-05",
  role: "owner" as const,
  memberId: "member-owner",
  ownerMemberId: "member-owner",
  joinedAt: "2026-05-30T08:00:00.000Z",
  isOwner: true,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
