import type { Messages } from "@/src/i18n/messages";
import { isTripParticipantDisabled } from "@/src/trip/auth";
import type { Member } from "@/src/trip/types";

export function participantStatusLabel(member: Member, labels: Messages["join"]["memberStatus"]): string {
  if (isTripParticipantDisabled(member)) return labels.disabled;
  if (member.userId) return labels.linked;
  if (member.claimPasswordHash || member.claimedAt) return labels.claimed;
  return labels.ready;
}
