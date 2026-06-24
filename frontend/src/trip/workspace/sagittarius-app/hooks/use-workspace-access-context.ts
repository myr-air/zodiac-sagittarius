import type { AccountSession } from "@/src/account/api-client";
import type {
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import type { SagittariusAccessMode } from "../types";
import { deriveWorkspacePermissions } from "../workspace-permissions";
import { useWorkspaceAccessGate } from "./use-workspace-access-gate";
import { useWorkspaceMemberContext } from "./use-workspace-member-context";

interface UseWorkspaceAccessContextParams {
  accessError: string | null;
  accessMode: SagittariusAccessMode;
  accountSession: AccountSession | null;
  accountSessionLoaded: boolean;
  accountTripAccessDeniedRouteId: string | null;
  currentMemberId: string;
  dataSource: "api" | "local";
  isCockpitLoaded: boolean;
  participantSession: TripParticipantSession | null;
  requireJoin: boolean;
  routeTripId?: string;
  sessionRestored: boolean;
  trip: Trip;
}

export function useWorkspaceAccessContext({
  accessError,
  accessMode,
  accountSession,
  accountSessionLoaded,
  accountTripAccessDeniedRouteId,
  currentMemberId,
  dataSource,
  isCockpitLoaded,
  participantSession,
  requireJoin,
  routeTripId,
  sessionRestored,
  trip,
}: UseWorkspaceAccessContextParams) {
  const {
    currentMember,
    isApiMode,
    isTripLoading,
    sessionMember,
  } = useWorkspaceMemberContext({
    currentMemberId,
    dataSource,
    isCockpitLoaded,
    participantSession,
    trip,
  });
  const permissions = deriveWorkspacePermissions(currentMember.role);
  const accessGate = useWorkspaceAccessGate({
    accessMode,
    accountSession,
    accountSessionLoaded,
    accountTripAccessDeniedRouteId,
    accessError,
    isApiMode,
    isTripLoading,
    participantSession,
    routeTripId,
    requireJoin,
    sessionMember: Boolean(sessionMember),
    sessionRestored,
  });

  return {
    ...accessGate,
    ...permissions,
    currentMember,
    isApiMode,
    isTripLoading,
    sessionMember,
  };
}
