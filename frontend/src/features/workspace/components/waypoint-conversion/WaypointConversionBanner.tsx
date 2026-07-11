import { useT } from "@/src/i18n/use-t";
import { convertWaypointsToDays } from "@/src/trip/waypoints/waypoint-to-days";
import type { WaypointConversionBannerProps } from "./WaypointConversionBanner.types";
import {
  waypointConversionBannerAcceptButtonClassName,
  waypointConversionBannerActionsClassName,
  waypointConversionBannerClassName,
  waypointConversionBannerDismissButtonClassName,
  waypointConversionBannerTextClassName,
} from "./WaypointConversionBanner.styles";

export function WaypointConversionBanner({
  waypoints,
  startDate,
  hasExistingItinerary,
  onConvert,
  onDismiss,
}: WaypointConversionBannerProps) {
  const { t } = useT();

  // Do not render if no waypoints or itinerary already exists
  if (waypoints.length === 0 || hasExistingItinerary) {
    return null;
  }

  const handleConvert = () => {
    const dayGroups = convertWaypointsToDays(waypoints, startDate);
    onConvert(dayGroups);
  };

  return (
    <div className={waypointConversionBannerClassName} role="status">
      <span className={waypointConversionBannerTextClassName}>
        {t.detailPlanner.waypointConversionBanner.replace("{count}", String(waypoints.length))}
      </span>
      <div className={waypointConversionBannerActionsClassName}>
        <button
          type="button"
          onClick={handleConvert}
          className={waypointConversionBannerAcceptButtonClassName}
        >
          {t.detailPlanner.conversionAccept}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className={waypointConversionBannerDismissButtonClassName}
        >
          {t.detailPlanner.conversionDismiss}
        </button>
      </div>
    </div>
  );
}
