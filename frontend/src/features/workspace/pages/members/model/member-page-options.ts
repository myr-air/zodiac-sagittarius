import {
  tripMemberAccessStatusValues,
  tripRoleValues,
  type TripRole,
} from "@/src/trip/members";

export const memberRoleFilterValues = ["all", ...tripRoleValues] as const;
export type MemberRoleFilter = (typeof memberRoleFilterValues)[number];

export const memberStatusFilterValues = [
  "all",
  ...tripMemberAccessStatusValues,
  "claimed",
  "pending",
] as const;
export type MemberStatusFilter = (typeof memberStatusFilterValues)[number];

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

export function memberStatusFilterLabel(
  status: MemberStatusFilter,
  labels: MemberFilterLabelSource,
): string {
  if (status === "all") return labels.members.filters.allStatuses;
  if (status === "claimed") return labels.join.memberStatus.claimed;
  return labels.common.status[status];
}
