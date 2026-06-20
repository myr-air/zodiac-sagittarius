"use client";

import { CSSProperties, useState } from "react";
import type { AccountExplorerSummary, AccountTripSummary } from "@/src/account/api-client";
import { Badge } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { cn } from "@/src/lib/cn";
import { PortalList, PortalListRow } from "./account-portal-list";
import { PanelHeading } from "../account-panel-heading";
import { PortalEmptyState, PortalListSkeleton, SettingLine } from "./account-portal-primitives";

interface PortalExplorerSectionClassNames {
  section: string;
  settingsGrid: string;
  stepSummary: string;
}

const portalSearchClassName =
  "portal-search grid min-h-[46px] grid-cols-[20px_minmax(0,1fr)] items-center gap-2.5 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) px-3 text-(--color-text-muted) [&_input]:min-w-0 [&_input]:border-0 [&_input]:bg-transparent [&_input]:font-[inherit] [&_input]:font-[750] [&_input]:text-(--color-text) [&_input]:outline-0";
const portalMapPreviewClassName =
  "portal-map-preview relative min-h-[220px] overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-[linear-gradient(90deg,rgb(15_23_42_/_0.06)_1px,transparent_1px),linear-gradient(0deg,rgb(15_23_42_/_0.06)_1px,transparent_1px),radial-gradient(circle_at_24%_30%,rgb(194_79_22_/_0.16),transparent_24%),radial-gradient(circle_at_76%_68%,rgb(37_99_235_/_0.14),transparent_26%),var(--color-surface-subtle)] bg-[length:34px_34px,34px_34px,auto,auto,auto] max-[767px]:min-h-[180px]";
const portalMapPinClassName =
  "portal-map-pin absolute left-[var(--pin-x)] top-[var(--pin-y)] z-[1] grid size-[34px] place-items-center rounded-full border border-(--color-primary-border) bg-(--color-surface) text-(--color-primary-strong) shadow-[var(--shadow-soft)]";

export function PortalExplorerSection({
  classNames,
  explorer,
  isLoading,
  trips,
}: {
  classNames: PortalExplorerSectionClassNames;
  explorer: AccountExplorerSummary | null;
  isLoading: boolean;
  trips: AccountTripSummary[];
}) {
  const { t } = useI18n();
  const [explorerQuery, setExplorerQuery] = useState("");
  const sharedTrips = trips.filter((trip) => !trip.isOwner);
  const explorerTrips = (sharedTrips.length ? sharedTrips : trips).filter((trip) => {
    const query = explorerQuery.trim().toLocaleLowerCase();
    if (!query) return true;
    return `${trip.name} ${trip.destinationLabel} ${trip.role}`.toLocaleLowerCase().includes(query);
  });

  return (
    <section className={cn(classNames.section, "portal-explorer-card")} id="portal-explorer">
      <PanelHeading icon="map" title={t.access.portal.sections.explorer.title} detail="Find shared trips from people in your system." />
      {isLoading && !explorer ? <PortalListSkeleton rows={1} compact /> : (
        <div className={classNames.settingsGrid}>
          <SettingLine label={t.access.portal.explorerStats.upcoming} value={`${explorer?.upcomingTrips ?? 0}`} />
          <SettingLine label={t.access.portal.explorerStats.destinations} value={`${explorer?.destinationCount ?? 0}`} />
        </div>
      )}
      {explorer?.nextTrip ? (
        <div className={classNames.stepSummary}>
          <span>{t.access.portal.explorerStats.nextTrip}</span>
          <strong>{explorer.nextTrip.name}</strong>
        </div>
      ) : null}
      <div className={portalSearchClassName}>
        <Icon name="map" />
        <input
          aria-label="Search shared trips"
          placeholder="Search city, trip, or role"
          value={explorerQuery}
          onChange={(event) => setExplorerQuery(event.target.value)}
        />
      </div>
      <div className={portalMapPreviewClassName} aria-label="Shared trip map preview">
        {explorerTrips.slice(0, 4).map((trip, index) => (
          <span
            className={portalMapPinClassName}
            key={trip.id}
            style={{ "--pin-x": `${22 + index * 17}%`, "--pin-y": `${32 + (index % 2) * 26}%` } as CSSProperties}
            title={`${trip.name}, ${trip.destinationLabel}`}
          >
            <Icon name="location" />
          </span>
        ))}
      </div>
      {explorerTrips.length ? (
        <PortalList>
          {explorerTrips.map((trip) => (
            <PortalListRow
              key={trip.id}
              icon="map"
              title={trip.name}
              detail={`${trip.destinationLabel} · ${trip.startDate} - ${trip.endDate}`}
              badge={<Badge tone={trip.isOwner ? "success" : "neutral"}>{trip.isOwner ? "Owned" : "Shared"}</Badge>}
            />
          ))}
        </PortalList>
      ) : (
        <PortalEmptyState
          actionHref={appRoutes.portalNewTrip()}
          actionLabel={t.access.portal.emptyStates.explorer.action}
          detail={explorerQuery.trim() ? t.access.portal.emptyStates.explorer.noMatchesDetail : t.access.portal.emptyStates.explorer.detail}
          icon="map"
          title={explorerQuery.trim() ? t.access.portal.emptyStates.explorer.noMatchesTitle : t.access.portal.emptyStates.explorer.title}
        />
      )}
    </section>
  );
}
