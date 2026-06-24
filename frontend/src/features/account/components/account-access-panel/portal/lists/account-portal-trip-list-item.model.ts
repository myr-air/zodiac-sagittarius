import type { AccountTripSummary } from "@/src/account/api-client";
import { appRoutes } from "@/src/routes/app-routes";
import type { TripRole } from "@/src/trip/types";

interface AccountPortalTripListRowLabels {
  open?: string;
  owner: string;
  roles: Readonly<Record<TripRole, string>>;
}

export interface AccountPortalTripListRow {
  badgeLabel: string;
  badgeTone: ReturnType<typeof accountPortalTripBadgeTone>;
  detail: string;
  href: string;
  id: string;
  openLabel: string;
  title: string;
}

export function accountPortalTripDetail(trip: AccountTripSummary): string {
  return `${trip.destinationLabel} · ${trip.startDate} - ${trip.endDate}`;
}

export function accountPortalTripBadgeTone(
  trip: AccountTripSummary,
): "success" | "neutral" {
  return trip.isOwner ? "success" : "neutral";
}

export function buildAccountPortalTripListRows(
  trips: readonly AccountTripSummary[],
  labels: AccountPortalTripListRowLabels,
): AccountPortalTripListRow[] {
  const openLabel = labels.open ?? "Open";
  return trips.map((trip) => ({
    badgeLabel: trip.isOwner ? labels.owner : labels.roles[trip.role],
    badgeTone: accountPortalTripBadgeTone(trip),
    detail: accountPortalTripDetail(trip),
    href: appRoutes.tripOverview(trip.id),
    id: trip.id,
    openLabel,
    title: trip.name,
  }));
}
