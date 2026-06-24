import {
  tripMemberAccessStatusValues,
  tripInvitableRoleValues,
  tripRoleValues,
  type TripInvitableRole,
  type TripRole,
} from "@/src/trip/members";
import {
  buildSelectOptions,
  type SelectOption,
} from "@/src/shared/select-options";

export const memberInviteRoleValues = tripInvitableRoleValues;
export type MemberInviteRole = TripInvitableRole;

export const memberRoleFilterValues = ["all", ...tripRoleValues] as const;
export type MemberRoleFilter = (typeof memberRoleFilterValues)[number];

export const memberStatusFilterValues = [
  "all",
  ...tripMemberAccessStatusValues,
  "claimed",
  "pending",
] as const;
export type MemberStatusFilter = (typeof memberStatusFilterValues)[number];

export type MemberSelectOption<Value extends string = string> = SelectOption<Value>;

export interface MemberFilterLabelSource {
  appShell: {
    roles: Record<TripRole, string>;
  };
  common: {
    status: Record<"active" | "disabled" | "pending", string>;
  };
  join: {
    memberStatus: {
      claimed: string;
    };
  };
  members: {
    filters: {
      allRoles: string;
      allStatuses: string;
    };
  };
}

export function memberRoleFilterLabel(
  role: MemberRoleFilter,
  labels: MemberFilterLabelSource,
): string {
  return role === "all" ? labels.members.filters.allRoles : labels.appShell.roles[role];
}

export function memberInviteRoleLabel(
  role: MemberInviteRole,
  labels: MemberFilterLabelSource,
): string {
  return labels.appShell.roles[role];
}

export function memberStatusFilterLabel(
  status: MemberStatusFilter,
  labels: MemberFilterLabelSource,
): string {
  if (status === "all") return labels.members.filters.allStatuses;
  if (status === "claimed") return labels.join.memberStatus.claimed;
  return labels.common.status[status];
}

export function memberInviteRoleSelectOptions(
  labels: MemberFilterLabelSource,
): MemberSelectOption<MemberInviteRole>[] {
  return buildSelectOptions(memberInviteRoleValues, (value) =>
    memberInviteRoleLabel(value, labels),
  );
}

export function memberRoleFilterSelectOptions(
  labels: MemberFilterLabelSource,
): MemberSelectOption<MemberRoleFilter>[] {
  return buildSelectOptions(memberRoleFilterValues, (value) =>
    memberRoleFilterLabel(value, labels),
  );
}

export function memberStatusFilterSelectOptions(
  labels: MemberFilterLabelSource,
): MemberSelectOption<MemberStatusFilter>[] {
  return buildSelectOptions(memberStatusFilterValues, (value) =>
    memberStatusFilterLabel(value, labels),
  );
}
