import type { AccountTripCreateResponse } from "@/src/account/api-client";
import type { TripApiClient } from "@/src/trip/api-client";
import { buildInviteLink } from "../../trip-wizard/model/account-trip-wizard-support";
import type { CreatedTripShare } from "../../trip-wizard/share/portal-created-trip-share";

export function buildPortalCreatedTripShare(
  response: AccountTripCreateResponse,
  inviteToken: string | null,
): CreatedTripShare {
  return {
    inviteLink: buildInviteLink(response.trip.joinId, inviteToken),
    joinId: response.trip.joinId,
    name: response.trip.name,
  };
}

export async function resolvePortalCreatedTripInviteToken(
  apiClient: TripApiClient | undefined,
  response: AccountTripCreateResponse,
): Promise<string | null> {
  try {
    const invite = await apiClient?.rotateJoinInviteToken?.(response.trip.id, response.memberSession.sessionToken);
    return invite?.token ?? null;
  } catch {
    return null;
  }
}
