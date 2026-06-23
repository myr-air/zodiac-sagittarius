"use client";

import { useState } from "react";
import type { AccountExplorerSummary, AccountTripSummary } from "@/src/account/api-client";
import { Badge } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { cn } from "@/src/lib/cn";
import { PortalList, PortalListRow } from "../account-portal-list";
import { PanelHeading } from "../../primitives/account-panel-heading";
import { PortalEmptyState, PortalListSkeleton, SettingLine } from "../account-portal-primitives";
import {
  accountPortalExplorerPinStyle,
  buildAccountPortalExplorerTrips,
} from "./account-portal-explorer-model";
import {
  accountPortalTripBadgeTone,
  accountPortalTripDetail,
} from "../account-portal-trip-list-item.model";
import {
  portalMapPinClassName,
  portalMapPreviewClassName,
  portalSearchClassName,
} from "./portal-explorer-section.styles";

interface PortalExplorerSectionClassNames {
  section: string;
  settingsGrid: string;
  stepSummary: string;
}

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
  const explorerTrips = buildAccountPortalExplorerTrips(trips, explorerQuery);

  return (
    <section className={cn(classNames.section, "portal-explorer-card")} id="portal-explorer">
      <PanelHeading icon="map" title={t.access.portal.sections.explorer.title} detail={t.access.portal.sections.explorer.detail} />
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
          aria-label={t.access.portal.explorerSearch.label}
          placeholder={t.access.portal.explorerSearch.placeholder}
          value={explorerQuery}
          onChange={(event) => setExplorerQuery(event.target.value)}
        />
      </div>
      <div className={portalMapPreviewClassName} aria-label={t.access.portal.explorerSearch.mapPreviewLabel}>
        {explorerTrips.slice(0, 4).map((trip, index) => (
          <span
            className={portalMapPinClassName}
            key={trip.id}
            style={accountPortalExplorerPinStyle(index)}
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
              detail={accountPortalTripDetail(trip)}
              badge={<Badge tone={accountPortalTripBadgeTone(trip)}>{trip.isOwner ? t.access.portal.explorerSearch.owned : t.access.portal.explorerSearch.shared}</Badge>}
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
