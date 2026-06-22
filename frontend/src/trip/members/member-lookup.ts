import { findById } from "@/src/shared/collection/find-by-id";
import type { Member } from "../types";

type MemberDisplayNameSource = Pick<Member, "displayName" | "id">;

export function findMemberById(members: readonly Member[], memberId: string | null | undefined): Member | undefined {
  return findById(members, memberId) ?? undefined;
}

export function buildMemberDisplayNameResolver(
  members: readonly MemberDisplayNameSource[],
): (memberId: string) => string {
  const memberNames = new Map(
    members.map((member) => [member.id, member.displayName]),
  );

  return (memberId) => memberNames.get(memberId) ?? memberId;
}
