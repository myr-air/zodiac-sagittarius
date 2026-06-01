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
      trustedDeviceId: "device-laptop",
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

  it("loads split portal explorer, to-dos, and vault APIs with bearer auth", async () => {
    const explorer = { upcomingTrips: 1, ownedTrips: 1, destinationCount: 1, nextTrip: accountTrip };
    const todo = {
      id: "todo-1",
      tripId: "trip-id",
      tripName: "Seoul Spring",
      title: "Book train",
      status: "open",
      visibility: "shared",
      kind: "booking",
      assigneeId: null,
      relatedItemId: null,
      version: 1,
    };
    const vault = {
      id: "vault-1",
      tripId: null,
      tripName: null,
      kind: "file",
      title: "Tickets",
      detail: "PDF copy",
      externalUrl: "https://example.test/tickets.pdf",
      source: "vault",
      createdAt: "2026-05-30T08:00:00.000Z",
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(explorer))
      .mockResolvedValueOnce(jsonResponse([todo]))
      .mockResolvedValueOnce(jsonResponse([vault]))
      .mockResolvedValueOnce(jsonResponse(vault, 201));
    const client = createAccountApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.loadExplorer("account-session")).resolves.toEqual(explorer);
    await expect(client.listToDos("account-session")).resolves.toEqual([todo]);
    await expect(client.listVault("account-session")).resolves.toEqual([vault]);
    await expect(
      client.createVaultItem("account-session", {
        kind: "file",
        title: "Tickets",
        detail: "PDF copy",
        externalUrl: "https://example.test/tickets.pdf",
      }),
    ).resolves.toEqual(vault);

    expect(fetchImpl.mock.calls.map((call) => call[0])).toEqual([
      "https://api.example.test/api/v1/account/explorer",
      "https://api.example.test/api/v1/account/to-dos",
      "https://api.example.test/api/v1/account/vault",
      "https://api.example.test/api/v1/account/vault",
    ]);
    expect(fetchImpl.mock.calls[3][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({
        kind: "file",
        title: "Tickets",
        detail: "PDF copy",
        externalUrl: "https://example.test/tickets.pdf",
      }),
    });
  });

  it("creates account-owned trips, claims temp members, and transfers owner", async () => {
    const createResponse = {
      trip: {
        id: "trip-id",
        name: "Seoul Spring",
        destinationLabel: "Seoul",
        countries: ["South Korea"],
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
      countries: ["South Korea"],
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
    const memberSession = {
      tripId: "trip/with space",
      memberId: "member/aom",
      sessionToken: "account-member-session",
      createdAt: "2026-05-30T08:00:00.000Z",
      expiresAt: "2026-06-29T08:00:00.000Z",
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(createResponse, 201))
      .mockResolvedValueOnce(jsonResponse(memberSession))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse(ownerTransfer));
    const client = createAccountApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.createTrip("account-session", request)).resolves.toEqual(createResponse);
    await expect(client.createTripMemberSession("account-session", "trip/with space")).resolves.toEqual(memberSession);
    await expect(client.claimMember("account-session", "trip/with space", "member/aom", "member-session")).resolves.toBeUndefined();
    await expect(client.transferOwner("account-session", "trip/with space", "member/aom")).resolves.toEqual(ownerTransfer);

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/api/v1/account/trips",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer account-session" }),
        body: JSON.stringify(request),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/api/v1/account/trips/trip%2Fwith%20space/member-sessions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer account-session" }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      "https://api.example.test/api/v1/trips/trip%2Fwith%20space/members/member%2Faom/account-links",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer account-session" }),
        body: JSON.stringify({ memberSessionToken: "member-session" }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      4,
      "https://api.example.test/api/v1/trips/trip%2Fwith%20space/ownership-transfers",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer account-session" }),
        body: JSON.stringify({ targetMemberId: "member/aom" }),
      }),
    );
  });

  it("runs passkey registration and login routes without a provider", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ challengeId: "passkey-challenge", challenge: "opaque", expiresAt: "2026-05-30T09:00:00.000Z" }))
      .mockResolvedValueOnce(jsonResponse({ id: "passkey-id", nickname: "Aom MacBook", createdAt: "2026-05-30T08:00:00.000Z", lastUsedAt: null }))
      .mockResolvedValueOnce(jsonResponse({ challengeId: "login-challenge", challenge: "login-opaque", expiresAt: "2026-05-30T09:00:00.000Z", allowCredentials: [{ credentialId: "credential-id" }] }))
      .mockResolvedValueOnce(jsonResponse({
        userId: "user-aom",
        sessionToken: "passkey-session",
        kind: "temporary",
        trustedDeviceId: null,
        createdAt: "2026-05-30T08:00:00.000Z",
        expiresAt: "2026-05-31T08:00:00.000Z",
      }));
    const client = createAccountApiClient({ fetchImpl });

    await expect(client.startPasskeyRegistration("account-session")).resolves.toMatchObject({ challengeId: "passkey-challenge" });
    await expect(client.finishPasskeyRegistration("account-session", {
      challengeId: "passkey-challenge",
      credentialId: "credential-id",
      clientDataJson: "client-data",
      attestationObject: "attestation",
      nickname: "Aom MacBook",
    })).resolves.toMatchObject({ nickname: "Aom MacBook" });
    await expect(client.startPasskeyLogin("aom@example.test")).resolves.toMatchObject({ allowCredentials: [{ credentialId: "credential-id" }] });
    await expect(client.finishPasskeyLogin({
      challengeId: "login-challenge",
      credentialId: "credential-id",
      clientDataJson: "client-data",
      authenticatorData: "authenticator-data",
      signature: "signature",
      trustDevice: false,
      deviceLabel: "",
    })).resolves.toMatchObject({ sessionToken: "passkey-session" });

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
  countries: ["South Korea"],
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
