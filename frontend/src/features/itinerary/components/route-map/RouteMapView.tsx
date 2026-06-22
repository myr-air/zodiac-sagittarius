import { useMemo } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Icon } from "@/src/ui/icons";
import { TravelMotif } from "@/src/shared/components/travel-motifs";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import {
  routeMapLayoutClassName,
  routeMapPanelClassName,
} from "./route-map.config";
import {
  activeDayLabel,
} from "./route-map.utils";
import { fallbackRouteViewport } from "./route-map.viewport";
import type { RouteMapViewProps } from "./route-map.types";
import { RouteMapCanvas } from "./RouteMapCanvas";
import { useRouteMapViewState } from "./use-route-map-view-state";
import { useRouteLiveMap } from "./use-route-live-map";

export function RouteMapView({
  countries = [],
  destinationLabel = "",
  endDate,
  itineraryView,
  items,
  liveMapAvailability = "auto",
  liveMapEnabled = process.env.NODE_ENV !== "test",
  onResolveMissingCoordinates,
  startDate,
  tripName,
}: RouteMapViewProps) {
  const { locale, t } = useI18n();
  const {
    activeDay,
    coordinateResolutionBatch,
    handleResolveMissingCoordinates,
    liveRoutePoints,
    resolutionResult,
    resolvingMissing,
    routeDayGroups,
    setActiveDay,
    visibleLiveRoutePoints,
    visibleRouteDayGroups,
    visibleRoutePoints,
    visibleUnresolvedItems,
    warningCount,
  } = useRouteMapViewState({
    items,
    itineraryView,
    locale,
    onResolveMissingCoordinates,
    startDate,
  });
  const fallbackViewport = useMemo(() => fallbackRouteViewport(destinationLabel, countries), [countries, destinationLabel]);
  const {
    liveMapState,
    mapContainerRef,
    retryLiveMap,
  } = useRouteLiveMap({
    activeDay,
    fallbackViewport,
    liveMapAvailability,
    liveMapEnabled,
    liveRoutePoints,
    routeDayGroups,
    visibleLiveRoutePoints,
  });

  return (
    <section className={routeMapPanelClassName} id="map" aria-labelledby="route-map-heading" aria-label={t.map.pageLabel}>
      <PageHeader
        title={t.map.title}
        subtitle={tripName}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(startDate, endDate, locale)}</span>
            <span><Icon name="location" /> {t.map.locationStatus({ mapped: visibleRoutePoints.length, total: items.length, unresolved: visibleUnresolvedItems.length })}</span>
            <span><Icon name="warning" /> {t.dates.warningCount({ count: warningCount })}</span>
            <span><Icon name="route" /> {activeDayLabel(activeDay, routeDayGroups, t.map.allDays, t.map.chooseDay)}</span>
          </>
        )}
        motif={<TravelMotif tone="route" />}
      />

      <div className={routeMapLayoutClassName}>
        <RouteMapCanvas
          activeDay={activeDay}
          coordinateResolutionBatch={coordinateResolutionBatch}
          copy={t.map}
          liveMapAvailability={liveMapAvailability}
          liveMapEnabled={liveMapEnabled}
          liveMapState={liveMapState}
          mapContainerRef={mapContainerRef}
          onActiveDayChange={setActiveDay}
          onResolveMissingCoordinates={onResolveMissingCoordinates ? handleResolveMissingCoordinates : undefined}
          onRetryLiveMap={retryLiveMap}
          resolutionResult={resolutionResult}
          resolvingMissing={resolvingMissing}
          routeDayGroups={routeDayGroups}
          visibleRouteDayGroups={visibleRouteDayGroups}
          visibleRoutePoints={visibleRoutePoints}
          visibleUnresolvedItems={visibleUnresolvedItems}
        />
      </div>
    </section>
  );
}

export { liveMapStatusText } from "./route-map.live-status";

export {
  activeDayLabel,
  dayColorFor,
} from "./route-map.utils";
export {
  fallbackRouteViewport,
  getRouteCenter,
} from "./route-map.viewport";
export {
  applyRouteMapTheme,
  fitLiveRoute,
} from "./route-map.live";
