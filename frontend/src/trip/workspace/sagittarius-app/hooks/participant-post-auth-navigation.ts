import { appRoutes, decodeReturnTo } from "@/src/trip/workspace/sagittarius-app/support";
import { decodeTripId } from "@/src/trip/identity";

interface ResolveParticipantPostAuthHrefOptions {
  encodedReturnTo: string | null;
  routeTripId?: string;
  tripId: string;
}

export function resolveParticipantPostAuthHref({
  encodedReturnTo,
  routeTripId,
  tripId,
}: ResolveParticipantPostAuthHrefOptions): string | null {
  const returnTo = encodedReturnTo ? decodeReturnTo(encodedReturnTo) : null;
  const safeReturnTo = resolveJoinPostAuthReturnTo(returnTo, tripId);
  return safeReturnTo ?? (!routeTripId ? appRoutes.tripOverview(tripId) : null);
}

export function resolveJoinPostAuthReturnTo(
  returnTo: string | null,
  tripId: string,
): string | null {
  const tripsBase = appRoutes.trips();

  if (!returnTo || !returnTo.startsWith("/")) return null;
  if (returnTo === appRoutes.trips()) return null;

  if (returnTo.startsWith(`${tripsBase}/`)) {
    const tripSegment = returnTo.slice(`${tripsBase}/`.length).split(/[/?#]/, 1)[0];
    const normalizedTripSegment = decodeTripId(tripSegment);
    if (normalizedTripSegment !== tripId) return null;
  }

  return returnTo;
}
