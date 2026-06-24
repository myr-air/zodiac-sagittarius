import { findById, mapValueById } from "@/src/shared/collection";
import type { Member } from "../types";

type MemberDisplayNameSource = Pick<Member, "displayName" | "id">;

export function findMemberById(members: readonly Member[], memberId: string | null | undefined): Member | undefined {
  return findById(members, memberId) ?? undefined;
}

export function buildMemberDisplayNameResolver(
  members: readonly MemberDisplayNameSource[],
): (memberId: string) => string {
  const memberNames = mapValueById(members, (member) => member.displayName);

  return (memberId) => memberNames.get(memberId) ?? memberId;
}
