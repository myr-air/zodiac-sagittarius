import { cn } from "@/src/lib/cn";
import {
  mapZoneBayClassName,
  mapZoneClassName,
  mapZoneHongKongClassName,
  mapZoneShenzhenClassName,
  routeMapFallbackClassName,
  routeMapPathClassName,
  routeMapPathShadowClassName,
  routeMapSvgClassName,
  routeMarkerClassName,
  routeStopListClassName,
  routeStopListCopyClassName,
  routeStopListIndexClassName,
  routeStopListItemClassName,
} from "./route-map.config";
import {
  markerStyle,
  routeLineStyle,
} from "./route-map.utils";
import { dayColorFor } from "@/src/features/itinerary/domain/route-map-model";
import type { RouteDayGroup, RoutePoint } from "./route-map.types";

export function StaticRouteFallback({
  routeDayGroups,
  routePoints,
  stopListLabel,
}: {
  routeDayGroups: RouteDayGroup[];
  routePoints: RoutePoint[];
  stopListLabel: string;
}) {
  return (
    <div className={routeMapFallbackClassName}>
      <span className={cn(mapZoneClassName, mapZoneHongKongClassName)}>Hong Kong</span>
      <span className={cn(mapZoneClassName, mapZoneShenzhenClassName)}>Shenzhen</span>
      <span className={cn(mapZoneClassName, mapZoneBayClassName)}>Victoria Harbour</span>
      <svg className={routeMapSvgClassName} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        {routeDayGroups.map((group) => {
          if (group.points.length < 2) return null;
          const pathPoints = group.points.map((point) => `${point.x},${point.y}`).join(" ");
          return (
            <g key={group.day} style={routeLineStyle(group.color)}>
              <polyline className={routeMapPathShadowClassName} pathLength={1} points={pathPoints} />
              <polyline className={routeMapPathClassName} pathLength={1} points={pathPoints} />
            </g>
          );
        })}
      </svg>
      {routePoints.map((point, index) => (
        <span
          className={routeMarkerClassName}
          style={markerStyle(point, index, dayColorFor(point.item.day, routeDayGroups))}
          aria-hidden="true"
          key={point.item.id}
        >
          <span>{index + 1}</span>
        </span>
      ))}
      {routePoints.length > 0 ? (
        <ol className={routeStopListClassName} aria-label={stopListLabel} tabIndex={0}>
          {routePoints.slice(0, 8).map((point, index) => (
            <li className={routeStopListItemClassName} key={point.item.id}>
              <span
                className={routeStopListIndexClassName}
                style={routeLineStyle(dayColorFor(point.item.day, routeDayGroups))}
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className={routeStopListCopyClassName}>{point.item.activity}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
