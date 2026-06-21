import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { safeExternalHref } from "@/src/trip/places";
import { activityTypeLabel, formatDuration, formatEndTime } from "@/src/features/itinerary/lib/itinerary-display";
import type { ItineraryItem } from "@/src/trip/types";
import type { ContextRailTab } from "./context-rail.utils";
import {
  detailButtonClassName,
  detailMapClassName,
  detailMetaLineClassName,
  detailSectionClassName,
  mapLinkClassName,
  mapMarkerClassName,
  mapPoiClassName,
  mapRoadBaseClassName,
  mapRoadOneClassName,
  mapRoadThreeClassName,
  mapRoadTwoClassName,
  mapWaterClassName,
} from "./context-rail.styles";

export function ContextRailStopDetailSection({
  canCreateSuggestion,
  canEdit,
  selectedItem,
  onActiveTabChange,
  onEditSelected,
  onSuggestSelected,
}: {
  canCreateSuggestion: boolean;
  canEdit: boolean;
  selectedItem: ItineraryItem;
  onActiveTabChange: (tab: ContextRailTab) => void;
  onEditSelected: () => void;
  onSuggestSelected: () => void;
}) {
  const { locale, t } = useI18n();
  const selectedEnd = formatEndTime(selectedItem.startTime, selectedItem.durationMinutes);

  return (
    <section
      className={detailSectionClassName}
      aria-label={t.contextRail.detailLabel}
    >
      <p className={detailMetaLineClassName}>
        <Icon name="utensils" />{" "}
        {activityTypeLabel(selectedItem.activityType, locale)}
      </p>
      <p className={detailMetaLineClassName}>
        <Icon name="clock" /> {selectedItem.startTime} – {selectedEnd} (
        {formatDuration(selectedItem.durationMinutes, locale)})
      </p>
      <p className={detailMetaLineClassName}>
        <Icon name="location" /> {selectedItem.address ?? selectedItem.place}
      </p>
      <a
        className={mapLinkClassName}
        href={safeExternalHref(selectedItem.mapLink) || "#"}
      >
        {t.contextRail.openMaps}
      </a>
      <div
        className={detailMapClassName}
        aria-label={t.contextRail.mapPreview}
      >
        <span className={`${mapRoadBaseClassName} ${mapRoadOneClassName}`} />
        <span className={`${mapRoadBaseClassName} ${mapRoadTwoClassName}`} />
        <span className={`${mapRoadBaseClassName} ${mapRoadThreeClassName}`} />
        <span className={mapWaterClassName} />
        <span className={`${mapPoiClassName} map-poi-1 left-[58px] top-[18px]`}>
          Austin
        </span>
        <span className={`${mapPoiClassName} map-poi-2 right-10 top-5`}>
          Jordan
        </span>
        <span className={mapMarkerClassName}>
          <Icon name="location" />
        </span>
      </div>
      {canEdit ? (
        <Button
          type="button"
          variant="secondary"
          className={detailButtonClassName}
          onClick={onEditSelected}
        >
          {t.contextRail.editDetails}
        </Button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className={detailButtonClassName}
          disabled={!canCreateSuggestion}
          onClick={() => {
            onSuggestSelected();
            onActiveTabChange("suggestions");
          }}
        >
          {t.contextRail.suggestEdit}
        </Button>
      )}
    </section>
  );
}
