import type { AccountSession } from "@/src/account/api-client";
import type { PlaceResolver } from "@/src/trip/places";
import type { TripApiClient } from "@/src/trip/api-client";
import type { TripParticipantSession } from "@/src/trip/types";
import type { WorkspaceViewsProps } from "./workspace-view-props.types";

type BookingDocCreateInput = Parameters<
  WorkspaceViewsProps["bookingsProps"]["onCreateBookingDoc"]
>[0];
type CurrentMember = WorkspaceViewsProps["settingsProps"]["currentMember"];
type ItineraryItemRef = { id: string } | null | undefined;
type SaveDailyBriefingOverrides = NonNullable<
  WorkspaceViewsProps["overviewProps"]["onSaveDailyBriefingOverrides"]
>;

export interface BuildWorkspaceFrameActionPropsInput {
  accountSession: AccountSession | null;
  canEdit: boolean;
  claimCurrentMemberToAccount: () => unknown;
  createBookingDoc: (input: BookingDocCreateInput) => Promise<unknown>;
  createItineraryNote: (itemId: string, body: string) => unknown;
  currentMember: CurrentMember;
  effectivePlaceResolver: PlaceResolver | null | undefined;
  editItem: (itemId: string) => unknown;
  isApiMode: boolean;
  leaveParticipantSession: () => unknown;
  participantSession: TripParticipantSession | null;
  requireJoin: boolean;
  resolvedApiClient: TripApiClient | undefined;
  resolveMissingMapCoordinates: NonNullable<
    WorkspaceViewsProps["mapProps"]["onResolveMissingCoordinates"]
  >;
  rotateJoinInviteToken: NonNullable<
    WorkspaceViewsProps["membersProps"]["onRotateJoinInviteToken"]
  >;
  saveDailyBriefingOverrides: SaveDailyBriefingOverrides;
  selectedItem: ItineraryItemRef;
  transferOwnerToAccountMember: NonNullable<
    WorkspaceViewsProps["membersProps"]["onTransferOwnership"]
  >;
}

export function buildWorkspaceFrameActionProps({
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
}: BuildWorkspaceFrameActionPropsInput) {
  return {
    canClaimMember: Boolean(
      accountSession && participantSession && !currentMember.userId,
    ),
    editSelectedItem: () => {
      if (selectedItem) editItem(selectedItem.id);
    },
    onAddNoteForItem: (itemId: string, body: string) =>
      void createItineraryNote(itemId, body),
    onClaimMember: () => void claimCurrentMemberToAccount(),
    onCreateBookingDoc: async (input: BookingDocCreateInput) => {
      await createBookingDoc(input);
    },
    onLeaveParticipantSession: requireJoin ? leaveParticipantSession : undefined,
    onResolveMissingCoordinates:
      canEdit && effectivePlaceResolver ? resolveMissingMapCoordinates : undefined,
    onRotateJoinInviteToken: isApiMode ? rotateJoinInviteToken : undefined,
    onSaveDayTitle: (date: string, version: number, title: string | null) =>
      saveDailyBriefingOverrides(date, version, { dayTitle: title }),
    onTransferOwnership:
      currentMember.role === "owner" &&
      accountSession &&
      participantSession &&
      resolvedApiClient
        ? transferOwnerToAccountMember
        : undefined,
  };
}
