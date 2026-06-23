import type { CSSProperties } from "react";
import type { AccountTripSummary } from "@/src/account/api-client";

export function buildAccountPortalExplorerTrips(
  trips: AccountTripSummary[],
  query: string,
): AccountTripSummary[] {
  const sharedTrips = trips.filter((trip) => !trip.isOwner);
  const baseTrips = sharedTrips.length ? sharedTrips : trips;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return baseTrips;

  return baseTrips.filter((trip) =>
    `${trip.name} ${trip.destinationLabel} ${trip.role}`
      .toLocaleLowerCase()
      .includes(normalizedQuery),
  );
}

export function accountPortalExplorerPinStyle(index: number): CSSProperties {
  return {
    "--pin-x": `${22 + index * 17}%`,
    "--pin-y": `${32 + (index % 2) * 26}%`,
  } as CSSProperties;
}
