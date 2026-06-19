import type { Dispatch, SetStateAction } from "react";
import { type TripApiClient, type TripCockpit } from "@/src/trip/api-client";
import type { AccountApiClient, AccountSession } from "@/src/account/api-client";
import type {
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { useWorkspaceAccountClaimActions } from "./use-workspace-account-claim-actions";
import { useWorkspaceMemberAdminActions } from "./use-workspace-member-admin-actions";
import { useWorkspaceTripSettingsActions } from "./use-workspace-trip-settings-actions";

interface UseWorkspaceAdministrationOptions {
  accountClient: AccountApiClient;
  accountSession: AccountSession | null;
  canManagePeople: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  currentMemberId: string;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  resolvedApiClient?: TripApiClient;
  setAccountClaimState: Dispatch<
    SetStateAction<{
      status: "idle" | "saving";
      message: string | null;
    }>
  >;
  setJoinInviteToken: Dispatch<SetStateAction<string | null>>;
  trip: Trip;
  replaceCockpitFromApi: (cockpit: TripCockpit) => void;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceAdministration({
  accountClient,
  accountSession,
  canManagePeople,
  commitTrip,
  currentMemberId,
  isApiMode,
  participantSession,
  resolvedApiClient,
  setAccountClaimState,
  setJoinInviteToken,
  trip,
  replaceCockpitFromApi,
  updateApiTrip,
}: UseWorkspaceAdministrationOptions) {
  const {
    claimCurrentMemberToAccount,
    transferOwnerToAccountMember,
  } = useWorkspaceAccountClaimActions({
    accountClient,
    accountSession,
    participantSession,
    resolvedApiClient,
    replaceCockpitFromApi,
    setAccountClaimState,
  });

  const {
    changeMemberAccessStatus,
    changeMemberPassword,
    changeMemberRole,
    createMember,
    resetMemberClaim,
    rotateJoinInviteToken,
  } = useWorkspaceMemberAdminActions({
    canManagePeople,
    commitTrip,
    currentMemberId,
    isApiMode,
    participantSession,
    resolvedApiClient,
    setJoinInviteToken,
    trip,
  });

  const saveTripSettings = useWorkspaceTripSettingsActions({
    canManagePeople,
    commitTrip,
    isApiMode,
    participantSession,
    resolvedApiClient,
    trip,
    updateApiTrip,
  });

  return {
    changeMemberAccessStatus,
    changeMemberPassword,
    changeMemberRole,
    claimCurrentMemberToAccount,
    createMember,
    rotateJoinInviteToken,
    resetMemberClaim,
    saveTripSettings,
    transferOwnerToAccountMember,
  };
}
