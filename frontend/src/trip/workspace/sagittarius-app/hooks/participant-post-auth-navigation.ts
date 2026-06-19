import { resolveJoinPostAuthReturnTo } from "@/src/trip/join-return";
import { appRoutes, decodeReturnTo } from "@/src/trip/workspace/sagittarius-app/support";

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
