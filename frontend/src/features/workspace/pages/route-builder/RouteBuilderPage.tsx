import { useCallback } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { WorkspacePage } from "@/src/ui";
import type { Waypoint } from "@/src/trip/waypoints/waypoint-types";
import type { RouteBuilderPageProps } from "./RouteBuilderPage.types";
import { WaypointMapSurface } from "./WaypointMapSurface";
import { renumberWaypoints } from "./route-builder.utils";
import { mapColumnClass, pageClass } from "./RouteBuilderPage.styles";

export function RouteBuilderPage({
  waypoints,
  tripDestination,
  onWaypointsChange,
  liveMapEnabled,
}: RouteBuilderPageProps) {
  const { t } = useI18n();

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
    </WorkspacePage>
  );
}
