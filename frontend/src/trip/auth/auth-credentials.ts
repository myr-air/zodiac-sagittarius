import { hashLocalSecret } from "./auth-local-secrets";
import type { Trip, TripJoinCredential } from "../types";

export function verifyTripCredentials(trip: Trip, credentials: TripJoinCredential): boolean {
  return normalizeJoinId(credentials.joinId) === normalizeJoinId(trip.joinId) && hashLocalSecret(credentials.password) === trip.joinPasswordHash;
}

function normalizeJoinId(joinId: string): string {
  return joinId.trim().toUpperCase();
}
