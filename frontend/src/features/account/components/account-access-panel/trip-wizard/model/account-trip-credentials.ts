import {
  generateTripJoinId,
  randomToken,
} from "@/src/trip/auth";
import { destinationRouteCode } from "@/src/trip/metadata";

export {
  generateJoinPassword,
  randomToken,
} from "@/src/trip/auth";

export function generateJoinId(): string {
  return generateJoinIdForTrip(new Date().toISOString().slice(0, 10), [], randomToken(3));
}

export function generateJoinIdForTrip(startDate: string, destinations: string[], suffix = randomToken(3)): string {
  return generateTripJoinId({
    routeCode: destinationRouteCode(destinations),
    startDate,
    suffix,
  });
}
