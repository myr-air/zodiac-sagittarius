import { decodeTripId } from "@/src/trip/ids";
import type { PlanningView } from "@/src/trip/workspace/planning-view";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";

export function resolveViewFromPath(pathname: string, tripId: string, initialView: PlanningView): PlanningView {
  const normalizedPath = pathname.replace(/\/+$/, "");
  const tripsPrefix = appRoutes.trips();

  if (!normalizedPath.startsWith(`${tripsPrefix}/`)) return initialView;

  const rawTripSegment = normalizedPath.slice(`${tripsPrefix}/`.length).split("/")[0];
  const decodedTripSegment = decodeTripId(rawTripSegment);
  if (decodedTripSegment !== tripId) return initialView;

  const scopedTripPath = `${tripsPrefix}/${rawTripSegment}`;
  if (normalizedPath === scopedTripPath) return initialView;
  if (!normalizedPath.startsWith(`${scopedTripPath}/`)) return initialView;

  const viewSegment = normalizedPath.slice(`${scopedTripPath}/`.length).split("/")[0];

  if (viewSegment === "itinerary") return "itinerary";
  if (viewSegment === "map") return "map";
  if (viewSegment === "timeline") return "timeline";
  if (viewSegment === "bookings") return "bookings";
  if (viewSegment === "photos") return "photos";
  if (viewSegment === "members") return "members";
  if (viewSegment === "expenses") return "expenses";
  if (viewSegment === "settings") return "settings";
  return initialView;
}
