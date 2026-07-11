import type { SmartItineraryTableProps } from "@/src/features/itinerary/components/smart-itinerary-table/SmartItineraryTable.types";
import type { Waypoint } from "@/src/trip/waypoints/waypoint-types";
import type { WaypointDayGroup } from "@/src/trip/waypoints/waypoint-to-days";

export interface DetailPlannerPageProps {
  /** All SmartItineraryTable props passed through */
  tableProps: SmartItineraryTableProps;
  /** Waypoints for conversion banner */
  waypoints?: Waypoint[];
  /** Callback when import text is submitted */
  onImportApply?: (text: string) => void;
  /** Whether to hide plan variant controls from the table header (Phase 4: controls in command bar) */
  hideTablePlanControls?: boolean;
  /** Called when waypoints are converted to days */
  onConvertWaypoints?: (dayGroups: WaypointDayGroup[]) => void;
}
