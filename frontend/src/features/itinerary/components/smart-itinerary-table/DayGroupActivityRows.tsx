import type { ItineraryItem } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import { ActivityCell } from "./activity-cell";
import type { DayGroupProps } from "./day-group.types";
import {
  addStopInlineButtonClassName,
  addStopRowClassName,
  itemPlaceholderCellClassName,
  itemPlaceholderRowClassName,
} from "./smart-itinerary-table.styles";

interface DayGroupActivityRowsProps
  extends Pick<
    DayGroupProps,
    | "bookingDocs"
    | "bookingLinkItems"
    | "canEdit"
    | "itineraryLabels"
    | "locale"
    | "onAddBookingForItem"
    | "onAddNoteForItem"
    | "onAddStop"
    | "onAddSubActivity"
    | "onDeleteItem"
    | "onEditItem"
    | "onOpenItemDetails"
    | "onSaveBookingForItem"
    | "onSelectItem"
    | "onUnlinkBookingForItem"
    | "onUpdateItemInline"
    | "selectedItemId"
  > {
  childItemsByParentId: Map<string, ItineraryItem[]>;
  day: string;
  showGraph: boolean;
  visibleItems: ItineraryItem[];
}

export function DayGroupActivityRows({
  bookingDocs,
  bookingLinkItems,
  canEdit,
  childItemsByParentId,
  day,
  itineraryLabels,
  locale,
  onAddBookingForItem,
  onAddNoteForItem,
  onAddStop,
  onAddSubActivity,
  onDeleteItem,
  onEditItem,
  onOpenItemDetails,
  onSaveBookingForItem,
  onSelectItem,
  onUnlinkBookingForItem,
  onUpdateItemInline,
  selectedItemId,
  showGraph,
  visibleItems,
}: DayGroupActivityRowsProps) {
  return (
    <>
      {visibleItems.map((item) => (
        <tr
          aria-label={itineraryLabels.row.openDetails({
            activity: item.activity,
          })}
          className={itemPlaceholderRowClassName}
          data-item-id={item.id}
          data-hierarchy-level={1}
          key={item.id}
        >
          <td className={itemPlaceholderCellClassName}>
            <ActivityCell
              bookingDocs={bookingDocs}
              bookingLinkItems={bookingLinkItems}
              canEdit={canEdit}
              item={item}
              itineraryLabels={itineraryLabels}
              locale={locale}
              selected={selectedItemId === item.id}
              subItems={childItemsByParentId.get(item.id) ?? []}
              onAddBookingForItem={onAddBookingForItem}
              onAddNoteForItem={onAddNoteForItem}
              onAddSubActivity={onAddSubActivity}
              onDeleteItem={onDeleteItem}
              onEditItem={onEditItem}
              onOpenItemDetails={onOpenItemDetails}
              onSaveBookingForItem={onSaveBookingForItem}
              onSelectItem={onSelectItem}
              onUnlinkBookingForItem={onUnlinkBookingForItem}
              onUpdateItemInline={onUpdateItemInline}
            />
          </td>
        </tr>
      ))}
      <tr className={addStopRowClassName} data-day-drop={day}>
        <td colSpan={showGraph ? 1 : 2}>
          {canEdit && onAddStop ? (
            <button
              type="button"
              className={addStopInlineButtonClassName}
              onClick={() => onAddStop(day)}
            >
              <Icon name="plus" />
              <span>{itineraryLabels.addStop}</span>
            </button>
          ) : null}
        </td>
      </tr>
    </>
  );
}
