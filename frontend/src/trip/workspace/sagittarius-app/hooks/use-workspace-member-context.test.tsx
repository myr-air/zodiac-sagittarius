import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useWorkspaceMemberContext } from "./use-workspace-member-context";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { Trip, TripParticipantSession } from "@/src/trip/types";

const trip: Trip = {
  ...tripFixture.trip,
  members: [
    {
      ...tripFixture.trip.members[0],
      id: "member-owner",
      displayName: "Owner",
      role: "owner",
    },
    {
      ...tripFixture.trip.members[1],
      id: "member-planner",
      displayName: "Planner",
      role: "organizer",
    },
  ],
};

function participantSession(
  memberId: string,
  sessionToken = "api-session-token",
): TripParticipantSession {
  return {
    tripId: trip.id,
    memberId,
    sessionToken,
    createdAt: "2026-06-01T00:00:00.000Z",
    expiresAt: "2027-01-02T00:00:00.000Z",
  };
}

describe("useWorkspaceMemberContext", () => {
  it("prefers the authenticated session member over role preview selection", () => {
    const { result } = renderHook(() =>
      useWorkspaceMemberContext({
        currentMemberId: "member-owner",
        dataSource: "api",
        isCockpitLoaded: true,
        participantSession: participantSession("member-planner"),
        trip,
      }),
    );

    expect(result.current.sessionMember?.id).toBe("member-planner");
    expect(result.current.currentMember.id).toBe("member-planner");
    expect(result.current.isApiMode).toBe(true);
    expect(result.current.isTripLoading).toBe(false);
  });

  it("falls back to selected preview member and then first trip member", () => {
    const selectedMember = renderHook(() =>
      useWorkspaceMemberContext({
        currentMemberId: "member-planner",
        dataSource: "local",
        isCockpitLoaded: false,
        participantSession: null,
        trip,
      }),
    );
    const defaultMember = renderHook(() =>
      useWorkspaceMemberContext({
        currentMemberId: "missing-member",
        dataSource: "local",
        isCockpitLoaded: false,
        participantSession: null,
        trip,
      }),
    );

    expect(selectedMember.result.current.currentMember.id).toBe("member-planner");
    expect(defaultMember.result.current.currentMember.id).toBe("member-owner");
    expect(selectedMember.result.current.isApiMode).toBe(false);
  });

  it("treats local participant sessions as non-api mode", () => {
    const { result } = renderHook(() =>
      useWorkspaceMemberContext({
        currentMemberId: "member-owner",
        dataSource: "api",
        isCockpitLoaded: false,
        participantSession: participantSession("member-owner", "local-member-owner"),
        trip,
      }),
    );

    expect(result.current.currentMember.id).toBe("member-owner");
    expect(result.current.isApiMode).toBe(false);
    expect(result.current.isTripLoading).toBe(false);
  });

  it("reports loading while an API participant session waits for cockpit data", () => {
    const { result } = renderHook(() =>
      useWorkspaceMemberContext({
        currentMemberId: "member-owner",
        dataSource: "api",
        isCockpitLoaded: false,
        participantSession: participantSession("member-owner"),
        trip,
      }),
    );

    expect(result.current.isApiMode).toBe(true);
    expect(result.current.isTripLoading).toBe(true);
  });
});
