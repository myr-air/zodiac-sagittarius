import type { Member } from "../types";

const syntheticViewerMemberId = "member-viewer";

export function isSyntheticViewerMember(member: Pick<Member, "id">): boolean {
  return member.id === syntheticViewerMemberId;
}

export function visibleTripMembers<TMember extends Pick<Member, "id">>(
  members: readonly TMember[],
): TMember[] {
  return members.filter((member) => !isSyntheticViewerMember(member));
}

export function assignableTripMembers<
  TMember extends Pick<Member, "id" | "accessStatus">,
>(members: readonly TMember[]): TMember[] {
  return visibleTripMembers(members).filter(
    (member) => member.accessStatus !== "disabled",
  );
}
