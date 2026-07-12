import { useCallback, useState } from "react";
import { useT } from "@/src/i18n/use-t";
import { SmartItineraryTable } from "@/src/features/itinerary/components/smart-itinerary-table/SmartItineraryTable";
import { InlineImportArea } from "@/src/features/workspace/components/inline-import/InlineImportArea";
import { WaypointConversionBanner } from "@/src/features/workspace/components/waypoint-conversion/WaypointConversionBanner";
import type { WaypointDayGroup } from "@/src/trip/waypoints/waypoint-to-days";
import type { DetailPlannerPageProps } from "./DetailPlannerPage.types";
import {
  importButtonClassName,
  pageClassName,
  tableWrapperClassName,
  toolbarClassName,
  toolbarSpacerClassName,
} from "./DetailPlannerPage.styles";

export function DetailPlannerPage({
  tableProps,
  waypoints = [],
  onImportApply,
  hideTablePlanControls = false,
  onConvertWaypoints,
}: DetailPlannerPageProps) {
  const { t } = useT();
  const [showImport, setShowImport] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const handleImportApply = useCallback(
    (text: string) => {
      setShowImport(false);
      onImportApply?.(text);
    },
    [onImportApply],
  );

  const handleConvert = useCallback(
    (dayGroups: WaypointDayGroup[]) => {
      onConvertWaypoints?.(dayGroups);
    },
    [onConvertWaypoints],
  );

  const hasExistingItinerary = (tableProps.items?.length ?? 0) > 0;
  const shouldShowBanner =
    !bannerDismissed && waypoints.length > 0 && !hasExistingItinerary;

  return (
    <div className={pageClassName}>
      <div className={toolbarClassName}>
        <button
          type="button"
          onClick={() => setShowImport((prev) => !prev)}
          className={importButtonClassName}
        >
          {t.detailPlanner.importButton}
        </button>
        <div className={toolbarSpacerClassName} />
      </div>

      {shouldShowBanner ? (
        <WaypointConversionBanner
          waypoints={waypoints}
          startDate={tableProps.startDate}
          hasExistingItinerary={hasExistingItinerary}
          onConvert={handleConvert}
          onDismiss={() => setBannerDismissed(true)}
        />
      ) : null}

      {showImport ? (
        <InlineImportArea
          onApply={handleImportApply}
          onCancel={() => setShowImport(false)}
        />
      ) : null}

      <div className={tableWrapperClassName}>
        <SmartItineraryTable
          {...tableProps}
          hideTablePlanControls={hideTablePlanControls}
        />
      </div>
    </div>
  );
}
