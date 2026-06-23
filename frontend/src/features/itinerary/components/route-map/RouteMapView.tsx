import { useMemo } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { TravelMotif } from "@/src/shared/components/travel-motifs";
import { PageHeader } from "@/src/shared/components/page-header";
import {
  routeMapLayoutClassName,
  routeMapPanelClassName,
} from "./route-map.config";
import { fallbackRouteViewport } from "./route-map.viewport";
import type { RouteMapViewProps } from "./route-map.types";
import { RouteMapCanvas } from "./RouteMapCanvas";
import { RouteMapHeaderMeta } from "./RouteMapHeaderMeta";
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
          <RouteMapHeaderMeta
            activeDay={activeDay}
            copy={t.map}
            endDate={endDate}
            itemsCount={items.length}
            locale={locale}
            mappedCount={visibleRoutePoints.length}
            routeDayGroups={routeDayGroups}
            startDate={startDate}
            unresolvedCount={visibleUnresolvedItems.length}
            warningCount={warningCount}
            warningCountLabel={t.dates.warningCount}
          />
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

export {
  activeDayLabel,
  dayColorFor,
} from "@/src/features/itinerary/domain/route-map-model";
export {
  fallbackRouteViewport,
  getRouteCenter,
} from "./route-map.viewport";
export {
  applyRouteMapTheme,
  fitLiveRoute,
} from "./route-map.live";
