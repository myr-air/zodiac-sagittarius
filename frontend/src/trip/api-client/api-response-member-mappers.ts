import type { Member } from "../types";
import type { TripMemberResponse } from "./api-response-planning-types";

export function mapMember(member: TripMemberResponse): Member {
  return {
    id: member.id,
    displayName: member.displayName,
    role: member.role,
    presence: member.presence,
    color: member.color,
    userId: member.userId,
    claimedAt: member.claimedAt,
    lastSeenAt: member.lastSeenAt,
    accessStatus: member.accessStatus,
  };
}
