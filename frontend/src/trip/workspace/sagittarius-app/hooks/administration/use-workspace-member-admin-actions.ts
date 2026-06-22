import { useCallback } from "react";
import {
  appendTripParticipant,
  buildCreateMemberRequest,
  createTripParticipant,
  resetTripParticipantClaim,
  replaceTripParticipant,
} from "@/src/trip/auth";
import type {
  CreateWorkspaceMemberCommand,
  UseWorkspaceMemberAdminActionsOptions,
} from "./workspace-administration-command-types";
import { useWorkspaceMemberPatchActions } from "./use-workspace-member-patch-actions";

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

  const createMember: CreateWorkspaceMemberCommand = useCallback(
    async (input) => {
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
