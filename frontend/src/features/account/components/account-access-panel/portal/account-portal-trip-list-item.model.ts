import type { AccountTripSummary } from "@/src/account/api-client";

export function accountPortalTripDetail(trip: AccountTripSummary): string {
  return `${trip.destinationLabel} · ${trip.startDate} - ${trip.endDate}`;
}

export function accountPortalTripBadgeTone(
  trip: AccountTripSummary,
): "success" | "neutral" {
  return trip.isOwner ? "success" : "neutral";
}
