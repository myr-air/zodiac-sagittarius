import type { Member, TripMemberAccessStatus, TripRole } from "@/src/trip/types";

export type PeoplePanelManagedRole = Exclude<TripRole, "owner">;

export interface PeoplePanelManagementHandlers {
  onChangeCurrentMemberPassword?: (memberId: string) => void;
  onChangeMemberAccessStatus?: (
    memberId: string,
    accessStatus: TripMemberAccessStatus,
  ) => void;
  onChangeMemberRole?: (
    memberId: string,
    role: PeoplePanelManagedRole,
  ) => void;
  onResetMemberClaim?: (memberId: string) => void;
  onTransferOwnership?: (targetMemberId: string) => void;
}

export interface PeoplePanelProps extends PeoplePanelManagementHandlers {
  members: Member[];
  currentMemberId: string;
  canManagePeople?: boolean;
  emptyMessage?: string;
  onResetFilters?: () => void;
}

export interface PeoplePanelRowProps extends PeoplePanelManagementHandlers {
  canManagePeople: boolean;
  currentMemberId: string;
  locale: string;
  member: Member;
}
