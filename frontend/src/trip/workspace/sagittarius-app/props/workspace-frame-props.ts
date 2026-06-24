import type { WorkspaceAppFrameProps } from "../WorkspaceAppFrame";
import { buildWorkspaceAccessProps, type BuildWorkspaceAccessPropsInput } from "./workspace-access-props";
import { buildWorkspaceFrameActionProps, type BuildWorkspaceFrameActionPropsInput } from "./workspace-frame-action-props";
import { buildWorkspaceShellProps, type BuildWorkspaceShellPropsInput } from "./workspace-shell-props";
import { buildWorkspaceViewsProps } from "./workspace-view-props";
import type { BuildWorkspaceViewsPropsInput } from "./workspace-view-props.types";

type WorkspaceFrameProps = WorkspaceAppFrameProps;
type ActionInput = BuildWorkspaceFrameActionPropsInput;
type AccessInput = BuildWorkspaceAccessPropsInput;
type ViewsInput = BuildWorkspaceViewsPropsInput;
type ShellInput = BuildWorkspaceShellPropsInput;

export type BuildWorkspaceFramePropsInput = ActionInput &
  Omit<
    ViewsInput,
    | "onAddNoteForItem"
    | "onCreateBookingDoc"
    | "onResolveMissingCoordinates"
    | "onRotateJoinInviteToken"
    | "onSaveDayTitle"
    | "onTransferOwnership"
  > &
  Omit<
    AccessInput,
    | "apiClient"
    | "initialError"
    | "onAuthenticated"
    | "onTripChange"
    | "sessionMember"
  > &
  Omit<
    ShellInput,
    | "canClaimMember"
    | "editSelectedItem"
    | "onClaimMember"
    | "onLeaveParticipantSession"
    | "viewsProps"
  > & {
    accessError: AccessInput["initialError"];
    authenticateParticipant: AccessInput["onAuthenticated"];
    replaceTripFromJoin: AccessInput["onTripChange"];
    resolvedApiClient: AccessInput["apiClient"] & ActionInput["resolvedApiClient"];
  };

export function buildWorkspaceFrameProps({
  accountSession,
  accessError,
  authenticateParticipant,
  canEdit,
  claimCurrentMemberToAccount,
  createBookingDoc,
  createItineraryNote,
  currentMember,
  effectivePlaceResolver,
  editItem,
  isApiMode,
  leaveParticipantSession,
  participantSession,
  replaceTripFromJoin,
  requireJoin,
  resolvedApiClient,
  resolveMissingMapCoordinates,
  rotateJoinInviteToken,
  saveDailyBriefingOverrides,
  selectedItem,
  transferOwnerToAccountMember,
  ...input
}: BuildWorkspaceFramePropsInput): WorkspaceFrameProps {
  const frameActionProps = buildWorkspaceFrameActionProps({
    accountSession,
    canEdit,
    claimCurrentMemberToAccount,
    createBookingDoc,
    createItineraryNote,
    currentMember,
    effectivePlaceResolver,
    editItem,
    isApiMode,
    leaveParticipantSession,
    participantSession,
    requireJoin,
    resolvedApiClient,
    resolveMissingMapCoordinates,
    rotateJoinInviteToken,
    saveDailyBriefingOverrides,
    selectedItem,
    transferOwnerToAccountMember,
  });
  const viewsProps = buildWorkspaceViewsProps({
    ...input,
    canEdit,
    currentMember,
    onAddNoteForItem: frameActionProps.onAddNoteForItem,
    onCreateBookingDoc: frameActionProps.onCreateBookingDoc,
    onResolveMissingCoordinates: frameActionProps.onResolveMissingCoordinates,
    onRotateJoinInviteToken: frameActionProps.onRotateJoinInviteToken,
    onSaveDayTitle: frameActionProps.onSaveDayTitle,
    onTransferOwnership: frameActionProps.onTransferOwnership,
  });
  return {
    accessProps: buildWorkspaceAccessProps({
      ...input,
      accountSession,
      apiClient: resolvedApiClient,
      initialError: accessError,
      requireJoin,
      sessionMember: Boolean(input.sessionMember),
      trip: input.trip,
      onAuthenticated: authenticateParticipant,
      onCockpitLoaded: input.onCockpitLoaded,
      onTripChange: replaceTripFromJoin,
    }),
    shellProps: buildWorkspaceShellProps({
      ...input,
      accountSession,
      canClaimMember: frameActionProps.canClaimMember,
      canEdit,
      currentMember,
      editSelectedItem: frameActionProps.editSelectedItem,
      onClaimMember: frameActionProps.onClaimMember,
      onLeaveParticipantSession: frameActionProps.onLeaveParticipantSession,
      requireJoin,
      selectedItem,
      trip: input.trip,
      viewsProps,
    }),
  };
}
