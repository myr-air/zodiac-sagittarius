import { appRoutes, tripRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { decodeTripId } from "@/src/trip/ids";

export function resolveJoinPostAuthReturnTo(
  returnTo: string | null,
  tripId: string,
): string | null {
  const tripsBase = tripRoutes.tripsBase;

  if (!returnTo || !returnTo.startsWith("/")) return null;
  if (returnTo === appRoutes.trips()) return null;

  if (returnTo.startsWith(`${tripsBase}/`)) {
    const tripSegment = returnTo.slice(`${tripsBase}/`.length).split(/[/?#]/, 1)[0];
    const normalizedTripSegment = decodeTripId(tripSegment);
    if (normalizedTripSegment !== tripId) return null;
  }

  return returnTo;
}
