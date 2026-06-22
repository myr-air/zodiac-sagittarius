import type { Dispatch, SetStateAction } from "react";
import type { AccountApiClient, AccountSession } from "@/src/account/api-client";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type {
  Trip,
  TripMemberAccessStatus,
  TripParticipantSession,
  TripRole,
} from "@/src/trip/types";
import type { TripSettingsFormValues } from "@/src/features/workspace/pages/trip-settings/model/trip-settings-form-model";

export interface WorkspaceAdministrationCommandBaseParams {
  canManagePeople: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  resolvedApiClient?: TripApiClient;
  trip: Trip;
}

export interface UseWorkspaceAdministrationOptions
  extends WorkspaceAdministrationCommandBaseParams {
  accountClient: AccountApiClient;
  accountSession: AccountSession | null;
  currentMemberId: string;
  replaceCockpitFromApi: (cockpit: TripCockpit) => void;
  setAccountClaimState: Dispatch<
    SetStateAction<{
      status: "idle" | "saving";
      message: string | null;
    }>
  >;
  setJoinInviteToken: Dispatch<SetStateAction<string | null>>;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export type UseWorkspaceMemberAdminActionsOptions =
  WorkspaceAdministrationCommandBaseParams & {
    currentMemberId: string;
    setJoinInviteToken: Dispatch<SetStateAction<string | null>>;
  };

export type UseWorkspaceMemberPatchActionsOptions =
  WorkspaceAdministrationCommandBaseParams & {
    currentMemberId: string;
  };

export interface UseWorkspaceAccountClaimActionsOptions {
  accountClient: AccountApiClient;
  accountSession: AccountSession | null;
  participantSession: TripParticipantSession | null;
  resolvedApiClient?: TripApiClient;
  replaceCockpitFromApi: (cockpit: TripCockpit) => void;
  setAccountClaimState: UseWorkspaceAdministrationOptions["setAccountClaimState"];
}

export type UseWorkspaceTripSettingsActionsOptions =
  WorkspaceAdministrationCommandBaseParams & {
    updateApiTrip: (updater: (current: Trip) => Trip) => void;
  };

export type CreateWorkspaceMemberCommand = (input: {
  displayName: string;
  role: Exclude<TripRole, "owner">;
}) => Promise<void>;

export type ChangeWorkspaceMemberRoleCommand = (
  memberId: string,
  role: Exclude<TripRole, "owner">,
) => Promise<void>;

export type ChangeWorkspaceMemberAccessStatusCommand = (
  memberId: string,
  accessStatus: TripMemberAccessStatus,
) => Promise<void>;

export type ChangeWorkspaceMemberPasswordCommand = (
  memberId: string,
  password: string,
) => Promise<void>;

export type ResetWorkspaceMemberClaimCommand = (
  memberId: string,
) => Promise<void>;

export type RotateWorkspaceJoinInviteTokenCommand = () => Promise<void>;

export type SaveWorkspaceTripSettingsCommand = (
  values: TripSettingsFormValues,
) => Promise<void>;
