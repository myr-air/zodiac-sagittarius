import type { Member } from "./types";

export function findMemberById(members: Member[], memberId: string | null | undefined): Member | undefined {
  if (!memberId) return undefined;
  return members.find((member) => member.id === memberId);
}
