import { Icon } from "@/src/ui/icons";
import {
  addSubActivityButtonClassName,
  subActivityListClassName,
  subActivityModalListClassName,
} from "../smart-itinerary-table.styles";
import { SubActivityItem } from "./SubActivityItem";
import type { SubActivityListProps } from "./sub-activity.types";

export function SubActivityList({
  canEdit,
  item,
  itineraryLabels,
  locale,
  presentation = "inline",
  selected,
  subItems,
  visible = true,
  onAddSubActivity,
  onAddNoteForItem,
  onOpenNoteForItem,
  onAddBookingForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
  bookingDocs,
  bookingLinkItems,
  onDeleteItem,
  onEditItem,
  onUpdateItemInline,
}: SubActivityListProps) {
  const editable = canEdit && Boolean(onUpdateItemInline);
  const showAddSubActivity =
    Boolean(onAddSubActivity) &&
    (presentation === "modal" || visible || selected || subItems.length > 0);

  if (presentation === "inline" && !visible) return null;
  if (subItems.length === 0 && !showAddSubActivity) return null;

  return (
    <div
      className={
        presentation === "modal"
          ? subActivityModalListClassName
          : subActivityListClassName
      }
    >
      {subItems.map((subItem) => (
        <SubActivityItem
          bookingDocs={bookingDocs}
          bookingLinkItems={bookingLinkItems}
          editable={editable}
          itineraryLabels={itineraryLabels}
          key={subItem.id}
          locale={locale}
          onAddBookingForItem={onAddBookingForItem}
          onAddNoteForItem={onAddNoteForItem}
          onDeleteItem={onDeleteItem}
          onEditItem={onEditItem}
          onOpenNoteForItem={onOpenNoteForItem}
          onSaveBookingForItem={onSaveBookingForItem}
          onUnlinkBookingForItem={onUnlinkBookingForItem}
          onUpdateItemInline={onUpdateItemInline}
          subItem={subItem}
        />
      ))}
      {showAddSubActivity ? (
        <button
          type="button"
          className={addSubActivityButtonClassName}
          disabled={!canEdit}
          onClick={(event) => {
            event.stopPropagation();
            void onAddSubActivity?.(item.id);
          }}
        >
          <Icon name="plus" className="size-4" />
          {itineraryLabels.row.subItemQuick}
        </button>
      ) : null}
    </div>
  );
}
