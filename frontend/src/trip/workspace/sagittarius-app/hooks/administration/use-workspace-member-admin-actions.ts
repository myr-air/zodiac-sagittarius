import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  appendTripParticipant,
  buildCreateMemberRequest,
  createTripParticipant,
  resetTripParticipantClaim,
  replaceTripParticipant,
} from "@/src/trip/auth";
import type {
  Trip,
  TripParticipantSession,
  TripRole,
} from "@/src/trip/types";
import { useWorkspaceMemberPatchActions } from "./use-workspace-member-patch-actions";

interface UseWorkspaceMemberAdminActionsOptions {
  canManagePeople: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  currentMemberId: string;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  resolvedApiClient?: TripApiClient;
  setJoinInviteToken: Dispatch<SetStateAction<string | null>>;
  trip: Trip;
}

export function useWorkspaceMemberAdminActions({
  canManagePeople,
  commitTrip,
  currentMemberId,
  isApiMode,
  participantSession,
  resolvedApiClient,
  setJoinInviteToken,
  trip,
}: UseWorkspaceMemberAdminActionsOptions) {
  const {
    changeMemberAccessStatus,
    changeMemberPassword,
    changeMemberRole,
  } = useWorkspaceMemberPatchActions({
    canManagePeople,
    commitTrip,
    currentMemberId,
    isApiMode,
    participantSession,
    resolvedApiClient,
    trip,
  });

  const resetMemberClaim = useCallback(async (memberId: string) => {
    if (!canManagePeople) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const member = await resolvedApiClient.resetMemberClaim(
        trip.id,
        memberId,
        participantSession.sessionToken,
      );
      commitTrip((current) => replaceTripParticipant(current, member));
      return;
    }
    commitTrip((current) => resetTripParticipantClaim(current, memberId));
  }, [
    canManagePeople,
    commitTrip,
    isApiMode,
    participantSession,
    resolvedApiClient,
    trip,
  ]);

  const createMember = useCallback(
    async (input: {
      displayName: string;
      role: Exclude<TripRole, "owner">;
    }) => {
      /* v8 ignore next */
      if (!canManagePeople) return;
      if (isApiMode && resolvedApiClient && participantSession) {
        const member = await resolvedApiClient.createMember(
          trip.id,
          participantSession.sessionToken,
          buildCreateMemberRequest(input, { memberCount: trip.members.length }),
        );
        commitTrip((current) => appendTripParticipant(current, member));
        return;
      }
      commitTrip((current) => createTripParticipant(current, input));
    },
    [
      canManagePeople,
      commitTrip,
      isApiMode,
      participantSession,
      resolvedApiClient,
      trip,
    ],
  );

  const rotateJoinInviteToken = useCallback(async () => {
    if (
      !canManagePeople ||
      !isApiMode ||
      !resolvedApiClient ||
      !participantSession?.sessionToken
    )
      return;
    const response = await resolvedApiClient.rotateJoinInviteToken?.(
      trip.id,
      participantSession.sessionToken,
    );
    if (!response) return;
    setJoinInviteToken(response.token);
  }, [
    canManagePeople,
    isApiMode,
    participantSession,
    resolvedApiClient,
    setJoinInviteToken,
    trip,
  ]);

  return {
    changeMemberAccessStatus,
    changeMemberPassword,
    changeMemberRole,
    createMember,
    resetMemberClaim,
    rotateJoinInviteToken,
  };
}
