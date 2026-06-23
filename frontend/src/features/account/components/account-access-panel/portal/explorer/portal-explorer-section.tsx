"use client";

import { useState } from "react";
import type { AccountExplorerSummary, AccountTripSummary } from "@/src/account/api-client";
import { Badge } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { appRoutes } from "@/src/routes/app-routes";
import { cn } from "@/src/lib/cn";
import { PortalList, PortalListRow } from "../lists/account-portal-list";
import { PanelHeading } from "../../primitives/account-panel-heading";
import { PortalEmptyState, PortalListSkeleton, SettingLine } from "../primitives/account-portal-primitives";
import {
  buildAccountPortalExplorerMapPins,
  buildAccountPortalExplorerTripRows,
  buildAccountPortalExplorerTrips,
} from "./account-portal-explorer-model";
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
  const explorerPins = buildAccountPortalExplorerMapPins(explorerTrips);
  const explorerRows = buildAccountPortalExplorerTripRows(explorerTrips, {
    owned: t.access.portal.explorerSearch.owned,
    shared: t.access.portal.explorerSearch.shared,
  });

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
        {explorerPins.map((pin) => (
          <span
            className={portalMapPinClassName}
            key={pin.id}
            style={pin.style}
            title={pin.title}
          >
            <Icon name="location" />
          </span>
        ))}
      </div>
      {explorerTrips.length ? (
        <PortalList>
          {explorerRows.map((trip) => (
            <PortalListRow
              key={trip.id}
              icon="map"
              title={trip.title}
              detail={trip.detail}
              badge={<Badge tone={trip.badgeTone}>{trip.badgeLabel}</Badge>}
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
