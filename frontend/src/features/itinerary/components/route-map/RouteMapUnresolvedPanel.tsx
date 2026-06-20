import type { ItineraryItem } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import {
  unresolvedPanelActionsClassName,
  unresolvedPanelButtonClassName,
  unresolvedPanelClassName,
  unresolvedPanelHeaderClassName,
  unresolvedPanelItemClassName,
  unresolvedPanelItemTitleClassName,
  unresolvedPanelListClassName,
  unresolvedPanelStatusClassName,
} from "./route-map.config";
import { allDaysFilter, type DayFilter, type MapCoordinateResolutionResult } from "./route-map.types";

interface RouteMapUnresolvedPanelCopy {
  label: string;
  resolveBatchHint: (params: { count: number; total: number }) => string;
  resolveMissing: (params: { count: number }) => string;
  resolveProgress: (params: { count: number; total: number }) => string;
  resolveResult: (result: MapCoordinateResolutionResult) => string;
  resolveUnavailable: string;
  resolvingMissing: (params: { count: number }) => string;
  title: (params: { count: number }) => string;
}

interface RouteMapUnresolvedPanelProps {
  activeDay: DayFilter;
  coordinateResolutionBatch: ItineraryItem[];
  copy: RouteMapUnresolvedPanelCopy;
  onResolveMissingCoordinates?: () => void;
  resolutionResult: MapCoordinateResolutionResult | null;
  resolvingMissing: boolean;
  visibleUnresolvedItems: ItineraryItem[];
}

export function RouteMapUnresolvedPanel({
  activeDay,
  coordinateResolutionBatch,
  copy,
  onResolveMissingCoordinates,
  resolutionResult,
  resolvingMissing,
  visibleUnresolvedItems,
}: RouteMapUnresolvedPanelProps) {
  return (
    <div className={unresolvedPanelClassName} role="region" aria-label={copy.label}>
      <div className={unresolvedPanelActionsClassName}>
        <div className={unresolvedPanelHeaderClassName}>
          <Icon name="warning" />
          <span>{copy.title({ count: visibleUnresolvedItems.length })}</span>
        </div>
        <button
          type="button"
          className={unresolvedPanelButtonClassName}
          disabled={!onResolveMissingCoordinates || resolvingMissing}
          title={!onResolveMissingCoordinates ? copy.resolveUnavailable : undefined}
          onClick={onResolveMissingCoordinates}
        >
          <Icon name="location" />
          {resolvingMissing
            ? copy.resolvingMissing({ count: coordinateResolutionBatch.length })
            : copy.resolveMissing({ count: coordinateResolutionBatch.length })}
        </button>
      </div>
      {resolvingMissing ? (
        <p className={unresolvedPanelStatusClassName}>
          {copy.resolveProgress({
            count: coordinateResolutionBatch.length,
            total: visibleUnresolvedItems.length,
          })}
        </p>
      ) : resolutionResult ? (
        <p className={unresolvedPanelStatusClassName}>
          {copy.resolveResult(resolutionResult)}
        </p>
      ) : activeDay === allDaysFilter && visibleUnresolvedItems.length > coordinateResolutionBatch.length ? (
        <p className={unresolvedPanelStatusClassName}>
          {copy.resolveBatchHint({
            count: coordinateResolutionBatch.length,
            total: visibleUnresolvedItems.length,
          })}
        </p>
      ) : null}
      <ol className={unresolvedPanelListClassName}>
        {visibleUnresolvedItems.slice(0, 6).map((item) => (
          <li className={unresolvedPanelItemClassName} key={item.id}>
            <span className={unresolvedPanelItemTitleClassName}>{item.activity}</span>
            <span>{item.place}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
