import { findSessionMember } from "@/src/trip/auth";
import { isLocalParticipantSession } from "@/src/trip/auth";
import { findMemberById } from "@/src/trip/members";
import type {
  Member,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";

interface UseWorkspaceMemberContextOptions {
  currentMemberId: string;
  dataSource: "api" | "local";
  isCockpitLoaded: boolean;
  participantSession: TripParticipantSession | null;
  trip: Trip;
}

interface WorkspaceMemberContext {
  currentMember: Member;
  isApiMode: boolean;
  isTripLoading: boolean;
  sessionMember: Member | null;
}

export function useWorkspaceMemberContext({
  currentMemberId,
  dataSource,
  isCockpitLoaded,
  participantSession,
  trip,
}: UseWorkspaceMemberContextOptions): WorkspaceMemberContext {
  const sessionMember = findSessionMember(trip, participantSession);
  const currentMember =
    sessionMember ??
    findMemberById(trip.members, currentMemberId) ??
    trip.members[0];
  const isApiMode =
    dataSource === "api" && !isLocalParticipantSession(participantSession);
  const isTripLoading =
    isApiMode && Boolean(participantSession) && !isCockpitLoaded;

  return {
    currentMember,
    isApiMode,
    isTripLoading,
    sessionMember,
  };
}
