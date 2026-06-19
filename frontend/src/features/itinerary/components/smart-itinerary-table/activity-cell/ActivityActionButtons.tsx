import type { ItineraryItem } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import type { Locale } from "@/src/i18n/types";
import type { Messages } from "@/src/i18n/messages";

import { activityIconButtonClassName } from "../smart-itinerary-table.styles";

export function ActivityActionButtons({
  iconClassName,
  item,
  itineraryLabels,
  locale,
  onActionComplete,
  onDeleteItem,
  onEditItem,
  onOpenItemDetails,
  onOpenNoteForItem,
  showDelete = true,
  showDetails = true,
  showEdit = true,
  showMap = true,
  showNote = true,
}: {
  iconClassName?: string;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  onActionComplete?: () => void;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onOpenItemDetails?: (itemId: string) => void;
  onOpenNoteForItem?: (item: ItineraryItem) => void;
  showDelete?: boolean;
  showDetails?: boolean;
  showEdit?: boolean;
  showMap?: boolean;
  showNote?: boolean;
}) {
  const mapLabel = `${itineraryLabels.row.mapFallback}: ${
    item.place || item.activity
  }`;
  const noteLabel =
    locale === "th"
      ? `เพิ่มโน้ต ${item.activity}`
      : `Add note for ${item.activity}`;

  return (
    <>
      {showMap && item.mapLink ? (
        <a
          className={activityIconButtonClassName}
          href={item.mapLink}
          target="_blank"
          rel="noreferrer"
          aria-label={mapLabel}
          title={mapLabel}
          onClick={(event) => {
            event.stopPropagation();
            onActionComplete?.();
          }}
        >
          <Icon name="map" className={iconClassName} />
        </a>
      ) : null}
      {showNote && onOpenNoteForItem ? (
        <button
          type="button"
          className={activityIconButtonClassName}
          aria-label={noteLabel}
          title={noteLabel}
          onClick={(event) => {
            event.stopPropagation();
            onActionComplete?.();
            onOpenNoteForItem(item);
          }}
        >
          <Icon name="note" className={iconClassName} />
        </button>
      ) : null}
      {showDetails && onOpenItemDetails ? (
        <button
          type="button"
          className={activityIconButtonClassName}
          aria-label={itineraryLabels.row.openDetails({
            activity: item.activity,
          })}
          title={itineraryLabels.row.openDetails({
            activity: item.activity,
          })}
          onClick={(event) => {
            event.stopPropagation();
            onActionComplete?.();
            onOpenItemDetails(item.id);
          }}
        >
          <Icon name="panel" className={iconClassName} />
        </button>
      ) : null}
      {showEdit && onEditItem ? (
        <button
          type="button"
          className={activityIconButtonClassName}
          aria-label={itineraryLabels.row.edit({
            activity: item.activity,
          })}
          title={itineraryLabels.row.edit({
            activity: item.activity,
          })}
          onClick={(event) => {
            event.stopPropagation();
            onActionComplete?.();
            onEditItem(item.id);
          }}
        >
          <Icon name="edit" className={iconClassName} />
        </button>
      ) : null}
      {showDelete && onDeleteItem ? (
        <button
          type="button"
          className={activityIconButtonClassName}
          aria-label={itineraryLabels.row.delete({
            activity: item.activity,
          })}
          title={itineraryLabels.row.delete({
            activity: item.activity,
          })}
          onClick={(event) => {
            event.stopPropagation();
            onActionComplete?.();
            onDeleteItem(item.id);
          }}
        >
          <Icon name="trash" className={iconClassName} />
        </button>
      ) : null}
    </>
  );
}
