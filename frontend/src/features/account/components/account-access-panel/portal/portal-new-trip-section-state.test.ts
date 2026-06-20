import { describe, expect, it, vi } from "vitest";
import type { AccountTripCreateResponse } from "@/src/account/api-client";
import type { TripApiClient } from "@/src/trip/api-client";
import type { TripParticipantSession } from "@/src/trip/types";
import {
  buildPortalCreatedTripShare,
  resolvePortalCreatedTripInviteToken,
} from "./portal-new-trip-section-state";

const memberSession = {
  memberId: "member-1",
  sessionToken: "trip-session",
  tripId: "trip-1",
} as TripParticipantSession;

const response = {
  memberSession,
  ownerMemberId: "member-1",
  trip: {
    id: "trip-1",
    joinId: "0626-TYO-ABC",
    name: "Tokyo Spring",
  },
} as AccountTripCreateResponse;

describe("portal new trip section state", () => {
  it("builds a created trip share payload with the rotated invite token", () => {
    expect(buildPortalCreatedTripShare(response, "invite-token")).toEqual({
      inviteLink: "http://localhost/join?token=invite-token",
      joinId: "0626-TYO-ABC",
      name: "Tokyo Spring",
    });
  });

  it("builds a created trip share payload without an invite token fallback", () => {
    expect(buildPortalCreatedTripShare(response, null)).toEqual({
      inviteLink: "http://localhost/join/0626-TYO-ABC",
      joinId: "0626-TYO-ABC",
      name: "Tokyo Spring",
    });
  });

  it("resolves a rotated invite token when the trip API supports it", async () => {
    const apiClient = {
      rotateJoinInviteToken: vi.fn().mockResolvedValue({ token: "invite-token" }),
    } as unknown as TripApiClient;

    await expect(resolvePortalCreatedTripInviteToken(apiClient, response)).resolves.toBe("invite-token");
    expect(apiClient.rotateJoinInviteToken).toHaveBeenCalledWith("trip-1", "trip-session");
  });

  it("returns null when invite rotation is unavailable or fails", async () => {
    await expect(resolvePortalCreatedTripInviteToken(undefined, response)).resolves.toBeNull();

    const apiClient = {
      rotateJoinInviteToken: vi.fn().mockRejectedValue(new Error("invite failed")),
    } as unknown as TripApiClient;

    await expect(resolvePortalCreatedTripInviteToken(apiClient, response)).resolves.toBeNull();
  });
});
