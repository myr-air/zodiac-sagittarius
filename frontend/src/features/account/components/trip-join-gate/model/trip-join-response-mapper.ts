import {
  assertMainPlanPointerAliasesMatch,
  type JoinTripResponse,
} from "@/src/trip/api-client";
import type { Trip } from "@/src/trip/types";

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
