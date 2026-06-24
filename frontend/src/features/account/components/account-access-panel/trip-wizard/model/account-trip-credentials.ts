import {
  generateTripJoinId,
  randomToken,
} from "@/src/trip/auth";
import { destinationRouteCode } from "@/src/trip/metadata";
import { defaultTripStartDate } from "./account-trip-default-dates";

export {
  generateJoinPassword,
  randomToken,
} from "@/src/trip/auth";

export function generateJoinId(startDate = defaultTripStartDate()): string {
  return generateJoinIdForTrip(startDate, [], randomToken(3));
}

export function generateJoinIdForTrip(startDate: string, destinations: string[], suffix = randomToken(3)): string {
  return generateTripJoinId({
    routeCode: destinationRouteCode(destinations),
    startDate,
    suffix,
  });
}
