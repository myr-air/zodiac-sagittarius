import { useCallback } from "react";
import {
  buildPatchMemberAccessStatusRequest,
  buildPatchMemberPasswordRequest,
  buildPatchMemberRoleRequest,
  replaceTripParticipant,
  setTripParticipantAccessStatus,
  setTripParticipantPassword,
  updateTripParticipantRole,
} from "@/src/trip/auth";
import type {
  TripMemberAccessStatus,
  TripRole,
} from "@/src/trip/types";
import type { UseWorkspaceMemberPatchActionsOptions } from "./workspace-administration-command-types";

export function useWorkspaceMemberPatchActions({
  canManagePeople,
  commitTrip,
  currentMemberId,
  isApiMode,
  participantSession,
  resolvedApiClient,
  trip,
}: UseWorkspaceMemberPatchActionsOptions) {
  const changeMemberRole = useCallback(
    async (memberId: string, role: Exclude<TripRole, "owner">) => {
      /* v8 ignore next */
      if (!canManagePeople) return;
      if (isApiMode && resolvedApiClient && participantSession) {
        const member = await resolvedApiClient.patchMember(
          trip.id,
          memberId,
          participantSession.sessionToken,
          buildPatchMemberRoleRequest(role),
        );
        commitTrip((current) => replaceTripParticipant(current, member));
        return;
      }
      commitTrip((current) => updateTripParticipantRole(current, memberId, role));
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

  const changeMemberAccessStatus = useCallback(
    async (memberId: string, accessStatus: TripMemberAccessStatus) => {
      /* v8 ignore next */
      if (!canManagePeople) return;
      if (isApiMode && resolvedApiClient && participantSession) {
        const member = await resolvedApiClient.patchMember(
          trip.id,
          memberId,
          participantSession.sessionToken,
          buildPatchMemberAccessStatusRequest(accessStatus),
        );
        commitTrip((current) => replaceTripParticipant(current, member));
        return;
      }
      commitTrip((current) =>
        setTripParticipantAccessStatus(current, memberId, accessStatus),
      );
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

  const changeMemberPassword = useCallback(
    async (memberId: string, password: string) => {
      /* v8 ignore next */
      if (!canManagePeople || memberId !== currentMemberId) return;
      if (isApiMode && resolvedApiClient && participantSession) {
        const member = await resolvedApiClient.patchMember(
          trip.id,
          memberId,
          participantSession.sessionToken,
          buildPatchMemberPasswordRequest(password),
        );
        commitTrip((current) => replaceTripParticipant(current, member));
        return;
      }
      commitTrip((current) =>
        setTripParticipantPassword(current, memberId, password),
      );
    },
    [
      canManagePeople,
      commitTrip,
      currentMemberId,
      isApiMode,
      participantSession,
      resolvedApiClient,
      trip,
    ],
  );

  return {
    changeMemberAccessStatus,
    changeMemberPassword,
    changeMemberRole,
  };
}
