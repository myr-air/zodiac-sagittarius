import { describe, expect, it, vi } from "vitest";
import { createAccountApiClient } from "./api-client";
import {
  accountTripCreateRequest,
  accountTripCreateResponse,
  jsonResponse,
} from "./testing/support/api-client-test-utils";

describe("Account API client trip management routes", () => {
  it("creates account-owned trips, claims temp members, and transfers owner", async () => {
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
      .mockResolvedValueOnce(jsonResponse(accountTripCreateResponse, 201))
      .mockResolvedValueOnce(jsonResponse(memberSession))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse(ownerTransfer));
    const client = createAccountApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.createTrip("account-session", accountTripCreateRequest)).resolves.toEqual(accountTripCreateResponse);
    await expect(client.createTripMemberSession("account-session", "trip/with space")).resolves.toEqual(memberSession);
    await expect(client.claimMember("account-session", "trip/with space", "member/aom", "member-session")).resolves.toBeUndefined();
    await expect(client.transferOwner("account-session", "trip/with space", "member/aom")).resolves.toEqual(ownerTransfer);

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/api/v1/account/trips",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer account-session" }),
        body: JSON.stringify(accountTripCreateRequest),
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
});
