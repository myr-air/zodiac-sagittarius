import type { UseWorkspaceAdministrationOptions } from "./administration/workspace-administration-command-types";
import { useWorkspaceAccountClaimActions } from "./administration/use-workspace-account-claim-actions";
import { useWorkspaceMemberAdminActions } from "./administration/use-workspace-member-admin-actions";
import { useWorkspaceTripSettingsActions } from "./administration/use-workspace-trip-settings-actions";

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
