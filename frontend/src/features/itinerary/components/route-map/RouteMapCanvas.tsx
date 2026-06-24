import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import {
  mapSourceNoteClassName,
  routeLiveMapClassName,
  routeLiveMapPendingClassName,
  routeMapCanvasClassName,
  routeMapRetryButtonClassName,
  routeMapStatusClassName,
} from "./route-map.config";
import { liveMapStatusText } from "./route-map.live-status";
import type {
  RouteMapCanvasProps,
} from "./route-map.types";
import { RouteMapDayFilter } from "./RouteMapDayFilter";
import { RouteMapUnresolvedPanel } from "./RouteMapUnresolvedPanel";
import { StaticRouteFallback } from "./StaticRouteFallback";

export function RouteMapCanvas({
  activeDay,
  coordinateResolutionBatch,
  copy,
  liveMapAvailability,
  liveMapEnabled,
  liveMapState,
  mapContainerRef,
  onActiveDayChange,
  onResolveMissingCoordinates,
  onRetryLiveMap,
  resolutionResult,
  resolvingMissing,
  routeDayGroups,
  visibleRouteDayGroups,
  visibleRoutePoints,
  visibleUnresolvedItems,
}: RouteMapCanvasProps) {
  return (
    <div className={routeMapCanvasClassName} data-live-map-state={liveMapState} aria-label={copy.canvasLabel}>
      <RouteMapDayFilter
        activeDay={activeDay}
        allDaysLabel={copy.allDays}
        filterLabel={copy.filterLabel}
        routeDayGroups={routeDayGroups}
        onChange={onActiveDayChange}
      />

      {liveMapState !== "ready" ? (
        <StaticRouteFallback
          routeDayGroups={visibleRouteDayGroups}
          routePoints={visibleRoutePoints}
          stopListLabel={copy.visibleStopsLabel}
        />
      ) : null}

      {liveMapState !== "error" ? (
        <>
          <div
            className={cn(routeLiveMapClassName, liveMapState !== "ready" && routeLiveMapPendingClassName)}
            ref={mapContainerRef}
            aria-hidden="true"
          />
          {liveMapState !== "ready" ? (
            <p className={routeMapStatusClassName}>
              {liveMapStatusText(liveMapState, copy.liveLoading, copy.liveError)}
            </p>
          ) : null}
        </>
      ) : (
        <div className={routeMapStatusClassName} role="status">
          <p className="m-0">{liveMapStatusText(liveMapState, copy.liveLoading, copy.liveError)}</p>
          {liveMapEnabled && liveMapAvailability === "auto" ? (
            <button className={routeMapRetryButtonClassName} type="button" onClick={onRetryLiveMap}>
              <Icon name="redo" />
              {copy.retryLiveMap}
            </button>
          ) : null}
        </div>
      )}

      {visibleUnresolvedItems.length > 0 ? (
        <RouteMapUnresolvedPanel
          activeDay={activeDay}
          coordinateResolutionBatch={coordinateResolutionBatch}
          copy={{
            label: copy.unresolvedLabel,
            resolveBatchHint: copy.resolveBatchHint,
            resolveMissing: copy.resolveMissing,
            resolveProgress: copy.resolveProgress,
            resolveResult: copy.resolveResult,
            resolveUnavailable: copy.resolveUnavailable,
            resolvingMissing: copy.resolvingMissing,
            title: copy.unresolvedTitle,
          }}
          onResolveMissingCoordinates={onResolveMissingCoordinates}
          resolutionResult={resolutionResult}
          resolvingMissing={resolvingMissing}
          visibleUnresolvedItems={visibleUnresolvedItems}
        />
      ) : null}
      {liveMapState === "error" || !liveMapEnabled ? <p className={mapSourceNoteClassName}>{copy.sourceNote}</p> : null}
    </div>
  );
}
