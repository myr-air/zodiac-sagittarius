import {
  tripMemberAccessStatusValues,
  tripRoleValues,
} from "@/src/trip/trip-member-types";

export const memberRoleFilterValues = ["all", ...tripRoleValues] as const;
export type MemberRoleFilter = (typeof memberRoleFilterValues)[number];

export const memberStatusFilterValues = [
  "all",
  ...tripMemberAccessStatusValues,
  "claimed",
  "pending",
] as const;
export type MemberStatusFilter = (typeof memberStatusFilterValues)[number];
