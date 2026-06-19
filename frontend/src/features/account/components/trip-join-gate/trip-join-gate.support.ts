import type { Messages } from "@/src/i18n/messages";
import { isTripParticipantDisabled } from "@/src/trip/auth";
import {
  assertMainPlanPointerAliasesMatch,
  TripApiError,
  type JoinTripResponse,
} from "@/src/trip/api-client";
import type { Member, Trip } from "@/src/trip/types";

export function roleLabel(role: Member["role"], labels: Messages["appShell"]["roles"]): string {
  return labels[role];
}

export function participantStatusLabel(member: Member, labels: Messages["join"]["memberStatus"]): string {
  if (isTripParticipantDisabled(member)) return labels.disabled;
  if (member.userId) return labels.linked;
  if (member.claimPasswordHash || member.claimedAt) return labels.claimed;
  return labels.ready;
}

export function tripFromJoinResponse(response: JoinTripResponse): Trip {
  assertMainPlanPointerAliasesMatch(response.trip);
  return {
    id: response.trip.id,
    joinId: response.trip.joinId,
    joinPasswordHash: "",
    name: response.trip.name,
    destinationLabel: response.trip.destinationLabel,
    startDate: response.trip.startDate,
    endDate: response.trip.endDate,
    /* v8 ignore next */
    activePlanVariantId: response.trip.activePlanVariantId ?? "",
    mainTripPlanId:
      response.trip.mainTripPlanId ?? response.trip.activePlanVariantId ?? "",
    planVariants: [],
    members: response.claimableMembers.map((member) => ({
      id: member.id,
      displayName: member.displayName,
      role: member.role,
      presence: member.presence,
      color: member.color,
      userId: member.userId,
      claimedAt: member.claimedAt,
      lastSeenAt: member.lastSeenAt,
      accessStatus: member.accessStatus,
    })),
    itineraryItems: [],
    expenses: [],
  };
}

export function errorMessage(caught: unknown, fallback: string): string {
  if (caught instanceof TripApiError) {
    if (caught.status === 404) return fallback;
    if (caught.status === 401 || caught.status === 403) return fallback;
    if (caught.status === 400 || caught.code === "invalid_request") return fallback;
    if (caught.status >= 500) return fallback;
    return friendlyErrorText(caught.code, fallback);
  }
  if (caught instanceof Error) {
    if (caught.message.includes("fetch") || caught.message.includes("Failed")) return fallback;
    return fallback;
  }
  return fallback;
}

function friendlyErrorText(message: string, fallback: string): string {
  const normalized = message.trim();
  if (normalized === "404") return fallback;
  if (normalized === "401" || normalized === "403") return fallback;
  if (!normalized || /^\d{3}$/.test(normalized)) return fallback;
  return normalized;
}
