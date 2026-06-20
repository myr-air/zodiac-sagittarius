import type { FormEvent } from "react";
import type { useI18n } from "@/src/i18n/I18nProvider";
import type { CopyFeedbackState } from "@/src/shared/hooks/use-copy-feedback-state";
import type { TripInvitableRole } from "@/src/trip/types";
import type { MemberRoleFilter, MemberStatusFilter } from "../TripMembersPage.support";

export type MemberLabels = ReturnType<typeof useI18n>["t"];
export type MemberConfirmLabels = MemberLabels["members"]["confirm"];
export type MemberCopyState = CopyFeedbackState;
export type NewMemberRole = TripInvitableRole;

export interface MemberFilterControlProps {
  labels: MemberLabels;
  onQueryChange: (query: string) => void;
  onRoleFilterChange: (role: MemberRoleFilter) => void;
  onStatusFilterChange: (status: MemberStatusFilter) => void;
  query: string;
  roleFilter: MemberRoleFilter;
  statusFilter: MemberStatusFilter;
}

export interface MemberInviteActionsProps {
  canManagePeople: boolean;
  copyState: MemberCopyState;
  createPanelOpen: boolean;
  isRotatingInviteToken: boolean;
  labels: MemberLabels;
  onClearFilters: () => void;
  onCopyInviteLink: () => void;
  onRotateInviteToken?: () => void;
  onToggleCreatePanel: () => void;
}

export interface MemberCreatePanelProps {
  canManagePeople: boolean;
  labels: MemberLabels;
  newMemberName: string;
  newMemberRole: NewMemberRole;
  onNewMemberNameChange: (value: string) => void;
  onNewMemberRoleChange: (role: NewMemberRole) => void;
  onSubmitNewMember: (event: FormEvent<HTMLFormElement>) => void;
}
