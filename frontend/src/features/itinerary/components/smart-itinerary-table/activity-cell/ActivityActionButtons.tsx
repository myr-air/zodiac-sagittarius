import type { ItineraryItem } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";
import type { Messages } from "@/src/i18n/messages";
import {
  activityBlockToggleLabel,
  activityMapActionLabel,
  activityNoteActionLabel,
} from "@/src/features/itinerary/domain/itinerary-activity-actions";

import { ActivityActionButton } from "./ActivityActionButton";

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
  onToggleActivityBlock,
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
  onToggleActivityBlock?: (itemId: string) => void;
  showDelete?: boolean;
  showDetails?: boolean;
  showEdit?: boolean;
  showMap?: boolean;
  showNote?: boolean;
}) {
  const mapLabel = activityMapActionLabel(
    item,
    itineraryLabels.row.mapFallback,
  );
  const blockToggleLabel = activityBlockToggleLabel(
    item,
    locale,
    item.isPlanBlock ?? false,
  );
  const noteLabel = activityNoteActionLabel(item, locale, item.note);
  const detailsLabel = itineraryLabels.row.openDetails({
    activity: item.activity,
  });
  const editLabel = itineraryLabels.row.edit({
    activity: item.activity,
  });
  const deleteLabel = itineraryLabels.row.delete({
    activity: item.activity,
  });

  return (
    <>
      {showMap && item.mapLink ? (
        <ActivityActionButton
          ariaLabel={mapLabel}
          href={item.mapLink}
          iconClassName={iconClassName}
          iconName="map"
          onActionComplete={onActionComplete}
        />
      ) : null}
      {onToggleActivityBlock ? (
        <ActivityActionButton
          ariaLabel={blockToggleLabel}
          iconClassName={iconClassName}
          iconName="block"
          onAction={() => onToggleActivityBlock(item.id)}
          onActionComplete={onActionComplete}
        />
      ) : null}
      {showNote && onOpenNoteForItem ? (
        <ActivityActionButton
          ariaLabel={noteLabel}
          iconClassName={iconClassName}
          iconName="note"
          onAction={() => onOpenNoteForItem(item)}
          onActionComplete={onActionComplete}
        />
      ) : null}
      {showDetails && onOpenItemDetails ? (
        <ActivityActionButton
          ariaLabel={detailsLabel}
          iconClassName={iconClassName}
          iconName="panel"
          onAction={() => onOpenItemDetails(item.id)}
          onActionComplete={onActionComplete}
        />
      ) : null}
      {showEdit && onEditItem ? (
        <ActivityActionButton
          ariaLabel={editLabel}
          iconClassName={iconClassName}
          iconName="edit"
          onAction={() => onEditItem(item.id)}
          onActionComplete={onActionComplete}
        />
      ) : null}
      {showDelete && onDeleteItem ? (
        <ActivityActionButton
          ariaLabel={deleteLabel}
          iconClassName={iconClassName}
          iconName="trash"
          onAction={() => onDeleteItem(item.id)}
          onActionComplete={onActionComplete}
        />
      ) : null}
    </>
  );
}
