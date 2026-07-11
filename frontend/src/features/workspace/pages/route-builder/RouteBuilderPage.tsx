import { useCallback, useMemo, useRef } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { WorkspacePage } from "@/src/ui";
import type { Waypoint } from "@/src/trip/waypoints/waypoint-types";
import type { RouteBuilderPageProps } from "./RouteBuilderPage.types";
import { GapSuggestionsRail } from "./GapSuggestionsRail";
import { WaypointMapSurface } from "./WaypointMapSurface";
import {
  computeGapSuggestions,
  insertWaypoint,
  renumberWaypoints,
  sortWaypoints,
} from "./route-builder.utils";
import { mapColumnClass, pageClass } from "./RouteBuilderPage.styles";

function makeWaypointId(counter: number): string {
  return `wp-${Date.now()}-${counter}`;
}

export function RouteBuilderPage({
  waypoints,
  tripDestination,
  onWaypointsChange,
  liveMapEnabled,
}: RouteBuilderPageProps) {
  const { t } = useI18n();
  const sorted = useMemo(() => sortWaypoints(waypoints), [waypoints]);
  const idCounterRef = useRef(0);

  const handleSuggestionSelect = useCallback(
    (suggestion: ReturnType<typeof computeGapSuggestions>[number]) => {
      const index = suggestion.gapIndex;
      const from = sorted[index];
      const to = sorted[index + 1];
      if (!from || !to) return;

      idCounterRef.current += 1;
      const midpoint: Waypoint = {
        id: makeWaypointId(idCounterRef.current),
        tripId: from.tripId,
        name: suggestion.name,
        lat: (from.lat + to.lat) / 2,
        lng: (from.lng + to.lng) / 2,
        sortOrder: 0,
      };

      onWaypointsChange(insertWaypoint(sorted, index, midpoint));
    },
    [sorted, onWaypointsChange],
  );

  const handleWaypointsChange = useCallback(
    (nextWaypoints: Waypoint[]) => {
      onWaypointsChange(renumberWaypoints(nextWaypoints));
    },
    [onWaypointsChange],
  );

  return (
    <WorkspacePage className={pageClass} aria-label={t.routeBuilder.title}>
      <div className={mapColumnClass}>
        <WaypointMapSurface
          waypoints={waypoints}
          tripDestination={tripDestination}
          onWaypointsChange={handleWaypointsChange}
          liveMapEnabled={liveMapEnabled}
        />
      </div>
      <GapSuggestionsRail
        waypoints={waypoints}
        onSelect={handleSuggestionSelect}
      />
    </WorkspacePage>
  );
}
