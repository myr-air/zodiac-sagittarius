import Link from "next/link";
import type { AccountTripSummary } from "@/src/account/api-client";
import { Badge, Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { PortalList, PortalListRow } from "./account-portal-list";
import { PanelHeading } from "../primitives/account-panel-heading";
import { PortalEmptyState, PortalListSkeleton } from "./account-portal-primitives";

interface PortalTripsSectionClassNames {
  section: string;
  topline: string;
}

export function PortalTripsSection({
  classNames,
  isLoading,
  trips,
}: {
  classNames: PortalTripsSectionClassNames;
  isLoading: boolean;
  trips: AccountTripSummary[];
}) {
  const { t } = useI18n();

  return (
    <section className={classNames.section} id="portal-trips">
      <div className={classNames.topline}>
        <PanelHeading
          icon="calendar"
          title={t.access.portal.sections.trips.title}
          detail={isLoading ? t.access.dashboard.history.loading : t.access.dashboard.history.visibleTrips({ count: trips.length })}
        />
        <Button asChild>
          <Link href={appRoutes.portalNewTrip()}>
            <Icon name="plus" />
            Create trip
          </Link>
        </Button>
      </div>
      {isLoading && !trips.length ? (
        <PortalListSkeleton rows={2} />
      ) : trips.length ? (
        <PortalList>
          {trips.map((trip) => (
            <PortalListRow
              key={trip.id}
              icon="location"
              title={trip.name}
              detail={`${trip.destinationLabel} · ${trip.startDate} - ${trip.endDate}`}
              badge={<Badge tone={trip.isOwner ? "success" : "neutral"}>{trip.isOwner ? t.access.dashboard.history.owner : t.appShell.roles[trip.role]}</Badge>}
              action={
                <Button asChild variant="secondary">
                  <Link href={appRoutes.tripOverview(trip.id)}>
                    <Icon name="chevronRight" />
                    Open
                  </Link>
                </Button>
              }
            />
          ))}
        </PortalList>
      ) : (
        <PortalEmptyState
          actionHref={appRoutes.portalNewTrip()}
          actionLabel={t.access.portal.emptyStates.trips.action}
          detail={t.access.portal.emptyStates.trips.detail}
          icon="plus"
          title={t.access.portal.emptyStates.trips.title}
        />
      )}
    </section>
  );
}
