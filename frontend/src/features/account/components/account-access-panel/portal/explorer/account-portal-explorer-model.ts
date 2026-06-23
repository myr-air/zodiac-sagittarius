import type { CSSProperties } from "react";
import type { AccountTripSummary } from "@/src/account/api-client";
import {
  accountPortalTripBadgeTone,
  accountPortalTripDetail,
} from "../lists/account-portal-trip-list-item.model";

interface AccountPortalExplorerRowLabels {
  owned: string;
  shared: string;
}

export interface AccountPortalExplorerMapPin {
  id: string;
  style: CSSProperties;
  title: string;
}

export interface AccountPortalExplorerTripRow {
  badgeLabel: string;
  badgeTone: ReturnType<typeof accountPortalTripBadgeTone>;
  detail: string;
  id: string;
  title: string;
}

export function buildAccountPortalExplorerTrips(
  trips: readonly AccountTripSummary[],
  query: string,
): readonly AccountTripSummary[] {
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

export function buildAccountPortalExplorerMapPins(
  trips: readonly AccountTripSummary[],
): AccountPortalExplorerMapPin[] {
  return trips.slice(0, 4).map((trip, index) => ({
    id: trip.id,
    style: accountPortalExplorerPinStyle(index),
    title: `${trip.name}, ${trip.destinationLabel}`,
  }));
}

export function buildAccountPortalExplorerTripRows(
  trips: readonly AccountTripSummary[],
  labels: AccountPortalExplorerRowLabels,
): AccountPortalExplorerTripRow[] {
  return trips.map((trip) => ({
    badgeLabel: trip.isOwner ? labels.owned : labels.shared,
    badgeTone: accountPortalTripBadgeTone(trip),
    detail: accountPortalTripDetail(trip),
    id: trip.id,
    title: trip.name,
  }));
}
